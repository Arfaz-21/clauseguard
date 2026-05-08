from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class DocumentGenerateRequest(BaseModel):
    user_id: int
    doc_type: str
    business_data: Dict[str, Any]

class DocumentResponse(BaseModel):
    id: int
    user_id: int
    title: str
    doc_type: str
    content: str
    recommendations: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True
