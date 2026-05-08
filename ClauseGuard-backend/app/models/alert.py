from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    agreement_id = Column(Integer, ForeignKey("agreements.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alert_type = Column(String, nullable=False)  # rent_due, lease_expiry, escalation
    alert_date = Column(DateTime, nullable=False)
    message = Column(String, nullable=False)
    sent = Column(String, default="pending")  # pending, sent
    created_at = Column(DateTime(timezone=True), server_default=func.now())