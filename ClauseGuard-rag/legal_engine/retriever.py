import os
os.environ['ANONYMIZED_TELEMETRY'] = 'False'

from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

from legal_engine.config import (
    COLLECTION_NAME,
    CHROMA_DB_PATH,
    DEFAULT_TOP_K,
    EMBEDDING_MODEL_NAME,
)
from legal_engine.ingest_laws import get_db


# ─── Persistent DB Connection ────────────────────────────────────────────────

_client = None

def _get_client() -> chromadb.PersistentClient:
    """Safe retrieval of the ChromaDB client with telemetry hardening."""
    global _client
    if _client is None:
        try:
            _client = chromadb.PersistentClient(
                path=CHROMA_DB_PATH,
                settings=Settings(anonymized_telemetry=False)
            )
        except Exception as e:
            print(f"⚠️  ChromaDB Init Warning (Retrying...): {e}")
            # Fallback/Retry if needed
            _client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return _client


# ─── Module-level model cache ────────────────────────────────────────────────
_model = None


def _get_model() -> SentenceTransformer:
    """Lazy-load and cache the embedding model."""
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model


def retrieve(
    query: str,
    top_k: int = DEFAULT_TOP_K,
    section_filter: str | None = None,
) -> list[dict]:
    """
    Retrieve the most relevant law passages for a given query.

    Args:
        query: The search query or contract clause text
        top_k: Number of results to return (default from config)
        section_filter: Optional section number to filter by (e.g., "15")

    Returns:
        List of dicts, each containing:
        - text: The matched law passage
        - section: Section number
        - title: Section title
        - page: Page number in the PDF
        - source: Source PDF filename
        - score: Similarity score (lower = more similar in ChromaDB)
    """
    model = _get_model()
    _, collection = get_db()

    # Embed the query
    query_embedding = model.encode(query).tolist()

    # Build query parameters
    query_params = {
        "query_embeddings": [query_embedding],
        "n_results": top_k,
        "include": ["documents", "metadatas", "distances"],
    }

    # Optional metadata filtering
    if section_filter:
        query_params["where"] = {"section": str(section_filter)}

    results = collection.query(**query_params)

    # Format results
    formatted = []
    if results["ids"] and results["ids"][0]:
        for i in range(len(results["ids"][0])):
            meta = results["metadatas"][0][i]
            formatted.append({
                "text": results["documents"][0][i],
                "section": meta.get("section", "?"),
                "title": meta.get("title", "Unknown"),
                "page": meta.get("page", 0),
                "source": meta.get("source", "Unknown"),
                "score": results["distances"][0][i],
            })

    return formatted


def retrieve_for_context(query: str, top_k: int = DEFAULT_TOP_K) -> str:
    """
    Retrieve and format results as a context string for the LLM prompt.

    Returns a formatted string with numbered passages and their citations.
    """
    results = retrieve(query, top_k=top_k)

    if not results:
        return "No relevant law passages found."

    context_parts = []
    for i, r in enumerate(results, 1):
        context_parts.append(
            f"[Passage {i}] Section {r['section']} — {r['title']} "
            f"(Page {r['page']}, {r['source']})\n"
            f"{r['text']}"
        )

    return "\n\n---\n\n".join(context_parts)


# ─── Quick test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_queries = [
        "What is the maximum security deposit allowed?",
        "Who is responsible for structural repairs?",
        "How much notice is needed to terminate a tenancy?",
    ]

    for q in test_queries:
        print(f"\n🔍 Query: {q}")
        results = retrieve(q, top_k=3)
        for r in results:
            print(f"   📎 Section {r['section']} — {r['title']} (score: {r['score']:.4f})")
            print(f"      {r['text'][:150]}...")
        print()
