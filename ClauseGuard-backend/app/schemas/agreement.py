from pydantic import BaseModel
from typing import Optional

class AgreementResponse(BaseModel):
    id: int
    tenant_id: int
    file_path: Optional[str]
    audit_result: Optional[str]
    status: str

    class Config:
        from_attributes = True

class AuditResultUpdate(BaseModel):
    audit_result: str
    extracted_text: Optional[str] = None