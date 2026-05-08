from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.alert import Alert
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/alerts", tags=["Alerts"])

class AlertCreate(BaseModel):
    agreement_id: int
    user_id: int
    alert_type: str
    alert_date: datetime
    message: str

@router.post("/")
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    new_alert = Alert(**alert.dict())
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

@router.get("/user/{user_id}")
def get_user_alerts(user_id: int, db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.user_id == user_id).all()
    return alerts