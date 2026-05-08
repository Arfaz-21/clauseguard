"""
LegalEase AI — LLM Generation with Google Gemini
==================================================
Takes retrieved law passages + user query and produces
structured, legally-grounded answers using Gemini 2.0 Flash.
"""

import json

from google import genai
from google.genai import types

from legal_engine.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GENERATION_TEMPERATURE,
    MAX_OUTPUT_TOKENS,
    validate_api_key,
)
from legal_engine.retriever import retrieve_for_context

# ─── System Prompts ──────────────────────────────────────────────────────────

LEGAL_QA_SYSTEM_PROMPT = """You are **LegalEase AI**, an expert assistant on Indian tenancy and rental law, specifically the Model Tenancy Act (MTA) 2021 and related state laws.

## Your Role
- Provide accurate, well-cited legal information based ONLY on the law passages provided in the context.
- Always cite specific sections (e.g., "Section 15(2) of the Model Tenancy Act 2021").
- If the context doesn't contain enough information to answer, say so clearly — never fabricate law.
- Distinguish between "legal information" (what the law says) and "legal advice" (what someone should do).

## Response Format
Respond in valid JSON with this structure:
{
    "verdict": "Brief one-line answer",
    "explanation": "Detailed explanation citing specific sections",
    "references": [
        {"section": "Section X", "summary": "What this section says"}
    ],
    "disclaimer": "This is legal information, not legal advice. Consult a licensed advocate for your specific situation."
}

## Rules
1. Base answers ONLY on the provided context passages
2. Always include section numbers when citing law
3. Use clear, simple language accessible to non-lawyers
4. If a question is outside the scope of tenancy law, state that clearly
5. Never provide opinions — only cite what the law states"""

CLAUSE_AUDIT_SYSTEM_PROMPT = """You are **LegalEase AI Clause Auditor**, analyzing rental agreement clauses for legal compliance under Indian tenancy law (Model Tenancy Act 2021).

## Your Task
Given a contract clause and relevant law passages, determine if the clause is legally compliant.

## Response Format
Respond in valid JSON:
{
    "verdict": "COMPLIANT" | "NON_COMPLIANT" | "NEEDS_REVIEW",
    "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    "explanation": "Why this clause is or isn't compliant, citing specific sections",
    "law_reference": "The specific MTA section(s) that apply",
    "suggestion": "How to fix non-compliant clauses (if applicable)"
}

## Rules
1. COMPLIANT = clause aligns with MTA provisions
2. NON_COMPLIANT = clause clearly violates MTA provisions
3. NEEDS_REVIEW = clause is ambiguous or not covered by MTA
4. Be specific about WHY a clause violates the law
5. Always suggest a compliant alternative for NON_COMPLIANT clauses"""

DISPUTE_TRIAGE_SYSTEM_PROMPT = """You are **LegalEase AI Dispute Referee**, mediating landlord-tenant disputes using Indian tenancy law (Model Tenancy Act 2021).

## Your Task
Given statements from both parties and relevant law, provide a neutral, law-based analysis.

## Response Format
Respond in valid JSON:
{
    "summary": "Neutral summary of the dispute",
    "analysis": "Legal analysis citing specific MTA sections",
    "suggested_resolution": "Fair resolution based on law",
    "party_obligations": {
        "landlord": "What the law says the landlord must do",
        "tenant": "What the law says the tenant must do"
    },
    "references": [
        {"section": "Section X", "summary": "Relevant provision"}
    ],
    "disclaimer": "This is legal information for guidance only. For binding resolution, approach the Rent Authority or Rent Court as established under Section 30-43 of MTA 2021."
}

## Rules
1. Remain NEUTRAL — do not favor either party
2. Base analysis ONLY on the law, not personal judgment
3. Cite specific MTA sections for every claim
4. If the dispute falls outside MTA scope, state that clearly
5. Always mention the proper legal forum (Rent Authority/Rent Court) for formal resolution"""


# ─── Gemini Client ────────────────────────────────────────────────────────────

