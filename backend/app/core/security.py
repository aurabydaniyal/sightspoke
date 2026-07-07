from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import hashlib
import secrets
import string
from config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password using SHA256"""
    # DEBUG: Print everything
    print("=" * 50)
    print("🔍 DEBUG - verify_password called")
    print(f"Input password: '{plain_password}'")
    print(f"Stored hash: '{hashed_password}'")
    
    computed_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    print(f"Computed hash: '{computed_hash}'")
    
    result = computed_hash == hashed_password
    print(f"Match result: {result}")
    print("=" * 50)
    
    return result

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

def generate_participant_token() -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(32))

def get_token_expiry(days: int = settings.TOKEN_EXPIRY_DAYS) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)