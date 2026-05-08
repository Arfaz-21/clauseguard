"""
LegalEase AI — Clause Auditor (Module 2)
==========================================
Checks rental agreement clauses against Indian tenancy law.

Takes extracted clauses from a rental agreement, retrieves
relevant law for each, and uses the LLM to produce a compliance verdict.
"""

import json
from concurrent.futures import ThreadPoolExecutor, as_completed

from legal_engine.retriever import retrieve_for_context
from legal_engine.generator import audit_clause_llm


def audit_clause(clause: str) -> dict:
    """
    Audit a single contract clause against Indian tenancy law.

    Args:
        clause: The text of the contract clause

    Returns:
        Dict with:
        - clause: Original clause text
        - verdict: COMPLIANT / NON_COMPLIANT / NEEDS_REVIEW
        - risk_level: LOW / MEDIUM / HIGH / CRITICAL
        - explanation: Why it's compliant or not
        - law_reference: Specific MTA sections that apply
        - suggestion: How to fix (if non-compliant)
    """
    # Retrieve relevant law passages for this clause
    context = retrieve_for_context(
        f"Is this clause legal under Indian tenancy law: {clause}"
    )

    # Get LLM analysis
    result = audit_clause_llm(clause, context=context)

    # Ensure we always return the original clause text
    result["clause"] = clause
    return result


def audit_agreement(clauses: list[str]) -> dict:
    """
    Audit an entire rental agreement (list of clauses).

    Args:
        clauses: List of clause strings from the agreement

    Returns:
        Dict with:
        - total_clauses: Number of clauses audited
        - compliant: Count of compliant clauses
        - non_compliant: Count of non-compliant clauses
        - needs_review: Count of clauses needing review
        - risk_score: Overall risk score (0-100)
        - results: List of per-clause audit results
    """
    print(f"⚖️  Auditing {len(clauses)} clauses...")

    results = []
    for i, clause in enumerate(clauses, 1):
        print(f"   [{i}/{len(clauses)}] Auditing: {clause[:80]}...")
        result = audit_clause(clause)
        results.append(result)

    # Compute summary statistics
    verdicts = [r.get("verdict", "NEEDS_REVIEW") for r in results]
    compliant = verdicts.count("COMPLIANT")
    non_compliant = verdicts.count("NON_COMPLIANT")
    needs_review = verdicts.count("NEEDS_REVIEW")

    # Risk score: 0 = all compliant, 100 = all non-compliant
    risk_weights = {"COMPLIANT": 0, "NEEDS_REVIEW": 30, "NON_COMPLIANT": 100}
    if results:
        risk_score = sum(
            risk_weights.get(v, 50) for v in verdicts
        ) / len(verdicts)
    else:
        risk_score = 0

    report = {
        "total_clauses": len(clauses),
        "compliant": compliant,
        "non_compliant": non_compliant,
        "needs_review": needs_review,
        "risk_score": round(risk_score, 1),
        "results": results,
    }

    # Print summary
    print(f"\n📊 Audit Summary:")
    print(f"   ✅ Compliant:     {compliant}")
    print(f"   ❌ Non-compliant: {non_compliant}")
    print(f"   ⚠️  Needs review:  {needs_review}")
    print(f"   🎯 Risk score:    {risk_score:.1f}/100")

    return report


# ─── Quick test ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_clauses = [
        "The tenant shall pay a security deposit equal to 12 months of rent.",
        "The landlord may increase rent at any time without notice.",
        "The tenant must vacate within 24 hours if asked by the landlord.",
        "Structural repairs shall be the responsibility of the landlord.",
        "The rent shall be reviewed annually with a maximum increase of 5%.",
    ]

    print("🔍 Running clause audit test...\n")
    report = audit_agreement(test_clauses)
    print(f"\n📝 Full report:")
    print(json.dumps(report, indent=2, default=str))
