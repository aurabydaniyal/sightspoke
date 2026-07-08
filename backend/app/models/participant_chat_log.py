from sqlalchemy import Column, String, Boolean, DateTime, UUID, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class ParticipantChatLog(Base):
    __tablename__ = "participant_chat_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    participant_token_id = Column(UUID(as_uuid=True), ForeignKey("participant_tokens.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    sender = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ✅ ADD back_populates
    quiz = relationship("Quiz", back_populates="chat_logs")
    participant_token = relationship("ParticipantToken", back_populates="chat_logs")