
import sqlite3
import httpx
import json
import os

DB_PATH = "ClauseGuard-backend/clauseguard.db"
RAG_URL = "http://localhost:8001/api/audit"

def update_audit(agreement_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Get text
    cursor.execute("SELECT extracted_text FROM agreements WHERE id=?", (agreement_id,))
    row = cursor.fetchone()
    if not row:
        print("❌ Agreement not found")
        return
    text = row[0]
    
    print(f"📡 Calling RAG Agent for Agreement #{agreement_id}...")
    try:
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(RAG_URL, json={"clauses": [text[:4000]]})
            if resp.status_code == 200:
                data = resp.json()
                if "results" in data:
                    res = data["results"][0]
                    audit_result = f"### ⚖️ LegalEase AI Audit: {res['verdict']}\n\n"
                    audit_result += f"**Risk Level:** `{res['risk_level']}`\n\n"
                    audit_result += f"**Explanation:** {res['explanation']}\n\n"
                    audit_result += f"**Law Reference:** {res['law_reference']}\n\n"
                    audit_result += f"**Suggestion:** {res['suggestion']}"
                    
                    # 2. Update DB
                    cursor.execute("UPDATE agreements SET audit_result=?, status='audited' WHERE id=?", (audit_result, agreement_id))
                    conn.commit()
                    print(f"✅ Database updated for Agreement #{agreement_id}")
                else:
                    print(f"❌ RAG Agent returned unexpected format: {data}")
            else:
                print(f"❌ RAG Agent error: {resp.status_code}")
    except Exception as e:
        print(f"❌ Error calling RAG agent: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_audit(4)
