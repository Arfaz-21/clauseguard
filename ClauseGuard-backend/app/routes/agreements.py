from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.agreement import Agreement
from app.schemas.agreement import AgreementResponse, AuditResultUpdate
import shutil, os

router = APIRouter(prefix="/agreements", tags=["Agreements"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Upload a rental agreement PDF
@router.post("/upload/{tenant_id}", response_model=AgreementResponse)
def upload_agreement(tenant_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = f"{UPLOAD_DIR}/{tenant_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    agreement = Agreement(tenant_id=tenant_id, file_path=file_path, status="uploaded")
    db.add(agreement)
    db.commit()
    db.refresh(agreement)
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