def _get_client() -> genai.Client:
    """Get a configured Gemini client."""
    validate_api_key()
    return genai.Client(api_key=GEMINI_API_KEY)


def _call_gemini(system_prompt: str, user_message: str) -> dict:
    """
    Make a call to Gemini and parse the JSON response.
    
    Returns the parsed JSON dict, or a fallback error dict.
    """
    client = _get_client()

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=GENERATION_TEMPERATURE,
            max_output_tokens=MAX_OUTPUT_TOKENS,
            response_mime_type="application/json",
        ),
    )

    # Parse JSON response
    raw_text = response.text.strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        # Try to extract JSON from markdown code blocks
        if "```json" in raw_text:
            json_str = raw_text.split("```json")[1].split("```")[0].strip()
            return json.loads(json_str)
        elif "```" in raw_text:
            json_str = raw_text.split("```")[1].split("```")[0].strip()
            return json.loads(json_str)
        else:
            return {
                "verdict": "Error parsing response",
                "explanation": raw_text,
                "references": [],
                "disclaimer": "Response could not be parsed as JSON.",
            }


# ─── Public API ───────────────────────────────────────────────────────────────

def generate_answer(query: str, context: str = None) -> dict:
    """
    Answer a legal question using RAG (retrieve + generate).

    Args:
        query: The legal question to answer
        context: Pre-built context string (if None, auto-retrieves)

    Returns:
        Dict with verdict, explanation, references, disclaimer
    """
    if context is None:
        context = retrieve_for_context(query)

    user_message = (
        f"## Context — Relevant Law Passages\n\n{context}\n\n"
        f"## Question\n\n{query}"
    )

    return _call_gemini(LEGAL_QA_SYSTEM_PROMPT, user_message)


def audit_clause_llm(clause: str, context: str = None) -> dict:
    """
    Audit a single contract clause against the law.

    Args:
        clause: The contract clause text to audit
        context: Pre-built context string (if None, auto-retrieves)

    Returns:
        Dict with verdict, risk_level, explanation, law_reference, suggestion
    """
    if context is None:
        context = retrieve_for_context(
            f"Is this clause legal under Indian tenancy law: {clause}"
        )

    user_message = (
        f"## Context — Relevant Law Passages\n\n{context}\n\n"
        f"## Clause to Audit\n\n{clause}"
    )

    return _call_gemini(CLAUSE_AUDIT_SYSTEM_PROMPT, user_message)


def triage_dispute_llm(
    landlord_statement: str,
    tenant_statement: str,
    contract_clauses: list[str] = None,
    context: str = None,
) -> dict:
    """
    Triage a landlord-tenant dispute using law.

    Args:
        landlord_statement: Landlord's account of the dispute
        tenant_statement: Tenant's account of the dispute
        contract_clauses: Optional relevant clauses from their agreement
        context: Pre-built context string (if None, auto-retrieves)

    Returns:
        Dict with summary, analysis, suggested_resolution, references, disclaimer
    """
    # Build a combined query for retrieval
    combined_query = f"Dispute: {landlord_statement} vs {tenant_statement}"
    if context is None:
        context = retrieve_for_context(combined_query)

    clauses_section = ""
    if contract_clauses:
        clauses_text = "\n".join(f"- {c}" for c in contract_clauses)
        clauses_section = f"\n\n## Relevant Contract Clauses\n\n{clauses_text}"

    user_message = (
        f"## Context — Relevant Law Passages\n\n{context}\n\n"
        f"## Landlord's Statement\n\n{landlord_statement}\n\n"
        f"## Tenant's Statement\n\n{tenant_statement}"
        f"{clauses_section}"
    )

    return _call_gemini(DISPUTE_TRIAGE_SYSTEM_PROMPT, user_message)


# ─── Quick test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🧠 Testing LegalEase AI Generation...")
    result = generate_answer("What is the maximum security deposit a landlord can charge?")
    print(json.dumps(result, indent=2))
