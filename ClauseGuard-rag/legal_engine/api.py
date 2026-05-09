"""
LegalEase AI — FastAPI REST API
=================================
Exposes all RAG functionality as REST endpoints.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from legal_engine.config import COLLECTION_NAME, CHROMA_DB_PATH
from legal_engine.ingest_laws import get_db, ingest_all
from legal_engine.retriever import retrieve
from legal_engine.generator import generate_answer
from legal_engine.clause_auditor import audit_clause, audit_agreement
from legal_engine.dispute_triage import triage_dispute

# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="LegalEase AI",
    description="RAG-powered legal assistant for Indian tenancy law",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str = Field(..., description="Legal question to answer")
    top_k: int = Field(default=5, description="Number of passages to retrieve")

class PageContent(BaseModel):
    text: str
    metadata: dict

class AuditRequest(BaseModel):
    clauses: list[str] = Field(default=[], description="List of contract clauses to audit")
    pages: list[PageContent] = Field(default=[], description="List of pages with metadata")

class DisputeRequest(BaseModel):
    landlord_statement: str = Field(..., description="Landlord's account")
    tenant_statement: str = Field(..., description="Tenant's account")
    contract_clauses: list[str] | None = Field(default=None, description="Relevant contract clauses")

class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    top_k: int = Field(default=5)
    section_filter: str | None = Field(default=None)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Health check + database stats."""
    try:
        _, collection = get_db()
        count = collection.count()
        return {
            "status": "healthy",
            "collection": COLLECTION_NAME,
            "document_count": count,
            "db_path": CHROMA_DB_PATH,
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@app.post("/api/ingest")
async def ingest_endpoint():
    """Ingest all PDFs in the data directory."""
    try:
        ingest_all()
        _, collection = get_db()
        return {
            "status": "success",
            "message": "Ingestion complete",
            "document_count": collection.count(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search")
async def search_endpoint(req: SearchRequest):
    """Semantic search over the law database (retrieval only, no LLM)."""
    try:
        results = retrieve(req.query, top_k=req.top_k, section_filter=req.section_filter)
        return {"query": req.query, "results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query")
async def query_endpoint(req: QueryRequest):
    """Ask a legal question — full RAG (retrieve + generate)."""
    try:
        answer = generate_answer(req.question)
        return {"question": req.question, "answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/audit")
async def audit_endpoint(req: AuditRequest):
    """Audit contract clauses for legal compliance with location tracking."""
    try:
        if req.pages:
            # New page-aware audit
            results = []
            for page in req.pages:
                res = audit_clause(page.text)
                res["location"] = page.metadata
                results.append(res)
            
            # Summary statistics
            risk_score = sum(r.get("risk_score", 50) for r in results) / len(results) if results else 0
            return {
                "risk_score": risk_score,
                "results": results
            }
        
        if len(req.clauses) == 1:
            result = audit_clause(req.clauses[0])
            return {"results": [result], "total_clauses": 1}
        else:
            report = audit_agreement(req.clauses)
            return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/dispute")
async def dispute_endpoint(req: DisputeRequest):
    """Submit a dispute for AI triage."""
    try:
        result = triage_dispute(
            landlord_statement=req.landlord_statement,
            tenant_statement=req.tenant_statement,
            contract_clauses=req.contract_clauses,
        )
        return {"dispute_analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
