from .router import router
from .analyzer import AIAnalyzer
from .groq_client import GroqClient
from .chat_service import ChatService
from .quiz_generator import QuizGenerator  # ✅ ADD THIS
from .schemas import (
    AIAnalyzeRequest,
    AIChatRequest,
    AIAdminQARequest,
    AIGenerateFAQsRequest,
    AIInsightResponse,
    AIChatResponse,
    AIFAQResponse,
    AIAdminQAResponse
)

__all__ = [
    "router",
    "AIAnalyzer",
    "GroqClient",
    "ChatService",
    "QuizGenerator",  # ✅ ADD THIS
    "AIAnalyzeRequest",
    "AIChatRequest",
    "AIAdminQARequest",
    "AIGenerateFAQsRequest",
    "AIInsightResponse",
    "AIChatResponse",
    "AIFAQResponse",
    "AIAdminQAResponse"
]