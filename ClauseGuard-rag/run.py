"""
LegalEase AI — Entry Point
============================
Start the FastAPI server.
"""

import uvicorn

if __name__ == "__main__":
    print("🚀 Starting LegalEase AI server...")
    print("   Docs: http://localhost:8000/docs")
    print("   Health: http://localhost:8000/api/health")
    uvicorn.run(
        "legal_engine.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
