from fastapi import FastAPI
from app.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

# Import routes with aliases to avoid confusion with models
from app.routes import users, agreements, policies, documents
from app.routes import dispute as dispute_router
from app.routes import alert as alert_router
from app.routes import built_agreement as built_agreement_router

# Import models so tables get created
from app.models import user, agreement, dispute, alert, built_agreement, document, policy

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ClauseGuard Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_methods=["*"],
)

app.include_router(users.router)
app.include_router(agreements.router)
app.include_router(policies.router)
app.include_router(documents.router)
app.include_router(dispute_router.router)
app.include_router(alert_router.router)
app.include_router(built_agreement_router.router)

@app.get("/")
def root():
    return {"message": "ClauseGuard Backend is running ✅"}