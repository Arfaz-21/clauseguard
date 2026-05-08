"""
LegalEase AI — Centralized Configuration
=========================================
All tuneable knobs for the RAG pipeline live here.
Loads secrets from .env and exposes typed constants.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parent.parent        # c:\clauseguard
ENGINE_DIR = Path(__file__).resolve().parent              # c:\clauseguard\legal_engine
DATA_DIR = ENGINE_DIR / "data"                            # PDF storage
CHROMA_DB_PATH = str(ENGINE_DIR / "legal_db")             # ChromaDB persistent storage

# ─── Load .env ────────────────────────────────────────────────────────────────
load_dotenv(ROOT_DIR / ".env")

# ─── API Keys ─────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def validate_api_key():
    """Check that the Gemini API key is set before making LLM calls."""
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_key_here":
        print("❌ GEMINI_API_KEY not set! Add it to .env file at project root.")
        print(f"   Expected location: {ROOT_DIR / '.env'}")
        sys.exit(1)
    return True

# ─── Embedding Model ─────────────────────────────────────────────────────────
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
# Produces 384-dimensional vectors — good balance of speed vs quality
# For better accuracy on legal text, consider: "multi-qa-mpnet-base-dot-v1" (768-dim)

# ─── ChromaDB ─────────────────────────────────────────────────────────────────
COLLECTION_NAME = "indian_tenancy_laws"

# ─── Chunking Parameters ─────────────────────────────────────────────────────
CHUNK_SIZE = 400          # Target tokens per chunk (~1600 chars)
CHUNK_OVERLAP = 50        # Overlap tokens between consecutive chunks
CHARS_PER_TOKEN = 4       # Rough estimate for English text
CHUNK_SIZE_CHARS = CHUNK_SIZE * CHARS_PER_TOKEN       # ~1600 characters
CHUNK_OVERLAP_CHARS = CHUNK_OVERLAP * CHARS_PER_TOKEN  # ~200 characters

# ─── Retrieval ────────────────────────────────────────────────────────────────
DEFAULT_TOP_K = 5         # Number of chunks to retrieve per query

# ─── LLM Generation ──────────────────────────────────────────────────────────
GEMINI_MODEL = "gemini-2.5-flash"
GENERATION_TEMPERATURE = 0.1    # Low temp = factual, deterministic answers
MAX_OUTPUT_TOKENS = 2048        # Max response length

# ─── Quick self-test ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🔧 LegalEase AI — Configuration Check")
    print(f"   Root dir:        {ROOT_DIR}")
    print(f"   Data dir:        {DATA_DIR}")
    print(f"   ChromaDB path:   {CHROMA_DB_PATH}")
    print(f"   Embedding model: {EMBEDDING_MODEL_NAME}")
    print(f"   Chunk size:      {CHUNK_SIZE} tokens (~{CHUNK_SIZE_CHARS} chars)")
    print(f"   Chunk overlap:   {CHUNK_OVERLAP} tokens (~{CHUNK_OVERLAP_CHARS} chars)")
    print(f"   Top-K retrieval: {DEFAULT_TOP_K}")
    print(f"   Gemini model:    {GEMINI_MODEL}")
    print(f"   API key set:     {'✅ Yes' if GEMINI_API_KEY and GEMINI_API_KEY != 'your_key_here' else '❌ No'}")
    print(f"   PDFs in data/:   {list(DATA_DIR.glob('*.pdf'))}")
