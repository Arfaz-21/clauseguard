from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PolicyCreate(BaseModel):
    user_id: int
    name: str
    description: Optional[str] = None
    rules: Optional[str] = None

class PolicyResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    rules: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
