"""
LegalEase AI — Dispute Triage (Module 3)
==========================================
AI Referee for landlord-tenant disputes.
"""

import json
from legal_engine.generator import triage_dispute_llm


def triage_dispute(
    landlord_statement: str,
    tenant_statement: str,
    contract_clauses: list[str] = None,
) -> dict:
    """
    Triage a landlord-tenant dispute using Indian tenancy law.

    Returns dict with summary, analysis, suggested_resolution,
    party_obligations, references, disclaimer.
    """
    print(f"⚖️  Triaging dispute...")
    print(f"   Landlord: {landlord_statement[:100]}...")
    print(f"   Tenant:   {tenant_statement[:100]}...")

    return triage_dispute_llm(
        landlord_statement=landlord_statement,
        tenant_statement=tenant_statement,
        contract_clauses=contract_clauses,
    )


if __name__ == "__main__":
    print("⚖️  Testing Dispute Triage...\n")
    result = triage_dispute(
        landlord_statement="The tenant has not paid rent for 3 months.",
        tenant_statement="I lost my job and asked for 2 months to find a new one.",
        contract_clauses=["Rent of Rs 15,000 is due on the 1st of every month."],
    )
    print(json.dumps(result, indent=2, default=str))
