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
            # Fallback to basic Gemini
            audit_result = ""
            if api_key and api_key != "your_api_key_here":
                model = genai.GenerativeModel('gemini-flash-latest')
                prompt = f"""
                Analyze the following rental agreement text and provide a professional audit summary.
                Agreement Text:
                {full_text[:4000]}
                """
                response = model.generate_content(prompt)
                audit_result = response.text
            else:
                audit_result = "### ⚠️ AI Service Not Configured\n\nPlease add a valid `GEMINI_API_KEY` to your `.env` and ensure the RAG agent is running."
            
            agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
            if agreement:
                agreement.audit_result = audit_result
                agreement.status = "audited"
                db.commit()

    except Exception as e:
        print(f"Error in AI analysis: {e}")
        agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
        if agreement:
            agreement.status = "error"
            db.commit()
    finally:
        db.close()

# Upload a rental agreement PDF
@router.post("/upload/{tenant_id}", response_model=AgreementResponse)
def upload_agreement(tenant_id: int, background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = f"{UPLOAD_DIR}/{tenant_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
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