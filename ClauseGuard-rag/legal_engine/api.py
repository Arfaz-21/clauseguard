"""
ClauseGuard RAG — FastAPI REST API
====================================
Exposes all RAG functionality as REST endpoints.
Production-hardened with structured logging, CORS, and health checks.
"""

import os
os.environ['ANONYMIZED_TELEMETRY'] = 'False'
os.environ['POSTHOG_DISABLED'] = 'true'

# Monkey-patch posthog to kill telemetry in worker processes
try:
    import posthog
    posthog.capture = lambda *args, **kwargs: None
    posthog.identify = lambda *args, **kwargs: None
except ImportError:
    pass

import logging
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logging.getLogger('chromadb').setLevel(logging.ERROR)
logging.getLogger('posthog').setLevel(logging.CRITICAL)

logger = logging.getLogger("clauseguard.api")

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from legal_engine.config import COLLECTION_NAME, CHROMA_DB_PATH, GEMINI_API_KEY, GEMINI_MODEL
from legal_engine.ingest_laws import get_db, ingest_all
from legal_engine.retriever import retrieve
from legal_engine.generator import generate_answer
from legal_engine.clause_auditor import audit_clause, audit_agreement
from legal_engine.dispute_triage import triage_dispute

# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="ClauseGuard RAG Engine",
    description="RAG-powered legal assistant for Indian tenancy law",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend origins
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request Logging Middleware ───────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration:.0f}ms)")
    return response


# ─── Global Error Handler ─────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."},
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

class ChatRequest(BaseModel):
    question: str = Field(..., description="User's question about the contract")
    document_text: str = Field(..., description="Full text of the contract for context")

class RephraseRequest(BaseModel):
    clause_text: str = Field(..., description="The clause to rephrase")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Comprehensive health check — database, model, and API status."""
    health = {
        "status": "healthy",
        "service": "clauseguard-rag",
        "version": "1.0.0",
        "gemini_model": GEMINI_MODEL,
        "api_key_set": bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_key_here"),
    }
    try:
        _, collection = get_db()
        health["vector_db"] = {
            "status": "connected",
            "collection": COLLECTION_NAME,
            "document_count": collection.count(),
            "db_path": CHROMA_DB_PATH,
        }
    except Exception as e:
        health["status"] = "degraded"
        health["vector_db"] = {"status": "error", "error": str(e)}

    return health


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """Chat with a specific document context + Legal RAG."""
    try:
        from legal_engine.generator import chat_with_document
        answer = chat_with_document(req.question, req.document_text)
        return answer
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rephrase")
async def rephrase_endpoint(req: RephraseRequest):
    """Suggest a fairer version of a risky clause."""
    try:
        from legal_engine.generator import rephrase_clause
        result = rephrase_clause(req.clause_text)
        return result
    except Exception as e:
        logger.error(f"Rephrase endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
        logger.error(f"Ingest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/search")
async def search_endpoint(req: SearchRequest):
    """Semantic search over the law database (retrieval only, no LLM)."""
    try:
        results = retrieve(req.query, top_k=req.top_k, section_filter=req.section_filter)
        return {"query": req.query, "results": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query")
async def query_endpoint(req: QueryRequest):
    """Ask a legal question — full RAG (retrieve + generate)."""
    try:
        answer = generate_answer(req.question)
        return {"question": req.question, "answer": answer}
    except Exception as e:
        logger.error(f"Query error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/audit")
async def audit_endpoint(req: AuditRequest):
    """Audit contract clauses for legal compliance with location tracking."""
    try:
        if req.pages:
            from concurrent.futures import ThreadPoolExecutor

            def audit_page(page):
                res = audit_clause(page.text)
                res["location"] = page.metadata
                return res

            with ThreadPoolExecutor(max_workers=5) as executor:
                results = list(executor.map(audit_page, req.pages))

            valid_results = [r for r in results if "risk_score" in r or "verdict" in r]
            risk_score = sum(r.get("risk_score", 50) for r in valid_results) / len(valid_results) if valid_results else 0
            return {"risk_score": risk_score, "results": results}

        if len(req.clauses) == 1:
            result = audit_clause(req.clauses[0])
            return {"results": [result], "total_clauses": 1}
        else:
            report = audit_agreement(req.clauses)
            return report
    except Exception as e:
        logger.error(f"Audit error: {e}")
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
        logger.error(f"Dispute error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
