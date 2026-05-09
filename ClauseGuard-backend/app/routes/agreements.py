from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.agreement import Agreement
from app.schemas.agreement import AgreementResponse, AuditResultUpdate
import shutil, os, PyPDF2
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

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
        # 1. Extract text from PDF
        text = ""
        with open(file_path, "rb") as f:
            pdf = PyPDF2.PdfReader(f)
            for page in pdf.pages:
                text += page.extract_text() + "\n"
        
        # 2. Call Gemini for Audit
        if api_key and api_key != "your_api_key_here":
            model = genai.GenerativeModel('gemini-pro')
            prompt = f"""
            Analyze the following rental agreement text and provide a professional audit summary.
            Highlight:
            - Rent details and payment terms.
            - High-risk or unfair clauses (like excessive fees, pet restrictions, maintenance obligations).
            - Missing legal protections.
            - A final 'Risk Score' from 1-10.
            
            Use professional markdown formatting with icons.
            
            Agreement Text:
            {text[:4000]} # Limit to avoid token issues
            """
            response = model.generate_content(prompt)
            audit_result = response.text
        else:
            audit_result = "### ⚠️ Gemini API Key Not Configured\n\nPlease add a valid `GEMINI_API_KEY` to your backend `.env` file to see real AI analysis. For now, here is the extracted text below."

        # 3. Update Database
        agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
        if agreement:
            agreement.extracted_text = text
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