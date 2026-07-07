from sqlalchemy import Column, String, Integer, DateTime, UUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class Image(Base):
    __tablename__ = "images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(50), nullable=False)
    img_metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    page_images = relationship("PageImage", back_populates="image", cascade="all, delete-orphan")
    selected_in_responses = relationship("Response", foreign_keys="Response.selected_image_id", back_populates="selected_image")