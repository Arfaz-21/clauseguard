import os
os.environ['ANONYMIZED_TELEMETRY'] = 'False'

import time
from pathlib import Path

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from legal_engine.config import (
    CHROMA_DB_PATH,
    COLLECTION_NAME,
    DATA_DIR,
    EMBEDDING_MODEL_NAME,
)
from legal_engine.chunker import chunk_legal_pdf


# ─── Singleton Database Connection ────────────────────────────────────────────
_client = None

def get_db():
    """Get or create the ChromaDB collection with safe singleton pattern."""
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=CHROMA_DB_PATH,
            settings=Settings(anonymized_telemetry=False)
        )
    
    collection = _client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "Indian tenancy law embeddings"},
    )
    return _client, collection


def _delete_source_docs(collection, source_name: str):
    """Remove all existing documents from a given source (for re-ingestion)."""
    try:
        existing = collection.get(where={"source": source_name})
        if existing["ids"]:
            collection.delete(ids=existing["ids"])
            print(f"🗑️  Removed {len(existing['ids'])} old chunks from '{source_name}'")
    except Exception:
        pass  # Collection might be empty or metadata filter unsupported


def ingest_pdf(pdf_path: str, model: SentenceTransformer = None, collection=None):
    """
    Ingest a single PDF into ChromaDB with smart chunking.

    Args:
        pdf_path: Path to the PDF file
        model: Pre-loaded SentenceTransformer (pass to reuse across PDFs)
        collection: Pre-loaded ChromaDB collection
    """
    start_time = time.time()
    pdf_path = str(pdf_path)
    source_name = Path(pdf_path).name

    print(f"\n{'='*60}")
    print(f"📄 Ingesting: {source_name}")
    print(f"{'='*60}")

    # Load model if not provided
    if model is None:
        print(f"🧠 Loading embedding model: {EMBEDDING_MODEL_NAME}...")
        model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    # Get collection if not provided
    if collection is None:
        _, collection = get_db()

    # Step 1: Smart chunking
    chunks = chunk_legal_pdf(pdf_path)
    if not chunks:
        print("❌ No chunks produced — skipping")
        return 0

    # Step 2: Remove old documents from this source
    _delete_source_docs(collection, source_name)

    # Step 3: Batch embed all chunk texts
    print(f"🔢 Embedding {len(chunks)} chunks...")
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=32)
    embeddings_list = [emb.tolist() for emb in embeddings]

    # Step 4: Build IDs, documents, and metadata for ChromaDB
    ids = []
    documents = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        meta = chunk["metadata"]
        chunk_id = f"{source_name}_s{meta['section']}_c{meta['chunk_index']}_{i}"
        ids.append(chunk_id)
        documents.append(chunk["text"])
        metadatas.append({
            "section": str(meta["section"]),
            "title": meta["title"],
            "page": meta["page"],
            "source": meta["source"],
            "chunk_index": meta["chunk_index"],
        })

    # Step 5: Upsert into ChromaDB (batch)
    # ChromaDB has a batch limit, so we chunk the upsert
    BATCH_SIZE = 100
    for batch_start in range(0, len(ids), BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, len(ids))
        collection.upsert(
            ids=ids[batch_start:batch_end],
            embeddings=embeddings_list[batch_start:batch_end],
            documents=documents[batch_start:batch_end],
            metadatas=metadatas[batch_start:batch_end],
        )

    elapsed = time.time() - start_time
    print(f"✅ Ingested {len(chunks)} chunks from {source_name} in {elapsed:.1f}s")
    return len(chunks)


def ingest_all():
    """Ingest all PDFs in the data directory."""
    print("🚀 LegalEase AI — Law Ingestion Pipeline")
    print(f"   Data directory: {DATA_DIR}")
    print(f"   ChromaDB path:  {CHROMA_DB_PATH}")
    print()

    pdfs = list(DATA_DIR.glob("*.pdf"))
    if not pdfs:
        print(f"❌ No PDFs found in {DATA_DIR}")
        return

    print(f"📚 Found {len(pdfs)} PDF(s): {[p.name for p in pdfs]}")

    # Load model once, reuse for all PDFs
    print(f"\n🧠 Loading embedding model: {EMBEDDING_MODEL_NAME}...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    _, collection = get_db()

    total_chunks = 0
    for pdf in pdfs:
        total_chunks += ingest_pdf(str(pdf), model=model, collection=collection)

    print(f"\n{'='*60}")
    print(f"🎉 Done! Total chunks indexed: {total_chunks}")
    print(f"   Collection '{COLLECTION_NAME}' now has {collection.count()} documents")
    print(f"{'='*60}")


if __name__ == "__main__":
    ingest_all()