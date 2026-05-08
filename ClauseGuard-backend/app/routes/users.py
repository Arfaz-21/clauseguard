from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, GoogleLoginRequest

router = APIRouter(prefix="/users", tags=["Users"])

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
    # Check if user exists by email
    user = db.query(User).filter(User.email == google_user.email).first()
    
    if not user:
        # Create new user
        new_user = User(
            name=google_user.name,
            email=google_user.email,
            role="tenant" # Default role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user
        
    return user