from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Agreement(Base):
    __tablename__ = "agreements"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    landlord_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    file_path = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=True)
    audit_result = Column(Text, nullable=True)
    status = Column(String, default="uploaded")  # uploaded, audited, signed
    created_at = Column(DateTime(timezone=True), server_default=func.now())