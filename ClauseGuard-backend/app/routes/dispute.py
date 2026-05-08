from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dispute import Dispute
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/disputes", tags=["Disputes"])

class DisputeCreate(BaseModel):
    agreement_id: int
    raised_by: int
    description: str

class DisputeUpdate(BaseModel):
    ai_assessment: Optional[str] = None
    status: Optional[str] = None

@router.post("/")
def create_dispute(dispute: DisputeCreate, db: Session = Depends(get_db)):
    new_dispute = Dispute(**dispute.dict())
    db.add(new_dispute)
    db.commit()
    db.refresh(new_dispute)
    return new_dispute

@router.patch("/{dispute_id}")
def update_dispute(dispute_id: int, data: DisputeUpdate, db: Session = Depends(get_db)):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if data.ai_assessment:
        dispute.ai_assessment = data.ai_assessment
    if data.status:
        dispute.status = data.status
    db.commit()
    db.refresh(dispute)
    return dispute

@router.get("/{dispute_id}")
def get_dispute(dispute_id: int, db: Session = Depends(get_db)):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return dispute