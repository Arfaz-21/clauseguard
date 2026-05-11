from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.agreement import Agreement
from app.schemas.agreement import AgreementResponse, AuditResultUpdate
import shutil, os, PyPDF2, httpx, json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

RAG_AGENT_URL = "http://localhost:8001/api/audit"

router = APIRouter(prefix="/agreements", tags=["Agreements"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "your_api_key_here":
    genai.configure(api_key=api_key)

# Background task to process PDF and call RAG AI
def analyze_agreement_with_ai(agreement_id: int, file_path: str):
    db = SessionLocal()
    try:
        # Stage 1: Extraction
        agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
        if agreement:
            agreement.status = "extracting"
            db.commit()

        pages = []
        full_text = ""
        with open(file_path, "rb") as f:
            pdf = PyPDF2.PdfReader(f)
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                pages.append({"page": i + 1, "text": page_text})
                full_text += page_text + "\n"
        
        # Stage 2: Analysis
        if agreement:
            agreement.status = "analyzing"
            agreement.extracted_text = full_text
            db.commit()

        # Try RAG Agent Audit
        rag_success = False
        audit_items = []
        try:
            with httpx.Client(timeout=120.0) as client:
                for p in pages:
                    if len(p["text"].strip()) < 100: continue
                    
                    # Update status progressively
                    agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
                    agreement.status = f"analyzing page {p['page']}/{len(pages)}"
                    db.commit()

                    resp = client.post(RAG_AGENT_URL, json={
                        "pages": [{"text": p["text"][:2000], "metadata": {"page": p["page"]}}]
                    })
                    
                    if resp.status_code == 200:
                        page_data = resp.json()
                        audit_items.extend(page_data.get("results", []))
                        
                        # Save partial results
                        agreement.audit_result = json.dumps({
                            "results": audit_items, 
                            "risk_score": 0 
                        })
                        db.commit()
                        rag_success = True
        except Exception as rag_err:
            print(f"Progressive RAG error: {rag_err}")

        # Finalize or Fallback
        if rag_success:
            valid_scores = [r.get("risk_score", 50) for r in audit_items]
            final_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0
            
            agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
            agreement.audit_result = json.dumps({"results": audit_items, "risk_score": final_score})
            agreement.status = "audited"
            db.commit()
        else:
            print("RAG failed or returned no results. Falling back to Gemini generative model...")
            # Fallback to basic Gemini using new SDK
            if api_key and api_key != "your_api_key_here":
                try:
                    from google import genai
                    from google.genai import types
                    client = genai.Client(api_key=api_key)
                    prompt = f"""
                    Analyze the following agreement text and provide a professional, structured audit summary.
                    You MUST respond with VALID JSON exactly matching this structure, and do NOT wrap it in markdown block quotes.
                    ## Your Objective
                    Act as a "Risk Filter." If a clause is standard, fair, and reasonable, DO NOT audit it. Only flag clauses that are one-sided, unfair, restrictive, or create dangerous liability for the user.

                    ## Classification Taxonomy
                    - **Liability**, **Indemnification**, **Termination**, **Notice Period**, **Payment Terms**, **Late Penalty**, **Data Privacy**, **Arbitration**, **Jurisdiction**, **Auto Renewal**, **Intellectual Property**, **Non-Compete**.

                    Respond in valid JSON:
                    {{
                        "overall_summary": {{
                            "contract_type": "e.g., Residential Lease, SaaS Agreement",
                            "executive_summary": "A 2-3 sentence overview of the document's fairness.",
                            "key_red_flags": ["Bullet point 1", "Bullet point 2"],
                            "financial_concerns": "Summary of costs, deposits, or penalties."
                        }},
                        "results": [
                            {{
                                "clause_category": "[From Taxonomy Above]",
                                "short_summary": "Professional title (e.g. 'Unfair Liability Cap')",
                                "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
                                "clause": "VERBATIM sentence from text.",
                                "explanation": {{
                                    "simplified": "WHAT it does and WHY it is risky. Wrap keywords in **bold**.",
                                    "why_it_risky": "REAL-WORLD CONSEQUENCE (e.g., 'You could be held liable for unlimited damages')."
                                }},
                                "suggestion": "A fair, legally-balanced alternative clause."
                            }}
                        ]
                    }}

                    Agreement Text:
                    {full_text[:8000]}
                    """
                    
                    response = client.models.generate_content(
                        model='gemini-1.5-flash-8b',
                        contents=prompt,
                    )
                    raw_text = response.text.strip()
                    if raw_text.startswith("```json"):
                        raw_text = raw_text[7:-3].strip()
                    elif raw_text.startswith("```"):
                        raw_text = raw_text[3:-3].strip()
                        
                    try:
                        parsed_json = json.loads(raw_text)
                        audit_result = json.dumps(parsed_json)
                    except json.JSONDecodeError as e:
                        print(f"Fallback Gemini returned invalid JSON: {e}")
                        audit_result = json.dumps({
                            "results": [
                                {
                                    "clause_category": "General Document Analysis",
                                    "risk_level": "MEDIUM",
                                    "explanation": {
                                        "simplified": "The AI provided a response, but it was not structured properly. Here is the raw text:",
                                        "why_it_risky": raw_text[:500]
                                    },
                                    "suggestion": "Please review the document manually."
                                }
                            ]
                        })
                except Exception as api_err:
                    print(f"Fallback Gemini API error: {api_err}")
                    audit_result = json.dumps({
                        "results": [
                            {
                                "clause_category": "System Error",
                                "risk_level": "CRITICAL",
                                "explanation": {
                                    "simplified": "Something went wrong while communicating with the AI agent.",
                                    "why_it_risky": str(api_err)
                                },
                                "suggestion": "Please try uploading again or contact support."
                            }
                        ]
                    })
            else:
                audit_result = json.dumps({"results": [{"clause_category": "API Key Missing", "risk_level": "HIGH", "explanation": {"simplified": "AI Service Not Configured", "why_it_risky": "Missing GEMINI_API_KEY"}, "suggestion": "Add GEMINI_API_KEY to .env"}]})
            
            agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
            if agreement:
                agreement.audit_result = audit_result
                agreement.status = "audited"
                db.commit()

    except Exception as e:
        print(f"CRITICAL Error in AI analysis: {e}")
        agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
        if agreement:
            agreement.status = "error"
            db.commit()
    finally:
        db.close()

# Upload a rental agreement PDF
@router.post("/upload/{tenant_id}", response_model=AgreementResponse)
def upload_agreement(tenant_id: int, background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith('.pdf') and file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Invalid file format. Only PDF files are allowed.")
    
    # Check file size (approximate) - e.g., max 10MB
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    file_path = f"{UPLOAD_DIR}/{tenant_id}_{file.filename}"
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        print(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file on the server: {str(e)}")
    
    agreement = Agreement(tenant_id=tenant_id, file_path=file_path, status="uploaded")
    db.add(agreement)
    db.commit()
    db.refresh(agreement)
    
    # Start AI analysis in the background
    background_tasks.add_task(analyze_agreement_with_ai, agreement.id, file_path)
    return agreement

# Re-trigger audit for an existing agreement
@router.post("/{agreement_id}/re-audit", response_model=AgreementResponse)
def re_audit_agreement(agreement_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    
    agreement.status = "uploaded"
    agreement.audit_result = None
    db.commit()
    
    background_tasks.add_task(analyze_agreement_with_ai, agreement.id, agreement.file_path)
    return agreement

# Get agreement details
@router.get("/{agreement_id}", response_model=AgreementResponse)
def get_agreement(agreement_id: int, db: Session = Depends(get_db)):
    agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    return agreement

# Get all agreements for a tenant
@router.get("/tenant/{tenant_id}", response_model=list[AgreementResponse])
def get_tenant_agreements(tenant_id: int, db: Session = Depends(get_db)):
    return db.query(Agreement).filter(Agreement.tenant_id == tenant_id).all()