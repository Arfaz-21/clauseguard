from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.policy import Policy
from app.schemas.policy import PolicyCreate, PolicyResponse

router = APIRouter(prefix="/policies", tags=["Policies"])

@router.post("/", response_model=PolicyResponse)
def create_policy(policy: PolicyCreate, db: Session = Depends(get_db)):
    new_policy = Policy(**policy.model_dump())
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy

@router.get("/user/{user_id}", response_model=List[PolicyResponse])
def get_user_policies(user_id: int, db: Session = Depends(get_db)):
    return db.query(Policy).filter(Policy.user_id == user_id).all()

@router.delete("/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(policy)
    db.commit()
    return {"message": "Policy deleted"}
