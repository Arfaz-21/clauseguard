"""
ClauseGuard RAG Engine — Entry Point
======================================
Starts the FastAPI server with ChromaDB telemetry permanently disabled.
"""

import os
os.environ['ANONYMIZED_TELEMETRY'] = 'False'
os.environ['POSTHOG_DISABLED'] = 'true'

# Monkey-patch posthog before anything imports chromadb
try:
    import posthog
    posthog.capture = lambda *args, **kwargs: None
    posthog.identify = lambda *args, **kwargs: None
    posthog.Posthog = type('Posthog', (), {
        '__init__': lambda *a, **k: None,
        'capture': lambda *a, **k: None,
        'identify': lambda *a, **k: None,
        'shutdown': lambda *a, **k: None,
    })
except ImportError:
    pass

import uvicorn
import logging

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("clauseguard")

# Suppress noisy libraries
logging.getLogger("chromadb").setLevel(logging.ERROR)
logging.getLogger("posthog").setLevel(logging.CRITICAL)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)

if __name__ == "__main__":
    logger.info("=" * 50)
    logger.info("🛡️  CLAUSEGUARD RAG ENGINE v1.0")
    logger.info("=" * 50)

    # Diagnostics
    telemetry = os.environ.get('ANONYMIZED_TELEMETRY')
    logger.info(f"📡 Telemetry Disabled:  {'✅ Yes' if telemetry == 'False' else '❌ No'}")

    from legal_engine.config import CHROMA_DB_PATH, EMBEDDING_MODEL_NAME, GEMINI_MODEL, GEMINI_API_KEY
    logger.info(f"🗄️  Vector DB Path:     {CHROMA_DB_PATH}")
    logger.info(f"🧠 Embedding Model:    {EMBEDDING_MODEL_NAME}")
    logger.info(f"🤖 LLM Model:          {GEMINI_MODEL}")
    logger.info(f"🔑 API Key Configured: {'✅ Yes' if GEMINI_API_KEY and GEMINI_API_KEY != 'your_key_here' else '❌ No'}")

    logger.info("")
    logger.info("🚀 Starting FastAPI Server...")
    logger.info("   Docs:   http://localhost:8001/docs")
    logger.info("   Health: http://localhost:8001/api/health")
    logger.info("=" * 50)

    uvicorn.run(
        "legal_engine.api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
    )
