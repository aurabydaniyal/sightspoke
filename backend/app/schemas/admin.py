from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class AdminLogin(BaseModel):
    password: str

class AdminResponse(BaseModel):
    id: UUID
    username: str
    created_at: datetime
    last_login: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_id: UUID
    username: str