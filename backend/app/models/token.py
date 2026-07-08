from sqlalchemy import Column, String, Boolean, DateTime, UUID, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class ParticipantToken(Base):
    __tablename__ = "participant_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    admin_label = Column(String(255), nullable=True)
    is_used = Column(Boolean, default=False)
    is_expired = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used_at = Column(DateTime(timezone=True), nullable=True)

    quiz = relationship("Quiz", back_populates="tokens")
    responses = relationship("Response", back_populates="participant_token", cascade="all, delete-orphan")
    ai_insights = relationship("AIInsight", back_populates="participant_token", cascade="all, delete-orphan")
    chat_logs = relationship("ParticipantChatLog", back_populates="participant_token", cascade="all, delete-orphan")    