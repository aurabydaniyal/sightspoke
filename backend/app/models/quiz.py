from sqlalchemy import Column, String, Boolean, DateTime, UUID, Integer, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class LayoutTemplate(Base):
    __tablename__ = "layout_templates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    columns = Column(Integer, nullable=False)
    rows = Column(Integer, nullable=False)
    css_class = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pages = relationship("QuizPage", back_populates="layout")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_published = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    ai_overview = Column(Text, nullable=True, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    admin = relationship("AdminUser", backref="quizzes")
    pages = relationship("QuizPage", back_populates="quiz", cascade="all, delete-orphan")
    tokens = relationship("ParticipantToken", back_populates="quiz", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="quiz", cascade="all, delete-orphan")
    ai_insights = relationship("AIInsight", back_populates="quiz", cascade="all, delete-orphan")
    chat_logs = relationship("ParticipantChatLog", back_populates="quiz", cascade="all, delete-orphan")


class QuizPage(Base):
    __tablename__ = "quiz_pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    time_limit_seconds = Column(Integer, default=10)
    layout_template_id = Column(Integer, ForeignKey("layout_templates.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    quiz = relationship("Quiz", back_populates="pages")
    layout = relationship("LayoutTemplate", back_populates="pages")
    page_images = relationship("PageImage", back_populates="page", cascade="all, delete-orphan")
    responses = relationship("Response", back_populates="page", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint('quiz_id', 'page_number'),)


class PageImage(Base):
    __tablename__ = "page_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id = Column(UUID(as_uuid=True), ForeignKey("quiz_pages.id", ondelete="CASCADE"), nullable=False)
    image_id = Column(UUID(as_uuid=True), ForeignKey("images.id", ondelete="CASCADE"), nullable=False)
    display_order = Column(Integer, nullable=False)
    position_index = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    page = relationship("QuizPage", back_populates="page_images")
    image = relationship("Image", back_populates="page_images")

    __table_args__ = (UniqueConstraint('page_id', 'image_id'),)