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
        try:
            # Send chunks with page metadata
            audit_payload = []
            for p in pages:
                if len(p["text"].strip()) > 100: # Only audit substantial pages
                    audit_payload.append({
                        "text": p["text"][:2000], 
                        "metadata": {"page": p["page"]}
                    })
            
            with httpx.Client(timeout=120.0) as client:
                # We'll call a new bulk audit endpoint or just send the list
                resp = client.post(RAG_AGENT_URL, json={"pages": audit_payload})
                if resp.status_code == 200:
                    audit_result = json.dumps(resp.json())
                    rag_success = True
        except Exception as rag_err:
            print(f"RAG Agent unavailable: {rag_err}")

        # 3. Fallback to basic Gemini if RAG failed
        if not rag_success:
            if api_key and api_key != "your_api_key_here":
                model = genai.GenerativeModel('gemini-flash-latest')
                prompt = f"""
                Analyze the following rental agreement text and provide a professional audit summary.
                Agreement Text:
                {text[:4000]}
                """
                response = model.generate_content(prompt)
                audit_result = response.text
            else:
                audit_result = "### ⚠️ AI Service Not Configured\n\nPlease add a valid `GEMINI_API_KEY` to your `.env` and ensure the RAG agent is running."

        # 3. Update Database
        agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
        if agreement:
            agreement.extracted_text = full_text
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

# AI teammates call this to save audit results
@router.patch("/{agreement_id}/audit", response_model=AgreementResponse)
def save_audit_result(agreement_id: int, data: AuditResultUpdate, db: Session = Depends(get_db)):
    agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    agreement.audit_result = data.audit_result
    agreement.extracted_text = data.extracted_text
    agreement.status = "audited"
    db.commit()
    db.refresh(agreement)
    return agreement

# Get a single agreement
@router.get("/{agreement_id}", response_model=AgreementResponse)
def get_agreement(agreement_id: int, db: Session = Depends(get_db)):
    agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    return agreement

# Get all agreements for a tenant
@router.get("/tenant/{tenant_id}")
def get_tenant_agreements(tenant_id: int, db: Session = Depends(get_db)):
    agreements = db.query(Agreement).filter(Agreement.tenant_id == tenant_id).all()
    return agreements