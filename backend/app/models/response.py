from sqlalchemy import Column, Integer, Boolean, DateTime, UUID, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class Response(Base):
    __tablename__ = "responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    participant_token_id = Column(UUID(as_uuid=True), ForeignKey("participant_tokens.id", ondelete="CASCADE"), nullable=False)
    page_id = Column(UUID(as_uuid=True), ForeignKey("quiz_pages.id", ondelete="CASCADE"), nullable=False)
    selected_image_id = Column(UUID(as_uuid=True), ForeignKey("images.id", ondelete="SET NULL"), nullable=True)
    selected_position_index = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    timeout_flag = Column(Boolean, default=False)
    time_limit_seconds = Column(Integer, nullable=True)
    layout_template_id = Column(Integer, ForeignKey("layout_templates.id"), nullable=True)
    images_displayed = Column(JSON, nullable=True)
    randomized_order = Column(JSON, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz = relationship("Quiz", back_populates="responses")
    participant_token = relationship("ParticipantToken", back_populates="responses")
    page = relationship("QuizPage", back_populates="responses")
    selected_image = relationship("Image", foreign_keys=[selected_image_id], back_populates="selected_in_responses")
    layout = relationship("LayoutTemplate")