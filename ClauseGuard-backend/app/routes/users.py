from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, GoogleLoginRequest

import os
from google.oauth2 import id_token
from google.auth.transport import requests

router = APIRouter(prefix="/users", tags=["Users"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(**user.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/google-login", response_model=UserResponse)
def google_login(google_user: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # Verify the token
        # If GOOGLE_CLIENT_ID is not set, we skip verification for dev ease, 
        # but in production this is mandatory.
        if GOOGLE_CLIENT_ID:
            idinfo = id_token.verify_oauth2_token(google_user.token, requests.Request(), GOOGLE_CLIENT_ID)
            email = idinfo['email']
            name = idinfo.get('name', email.split('@')[0])
        else:
            # Fallback for dev if env is missing
            print("⚠️ GOOGLE_CLIENT_ID not set in backend. Skipping verification (DEV ONLY).")
            email = google_user.email
            name = google_user.name
            
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token: email missing")
            
        # Check if user exists by email
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user
            new_user = User(
                name=name,
                email=email,
                role="tenant" # Default role
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
            
        return user
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")