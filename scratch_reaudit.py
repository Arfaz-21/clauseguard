
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "ClauseGuard-backend"))

from app.database import SessionLocal
from app.models.agreement import Agreement
from app.routes.agreements import analyze_agreement_with_ai

def reaudit(agreement_id):
    print(f"🔄 Re-auditing Agreement #{agreement_id}...")
    db = SessionLocal()
    agreement = db.query(Agreement).filter(Agreement.id == agreement_id).first()
    if not agreement:
        print("❌ Agreement not found")
        return
    
    file_path = os.path.join("ClauseGuard-backend", agreement.file_path)
    analyze_agreement_with_ai(agreement_id, file_path)
    print("✅ Re-audit complete!")
    db.close()

if __name__ == "__main__":
    reaudit(4)
