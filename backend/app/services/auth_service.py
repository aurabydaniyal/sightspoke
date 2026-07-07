from sqlalchemy.orm import Session
from datetime import datetime, timezone  # ← Add timezone
from models import AdminUser
from core.security import verify_password, create_access_token, get_password_hash
from schemas.admin import TokenResponse

def authenticate_admin(db: Session, username: str, password: str) -> AdminUser:
    admin = db.query(AdminUser).filter(
        AdminUser.username == username,
        AdminUser.is_active == True
    ).first()
    
    if not admin:
        return None
    
    if not verify_password(password, admin.password_hash):
        return None
    
    admin.last_login = datetime.now(timezone.utc)  # ← FIXED
    db.commit()
    db.refresh(admin)
    return admin

def create_admin_token(admin: AdminUser) -> TokenResponse:
    access_token = create_access_token(
        data={
            "sub": str(admin.id),
            "username": admin.username,
            "role": "admin"
        }
    )
    return TokenResponse(
        access_token=access_token,
        admin_id=admin.id,
        username=admin.username
    )

def create_first_admin(db: Session, username: str, password: str) -> AdminUser:
    existing = db.query(AdminUser).filter(AdminUser.username == username).first()
    if existing:
        return existing
    
    hashed_password = get_password_hash(password)
    admin = AdminUser(
        username=username,
        password_hash=hashed_password,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin