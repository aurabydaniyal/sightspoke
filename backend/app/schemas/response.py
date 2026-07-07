from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ResponseBase(BaseModel):
    selected_image_id: Optional[UUID]
    selected_position_index: Optional[int]
    latency_ms: Optional[int]
    timeout_flag: bool = False

class ResponseCreate(ResponseBase):
    page_id: UUID
    page_number: int

class ResponseResponse(ResponseBase):
    id: UUID
    quiz_id: UUID
    participant_token_id: UUID
    page_id: UUID
    submitted_at: datetime

    class Config:
        from_attributes = True