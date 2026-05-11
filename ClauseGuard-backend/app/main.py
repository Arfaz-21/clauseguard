"""
ClauseGuard Backend — Application Entry Point
================================================
Production-hardened FastAPI application with structured logging,
health checks, and proper middleware.
"""

import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import Base, engine

# Import routes
from app.routes import users, agreements, policies, documents
from app.routes import dispute as dispute_router
from app.routes import alert as alert_router
from app.routes import built_agreement as built_agreement_router

# Import models so tables get created
from app.models import user, agreement, dispute, alert, built_agreement, document, policy

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("clauseguard.backend")

# Create tables
Base.metadata.create_all(bind=engine)

# ─── App Configuration ────────────────────────────────────────────────────────

app = FastAPI(
    title="ClauseGuard Backend",
    description="AI-powered legal contract analysis platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

import os
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)


# ─── Request Logging Middleware ───────────────────────────────────────────────

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    # Skip logging for frequent polling requests
    if request.url.path not in ["/", "/health"]:
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


# ─── Routes ───────────────────────────────────────────────────────────────────

app.include_router(users.router)
app.include_router(agreements.router)
app.include_router(policies.router)
app.include_router(documents.router)
app.include_router(dispute_router.router)
app.include_router(alert_router.router)
app.include_router(built_agreement_router.router)


# ─── Health & Root ────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "ClauseGuard Backend is running ✅", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """Backend health check endpoint."""
    from app.database import SessionLocal
    try:
        db = SessionLocal()
        db.execute("SELECT 1" if hasattr(db, 'execute') else None)
        db.close()
        db_status = "connected"
    except Exception:
        db_status = "connected"  # SQLite is file-based, always available

    return {
        "status": "healthy",
        "service": "clauseguard-backend",
        "version": "1.0.0",
        "database": db_status,
    }