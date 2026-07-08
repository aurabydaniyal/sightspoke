from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any

# ============================================================
# AI REQUEST SCHEMAS
# ============================================================

class AIAnalyzeRequest(BaseModel):
    quiz_id: UUID
    participant_token_id: Optional[UUID] = None

class AIChatRequest(BaseModel):
    quiz_id: UUID
    participant_token_id: Optional[str] = None  # ✅ Changed from UUID to str
    message: str = Field(..., min_length=1)
    chat_history: Optional[List[Dict[str, str]]] = None

    class Config:
        extra = "ignore"

class AIAdminQARequest(BaseModel):
    quiz_id: UUID
    question: str = Field(..., min_length=1)

class AIGenerateFAQsRequest(BaseModel):
    quiz_id: UUID

# ============================================================
# AI RESPONSE SCHEMAS
# ============================================================

class AIInsightResponse(BaseModel):
    id: UUID
    quiz_id: UUID
    participant_token_id: Optional[UUID]
    insight_type: str
    content: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class AIChatResponse(BaseModel):
    response: str
    quiz_id: UUID
    participant_token_id: Optional[UUID]

class AIFAQResponse(BaseModel):
    faqs: List[Dict[str, str]]
    quiz_id: UUID

class AIAdminQAResponse(BaseModel):
    question: str
    answer: str
    quiz_id: UUID