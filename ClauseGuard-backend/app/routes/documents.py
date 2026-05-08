from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.models.document import GeneratedDocument
from app.schemas.document import DocumentGenerateRequest, DocumentResponse

router = APIRouter(prefix="/documents", tags=["Documents"])

def generate_legal_content(doc_type: str, data: dict):
    title = f"{doc_type.replace('_', ' ').title()}"
    business_name = data.get('business_name', 'your business')
    region = data.get('region', 'your region')
    
    content = f"# {title}\n"
    content += f"**Effective Date:** {datetime.now().strftime('%B %d, %Y')}\n\n"
    content += f"This {title} describes how {business_name} (\"we\", \"us\", or \"our\"), operating in {region}, manages legal obligations regarding your use of our services.\n\n"
    
    recs = []
    
    if doc_type == "privacy_policy":
        content += "## 1. Information We Collect\n"
        if data.get('collects_user_data'):
            content += "We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.\n\n"
            content += "The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include names, email addresses, and contact preferences.\n\n"
            recs.append({"type": "warning", "text": "Specify the exact types of PII (Personally Identifiable Information) you collect to be GDPR/CCPA compliant."})
        else:
            content += "We do not collect personal information from our users.\n\n"
            
        if data.get('uses_cookies'):
            content += "## 2. Cookies and Tracking Technologies\n"
            content += "We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.\n\n"
            recs.append({"type": "tip", "text": "Include a link to a dedicated Cookie Policy if you use advertising or analytics cookies."})

        content += "## 3. Data Security\n"
        content += "We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.\n\n"

    elif doc_type == "refund_policy":
        content += "## 1. Refund Eligibility\n"
        if data.get('has_subscriptions'):
            content += "For our subscription-based services, you may cancel your subscription at any time. Refunds for partial subscription periods are typically not provided unless required by law in your jurisdiction.\n\n"
            content += "## 2. Cancellation Process\nTo cancel your subscription, please navigate to your account settings or contact our support team at least 24 hours before your next billing cycle.\n\n"
            recs.append({"type": "critical", "text": "Define a clear 'Cooling-off Period' if you operate in the EU or UK."})
        else:
            content += "All sales are final. We provide refunds only in the event of a technical failure that prevents you from accessing our core services for more than 48 consecutive hours.\n\n"
            
    elif doc_type == "nda":
        content += "## 1. Definition of Confidential Information\n"
        content += "\"Confidential Information\" means all non-public, proprietary, or confidential information disclosed by the Disclosing Party to the Receiving Party, whether orally or in written, electronic, or other form or media.\n\n"
        content += "## 2. Obligations of Receiving Party\n"
        content += "The Receiving Party shall: (a) protect and safeguard the confidentiality of all such Confidential Information with at least the same degree of care as the Receiving Party would protect its own Confidential Information; and (b) not use the Disclosing Party's Confidential Information, or permit it to be accessed or used, for any purpose other than to exercise its rights or perform its obligations under this Agreement.\n\n"
        recs.append({"type": "critical", "text": "Specify the duration of the confidentiality obligation (e.g., 2 years or 5 years)."})

    elif doc_type == "terms_and_conditions":
        content += "## 1. Agreement to Terms\n"
        content += f"These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity (\"you\") and {business_name} (\"we,\" \"us\" or \"our\"), concerning your access to and use of our services.\n\n"
        content += "## 2. Intellectual Property Rights\n"
        content += "Unless otherwise indicated, the Services are our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Services (collectively, the \"Content\") and the trademarks, service marks, and logos contained therein (the \"Marks\") are owned or controlled by us or licensed to us.\n\n"

    elif doc_type == "service_agreement":
        content += "## 1. Services Provided\n"
        content += f"The Service Provider agrees to perform the following services for the Client: {data.get('business_type', 'general business services')}.\n\n"
        content += "## 2. Payment Terms\n"
        content += f"The Client shall pay the Service Provider according to the rates and schedule agreed upon. All payments are due within {data.get('payment_cycle', '30 days')} of invoice issuance.\n\n"
        recs.append({"type": "tip", "text": "Clearly define the 'Scope of Work' to avoid scope creep."})

    elif doc_type == "freelancer_agreement":
        content += "## 1. Independent Contractor Status\n"
        content += "The Freelancer is an independent contractor, not an employee. Nothing in this Agreement shall be interpreted as creating a partnership or joint venture between the parties.\n\n"
        content += "## 2. Ownership of Work Product\n"
        content += "Upon full payment of fees, the Freelancer hereby assigns all rights, title, and interest in and to the work product to the Client.\n\n"
        recs.append({"type": "critical", "text": "Ensure you specify if the freelancer can use the work in their portfolio."})

    elif doc_type == "subscription_terms":
        content += "## 1. Subscription Tiers\n"
        content += "We offer various subscription tiers for our services. By subscribing, you agree to pay the recurring fees associated with your chosen tier.\n\n"
        content += "## 2. Auto-Renewal\n"
        content += "Subscriptions will automatically renew at the end of each billing cycle unless cancelled at least 48 hours prior to renewal.\n\n"
        recs.append({"type": "warning", "text": "Auto-renewal terms must be conspicuous under California and EU consumer laws."})

    elif doc_type == "cookie_policy":
        content += "## 1. What are Cookies?\n"
        content += "Cookies are small data files that are placed on your computer or mobile device when you visit a website.\n\n"
        content += "## 2. How we use Cookies\n"
        content += "We use cookies for various purposes, including strictly necessary cookies for site operation, and analytics cookies to understand how you use our services.\n\n"
        recs.append({"type": "tip", "text": "Implement a 'Cookie Consent Banner' to allow users to opt-out of non-essential cookies."})

    content += "\n---\n*Disclaimer: This is an AI-assisted draft and should be reviewed by a qualified legal professional before official use.*"
    return title, content, recs

@router.post("/generate", response_model=DocumentResponse)
def generate_document(request: DocumentGenerateRequest, db: Session = Depends(get_db)):
    title, content, recommendations = generate_legal_content(request.doc_type, request.business_data)
    
    new_doc = GeneratedDocument(
        user_id=request.user_id,
        title=title,
        doc_type=request.doc_type,
        business_data=request.business_data,
        content=content,
        recommendations=recommendations
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.get("/user/{user_id}", response_model=List[DocumentResponse])
def get_user_documents(user_id: int, db: Session = Depends(get_db)):
    return db.query(GeneratedDocument).filter(GeneratedDocument.user_id == user_id).all()

@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(GeneratedDocument).filter(GeneratedDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc
