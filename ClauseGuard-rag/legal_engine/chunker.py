"""
LegalEase AI — Smart Legal Document Chunker
=============================================
Section-aware chunking for Indian legal PDFs.

Instead of splitting by pages (which mixes unrelated sections), this module:
1. Extracts full text from PDF using pdfplumber
2. Detects section boundaries using regex (e.g., "15. Security Deposit")
3. Splits by sections first, preserving headings as metadata
4. Sub-splits large sections into ~400-token chunks with overlap
5. Attaches rich metadata (section number, title, page, source)
"""

import re
from pathlib import Path

import pdfplumber

from legal_engine.config import CHUNK_SIZE_CHARS, CHUNK_OVERLAP_CHARS


# ─── Regex patterns for section detection ─────────────────────────────────────
# Matches patterns like: "15. Security Deposit" or "3. Definitions"
SECTION_PATTERN = re.compile(
    r"^(\d+)\.\s+([A-Z][A-Za-z\s,()&\-]+)",
    re.MULTILINE,
)

# Matches sub-section patterns like "(1)", "(2)", "(a)", "(b)"
SUB_SECTION_PATTERN = re.compile(r"^\(\d+\)\s+", re.MULTILINE)


def extract_text_with_pages(pdf_path: str) -> list[dict]:
    """
    Extract text from every page of a PDF, returning a list of
    {"text": ..., "page": ...} dicts.
    """
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                pages.append({"text": text.strip(), "page": i + 1})
    return pages


def _estimate_page_for_position(
    position: int, full_text: str, page_breaks: list[int], page_numbers: list[int]
) -> int:
    """Given a character position in the full concatenated text, estimate the page number."""
    for i, break_pos in enumerate(page_breaks):
        if position < break_pos:
            return page_numbers[i]
    return page_numbers[-1] if page_numbers else 1


def detect_sections(full_text: str, page_breaks: list[int], page_numbers: list[int]) -> list[dict]:
    """
    Detect section boundaries in the full text and split into sections.
    Returns list of {"section": "15", "title": "Security Deposit",
                      "text": "...", "page": 8}
    """
    matches = list(SECTION_PATTERN.finditer(full_text))

    if not matches:
        # No sections detected → treat entire text as one section
        return [{
            "section": "0",
            "title": "Full Document",
            "text": full_text,
            "page": page_numbers[0] if page_numbers else 1,
        }]

    sections = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)

        section_text = full_text[start:end].strip()
        section_num = match.group(1)
        section_title = match.group(2).strip().rstrip(".")

        page = _estimate_page_for_position(start, full_text, page_breaks, page_numbers)

        sections.append({
            "section": section_num,
            "title": section_title,
            "text": section_text,
            "page": page,
        })

    # Capture any preamble text before the first section
    if matches[0].start() > 100:  # Only if there's substantial preamble
        preamble = full_text[: matches[0].start()].strip()
        if preamble:
            sections.insert(0, {
                "section": "0",
                "title": "Preamble",
                "text": preamble,
                "page": page_numbers[0] if page_numbers else 1,
            })

    return sections


def split_into_chunks(
    text: str,
    chunk_size: int = CHUNK_SIZE_CHARS,
    overlap: int = CHUNK_OVERLAP_CHARS,
) -> list[str]:
    """
    Split text into overlapping chunks of approximately `chunk_size` characters.
    Tries to break at sentence boundaries for cleaner chunks.
    """
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size

        if end < len(text):
            # Try to find a sentence boundary (period + space) near the end
            # Search backwards from `end` up to 200 chars
            search_start = max(end - 200, start)
            last_period = text.rfind(". ", search_start, end)
            last_newline = text.rfind("\n", search_start, end)
            break_point = max(last_period, last_newline)

            if break_point > start:
                end = break_point + 1  # Include the period

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        # Move start forward, accounting for overlap
        start = end - overlap if end < len(text) else end

    return chunks


def chunk_legal_pdf(pdf_path: str) -> list[dict]:
    """
    Main entry point: takes a PDF path, returns a list of enriched chunks.

    Each chunk is a dict:
    {
        "text": "The security deposit shall not exceed...",
        "metadata": {
            "section": "15",
            "title": "Security Deposit",
            "page": 8,
            "source": "MTA_2021.pdf",
            "chunk_index": 0
        }
    }
    """
    pdf_path = str(pdf_path)
    source_name = Path(pdf_path).name

    # Step 1: Extract text with page tracking
    pages = extract_text_with_pages(pdf_path)
    if not pages:
        print(f"⚠️  No text extracted from {pdf_path}")
        return []

    # Build full text and page-break index for page number estimation
    full_text = ""
    page_breaks = []
    page_numbers = []
    for p in pages:
        full_text += p["text"] + "\n\n"
        page_breaks.append(len(full_text))
        page_numbers.append(p["page"])

    # Step 2: Detect section boundaries
    sections = detect_sections(full_text, page_breaks, page_numbers)
    print(f"📑 Detected {len(sections)} sections in {source_name}")

    # Step 3: Sub-split large sections into chunks
    all_chunks = []
    for section in sections:
        text_chunks = split_into_chunks(section["text"])

        for idx, chunk_text in enumerate(text_chunks):
            all_chunks.append({
                "text": chunk_text,
                "metadata": {
                    "section": section["section"],
                    "title": section["title"],
                    "page": section["page"],
                    "source": source_name,
                    "chunk_index": idx,
                },
            })

    print(f"✂️  Split into {len(all_chunks)} chunks (avg {sum(len(c['text']) for c in all_chunks) // max(len(all_chunks), 1)} chars/chunk)")
    return all_chunks


# ─── Quick test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    from legal_engine.config import DATA_DIR

    pdf = DATA_DIR / "MTA_2021.pdf"
    if pdf.exists():
        chunks = chunk_legal_pdf(str(pdf))
        print(f"\n📊 Total chunks: {len(chunks)}")
        if chunks:
            print(f"\n🔍 Sample chunk (first):")
            print(f"   Section: {chunks[0]['metadata']['section']} — {chunks[0]['metadata']['title']}")
            print(f"   Page: {chunks[0]['metadata']['page']}")
            print(f"   Text preview: {chunks[0]['text'][:200]}...")
    else:
        print(f"❌ PDF not found at {pdf}")
