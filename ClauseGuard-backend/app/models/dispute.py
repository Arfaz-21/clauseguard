from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    agreement_id = Column(Integer, ForeignKey("agreements.id"), nullable=False)
    raised_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(Text, nullable=False)
    ai_assessment = Column(Text, nullable=True)
    status = Column(String, default="open")  # open, resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())