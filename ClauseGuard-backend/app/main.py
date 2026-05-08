from fastapi import FastAPI
from app.database import Base, engine
from app.routes import users, agreements
from app.routes import dispute as dispute_router, alert as alert_router
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LegalEase AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(agreements.router)
app.include_router(dispute_router.router)
app.include_router(alert_router.router)

@app.get("/")
def root():
    return {"message": "LegalEase AI Backend is running ✅"}