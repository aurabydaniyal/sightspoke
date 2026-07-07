from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List

# ============================================================
# LAYOUT TEMPLATE SCHEMAS
# ============================================================

class LayoutTemplateBase(BaseModel):
    name: str
    description: Optional[str]
    columns: int
    rows: int
    css_class: str

class LayoutTemplateResponse(LayoutTemplateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================
# IMAGE SCHEMAS
# ============================================================

class ImageBase(BaseModel):
    filename: str
    file_path: str
    file_size: Optional[int]
    mime_type: str
    img_metadata: Optional[dict] = {}

class ImageResponse(ImageBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ============================================================
# PAGE IMAGE SCHEMA (NEW)
# ============================================================

class PageImageSummary(BaseModel):
    id: UUID
    page_id: UUID
    image_id: UUID
    display_order: int
    position_index: Optional[int]
    image: Optional[ImageResponse]  # ✅ Nested image data

    class Config:
        from_attributes = True

# ============================================================
# QUIZ PAGE SCHEMAS
# ============================================================

class QuizPageBase(BaseModel):
    page_number: int
    time_limit_seconds: int = 10
    layout_template_id: Optional[int]

class QuizPageCreate(QuizPageBase):
    pass

class QuizPageResponse(QuizPageBase):
    id: UUID
    quiz_id: UUID
    created_at: datetime
    updated_at: datetime
    layout: Optional[LayoutTemplateResponse]
    page_images: Optional[List[PageImageSummary]] = []  # ✅ ADD THIS LINE

    class Config:
        from_attributes = True

# ============================================================
# QUIZ SCHEMAS
# ============================================================

class QuizBase(BaseModel):
    title: str
    description: Optional[str]
    is_published: bool = False

class QuizCreate(QuizBase):
    pass

class QuizUpdate(QuizBase):
    pass

class QuizResponse(QuizBase):
    id: UUID
    admin_id: UUID
    version: int
    created_at: datetime
    updated_at: datetime
    pages: Optional[List[QuizPageResponse]] = []

    class Config:
        from_attributes = True

# ============================================================
# FIX FORWARD REFERENCES
# ============================================================

QuizResponse.model_rebuild()