from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.built_agreement import BuiltAgreement
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/builder", tags=["Agreement Builder"])

class BuilderCreate(BaseModel):
    tenant_id: int
    landlord_name: Optional[str] = None
    property_address: Optional[str] = None
    rent_amount: Optional[str] = None
    lease_start: Optional[str] = None
    lease_end: Optional[str] = None
    language: Optional[str] = "english"
    generated_text: str  # AI sends the full generated agreement here

class BuilderResponse(BaseModel):
    id: int
    tenant_id: int
    landlord_name: Optional[str]
    property_address: Optional[str]
    rent_amount: Optional[str]
    language: str
    generated_text: Optional[str]
    status: str

    class Config:
        from_attributes = True

# AI teammate calls this to save generated agreement
@router.post("/", response_model=BuilderResponse)
def save_built_agreement(data: BuilderCreate, db: Session = Depends(get_db)):
    new_agreement = BuiltAgreement(**data.dict())
    db.add(new_agreement)
    db.commit()
    db.refresh(new_agreement)
    return new_agreement

# Frontend calls this to display the agreement
@router.get("/{agreement_id}", response_model=BuilderResponse)
def get_built_agreement(agreement_id: int, db: Session = Depends(get_db)):
    agreement = db.query(BuiltAgreement).filter(BuiltAgreement.id == agreement_id).first()
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")
    return agreement

# Get all agreements built by a tenant
@router.get("/tenant/{tenant_id}")
def get_tenant_built_agreements(tenant_id: int, db: Session = Depends(get_db)):
    agreements = db.query(BuiltAgreement).filter(BuiltAgreement.tenant_id == tenant_id).all()
    return agreements