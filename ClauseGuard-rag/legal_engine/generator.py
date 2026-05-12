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

LEGAL_QA_SYSTEM_PROMPT = """You are **ClauseGuard**, an expert assistant on Indian tenancy and rental law, specifically the Model Tenancy Act (MTA) 2021 and related state laws.

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

DOCUMENT_CHAT_SYSTEM_PROMPT = """You are **ClauseGuard Expert Assistant**. You are helping a user understand their specific contract by comparing it against Indian tenancy laws.

    ## Your Role
    - Answer user questions about their **Contract** based on the provided **Contract Context** and **Legal Context**.
    - If a question is about something NOT in the contract, look for general legal guidance in the Legal Context.
    - Be clear, professional, and explain the "Real-World Implication" for the user.
    - If the contract says something that contradicts the law, point it out.

    ## Response Format
    Respond in valid JSON:
    {
        "answer": "Detailed answer in professional English.",
        "found_in_contract": true/false,
        "contract_reference": "The specific clause or snippet from the contract (if applicable)",
        "legal_reference": "Relevant law/section (if applicable)",
        "action_item": "What should the user do next? (e.g., 'Ask for this to be removed' or 'This is safe')"
    }
"""

REPHRASE_CLAUSE_SYSTEM_PROMPT = """You are **ClauseGuard Negotiation Expert**. Your goal is to take a "Risky" or "Unfair" contract clause and rewrite it to be "Fair" and "Legally Compliant" while still protecting both parties.

    ## Rules
    - Maintain the original intent but remove predatory terms.
    - Ensure it complies with the Model Tenancy Act 2021.
    - Keep the language professional and standard for legal contracts.
    - Provide a "Why this is better" explanation.

    ## Response Format
    Respond in valid JSON:
    {
        "original_clause": "...",
        "suggested_clause": "...",
        "improvement_notes": "A brief explanation of what was changed and why it's fairer now."
    }
"""

CLAUSE_AUDIT_SYSTEM_PROMPT = """You are **ClauseGuard Expert Auditor**, a high-precision AI legal analyst reviewing real risks. You are NOT a generic chatbot.

    ## Your Objective
    Act as a strict filter. ONLY flag clauses that are genuinely risky, exploitative, restrictive, financially dangerous, or unusually one-sided. 
    DO NOT flag harmless clauses, standard legal formatting, or neutral procedural language. 
    If a clause does not contain a clear, identifiable risk based on the provided law, DO NOT create an audit card (return an empty list in 'results').

    ## Output Format (Strict JSON)
    You must return a JSON object with this structure:
    {
        "overall_summary": {
            "contract_type": "e.g., Residential Lease, Employment Agreement",
            "executive_summary": "A 2-3 sentence professional overview of the document's fairness. Avoid generic wording.",
            "key_red_flags": ["Specific red flag 1", "Specific red flag 2"],
            "financial_concerns": "Specific costs, deposits, or penalties mentioned."
        },
        "results": [
            {
                "verdict": "NON_COMPLIANT" | "NEEDS_REVIEW",
                "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
                "clause_category": "[Use one of the categories below]",
                "clause": "VERBATIM sentence from text.",
                "short_summary": "Precise, contextual title (e.g., 'Excessive Security Deposit', 'Unilateral Termination')",
                "explanation": {
                    "legal_technical": "Reference the exact clause meaning and specific law/section violated (e.g., 'Violates Section 11 of MTA 2021 which limits deposits to 2 months').",
                    "simplified": "Exact Clause Explanation: Explain exactly what obligation, restriction, or liability this clause creates for the user. Avoid phrases like 'vague' or 'unfair'.",
                    "why_it_risky": "Real-World Consequence: Explain the actual possible outcome, mentioning financial, legal, or practical consequences (e.g., 'You may become financially responsible for project failures even after the agreement ends')."
                },
                "suggestion": "Generate a rewritten, safer alternative clause or a precise negotiation suggestion. DO NOT say 'Review and rewrite'."
            }
        ]
    }

    ## Categories (Use exactly these or extract specific equivalent)
    - Liability
    - Termination
    - Indemnification
    - Financial Liability
    - Long Notice Period
    - Reimbursement Restrictions
    - Ownership Rights
    - Arbitration
    - Intellectual Property
    - Non-Compete
    - Penalty Clause
    - Confidentiality
    - Data Privacy
    - Auto Renewal

    ## Rules
    1. **No Generic Fallbacks**: Do NOT use phrases like "This clause is vague", "slightly unfair", "clarify it", "review and rewrite", or "mutual fairness".
    2. **Be Contextual**: Reference the exact obligation or restriction. Understand who gains power and who carries risk.
    3. **Strict Filtering**: If you cannot confidently identify a specific risk, return an empty array for 'results'.
"""

DISPUTE_TRIAGE_SYSTEM_PROMPT = """You are **ClauseGuard Dispute Referee**, mediating landlord-tenant disputes using Indian tenancy law (Model Tenancy Act 2021).

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

    try:
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
    except Exception as e:
        print(f"⚠️ Gemini API Error: {e}")
        error_msg = str(e).lower()
        if "quota" in error_msg or "resourceexhausted" in error_msg or "429" in error_msg:
            raise Exception("AI analysis is temporarily unavailable because the API quota has been exhausted.")
        else:
            raise Exception("ClauseGuard has reached its AI analysis limit. Please try again later.")

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


def chat_with_document(question: str, document_text: str) -> dict:
    """
    Answer a question about a specific document using both doc context and legal RAG.
    """
    # 1. Retrieve relevant law passages
    law_context = retrieve_for_context(question)

    # 2. Combine contexts
    full_user_message = f"""
    ### CONTRACT CONTEXT (The user's document):
    {document_text[:10000]}

    ### LEGAL CONTEXT (Relevant Laws):
    {law_context}

    ### USER QUESTION:
    {question}
    """

    return _call_gemini(DOCUMENT_CHAT_SYSTEM_PROMPT, full_user_message)


def rephrase_clause(clause_text: str) -> dict:
    """
    Take an unfair clause and suggest a fairer version.
    """
    return _call_gemini(REPHRASE_CLAUSE_SYSTEM_PROMPT, f"Please rephrase this clause: {clause_text}")


# ─── Quick test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🧠 Testing LegalEase AI Generation...")
    result = generate_answer("What is the maximum security deposit a landlord can charge?")
    print(json.dumps(result, indent=2))

