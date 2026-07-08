from sqlalchemy import Column, String, Boolean, DateTime, UUID, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    participant_token_id = Column(UUID(as_uuid=True), ForeignKey("participant_tokens.id", ondelete="SET NULL"), nullable=True)
    insight_type = Column(String(50), nullable=False)
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # ✅ ADD back_populates
    quiz = relationship("Quiz", back_populates="ai_insights")
    participant_token = relationship("ParticipantToken", back_populates="ai_insights")