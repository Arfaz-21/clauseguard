from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class BuiltAgreement(Base):
    __tablename__ = "built_agreements"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    landlord_name = Column(String, nullable=True)
    property_address = Column(String, nullable=True)
    rent_amount = Column(String, nullable=True)
    lease_start = Column(String, nullable=True)
    lease_end = Column(String, nullable=True)
    language = Column(String, default="english")  # english, hindi, kannada, tamil
    generated_text = Column(Text, nullable=True)   # full AI-generated agreement
    status = Column(String, default="generated")   # generated, signed
    created_at = Column(DateTime(timezone=True), server_default=func.now())