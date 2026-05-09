"""
LegalEase AI — Entry Point
============================
Start the FastAPI server.
"""

import uvicorn

if __name__ == "__main__":
    print("🚀 Starting ClauseGuard server...")
    print("   Docs: http://localhost:8001/docs")
    print("   Health: http://localhost:8001/api/health")
    uvicorn.run(
        "legal_engine.api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )
