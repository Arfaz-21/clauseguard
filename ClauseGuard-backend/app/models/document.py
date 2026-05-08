from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base

class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)  # privacy_policy, terms_and_conditions, etc.
    business_data = Column(JSON, nullable=True) # The onboarding answers
    content = Column(Text, nullable=False)      # The actual document text
    recommendations = Column(JSON, nullable=True) # AI-suggested clauses or warnings
    created_at = Column(DateTime(timezone=True), server_default=func.now())
