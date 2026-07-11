from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from database import get_db
from models import Quiz, ParticipantToken, Response, Image, ParticipantChatLog, AdminUser
from .schemas import (
    AIAnalyzeRequest, AIChatRequest, AIAdminQARequest,
    AIGenerateFAQsRequest
)
from .analyzer import AIAnalyzer
from .groq_client import GroqClient
from .quiz_generator import QuizGenerator  # ✅ IMPORT THIS

router = APIRouter(tags=["AI"])

# ============================================================
# ✅ FIXED: QUIZ GENERATION ENDPOINT - WAS MISSING!
# ============================================================

@router.post("/generate-quiz")
async def generate_quiz(
    request: dict,
    db: Session = Depends(get_db)
):
    """Generate a complete quiz with psychological descriptions and AI images"""
    
    topic = request.get("topic")
    description = request.get("description", "")
    page_count = request.get("page_count", 3)
    
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")
    
    if page_count < 3 or page_count > 6:
        raise HTTPException(status_code=400, detail="Page count must be between 3 and 6")
    
    # Get admin user
    admin = db.query(AdminUser).filter(AdminUser.is_active == True).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    generator = QuizGenerator()
    try:
        result = await generator.generate_quiz(
            admin_id=admin.id,
            topic=topic,
            description=description,
            page_count=page_count,
            db=db
        )
        return result
    except Exception as e:
        print(f"❌ Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# SURVEY ANALYSIS
# ============================================================

@router.post("/analyze-survey")
async def analyze_survey(
    request: AIAnalyzeRequest,
    db: Session = Depends(get_db)
):
    """Analyze survey responses with psychological focus"""
    analyzer = AIAnalyzer()
    try:
        result = await analyzer.analyze_survey(
            quiz_id=request.quiz_id,
            db=db,
            participant_token_id=request.participant_token_id
        )
        return result
    except Exception as e:
        print(f"❌ Survey analysis error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/analyze-participant")
async def analyze_participant(
    request: dict,
    db: Session = Depends(get_db)
):
    """Analyze a specific participant's survey"""
    quiz_id = request.get("quiz_id")
    participant_token = request.get("participant_token_id")
    
    if not quiz_id or not participant_token:
        raise HTTPException(status_code=400, detail="quiz_id and participant_token_id required")
    
    try:
        quiz_uuid = UUID(str(quiz_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quiz_id format")
    
    # Find the participant token record using the token string
    token_record = db.query(ParticipantToken).filter(
        ParticipantToken.token == participant_token
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=404, detail="Participant token not found")
    
    token_uuid = token_record.id
    
    analyzer = AIAnalyzer()
    try:
        result = await analyzer.analyze_participant_survey(
            quiz_id=quiz_uuid,
            participant_token_id=token_uuid,
            db=db
        )
        return result
    except Exception as e:
        print(f"❌ Participant analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_responses(
    request: AIAnalyzeRequest,
    db: Session = Depends(get_db)
):
    """Analyze responses for a quiz"""
    analyzer = AIAnalyzer()
    try:
        result = await analyzer.analyze_survey(
            quiz_id=request.quiz_id,
            db=db,
            participant_token_id=request.participant_token_id
        )
        return result
    except Exception as e:
        print(f"❌ Analyze error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================
# EXPERT QUERY
# ============================================================

@router.post("/expert-query")
async def expert_query(
    request: dict,
    db: Session = Depends(get_db)
):
    """Expert-level query for admin"""
    quiz_id = request.get("quiz_id")
    question = request.get("question")
    
    if not quiz_id or not question:
        raise HTTPException(status_code=400, detail="quiz_id and question required")
    
    try:
        quiz_uuid = UUID(str(quiz_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quiz_id format")
    
    quiz = db.query(Quiz).filter(Quiz.id == quiz_uuid).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    responses = db.query(Response).filter(Response.quiz_id == quiz_uuid).all()
    chats = db.query(ParticipantChatLog).filter(ParticipantChatLog.quiz_id == quiz_uuid).all()
    
    response_data = []
    for r in responses[:30]:
        img = db.query(Image).filter(Image.id == r.selected_image_id).first() if r.selected_image_id else None
        response_data.append({
            "page": r.page.page_number if r.page else None,
            "selected_image": img.title if img else "Unknown",
            "latency_ms": r.latency_ms,
            "timeout": r.timeout_flag
        })
    
    chat_data = [{"sender": c.sender, "message": c.message} for c in chats[:20]]
    
    quiz_info = {"title": quiz.title, "description": quiz.description}
    
    groq = GroqClient()
    answer = await groq.answer_expert_query(
        question=question,
        quiz_info=quiz_info,
        responses=response_data,
        chat_history=chat_data
    )
    
    return {"question": question, "answer": answer}


# ============================================================
# INSIGHTS & CHAT LOGS
# ============================================================

@router.get("/insights/{quiz_id}")
async def get_ai_insights(
    quiz_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all AI insights for a quiz"""
    from models import AIInsight
    insights = db.query(AIInsight).filter(AIInsight.quiz_id == quiz_id).all()
    return insights


@router.get("/chat-logs/{quiz_id}")
async def get_chat_logs(
    quiz_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all chat logs for a quiz"""
    logs = db.query(ParticipantChatLog).filter(
        ParticipantChatLog.quiz_id == quiz_id
    ).order_by(ParticipantChatLog.created_at).all()
    
    return [
        {
            "id": str(log.id),
            "quiz_id": str(log.quiz_id),
            "participant_token_id": str(log.participant_token_id),
            "message": log.message,
            "sender": log.sender,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]


@router.get("/participant-chat-logs/{quiz_id}/{participant_token}")
async def get_participant_chat_logs(
    quiz_id: str,
    participant_token: str,
    db: Session = Depends(get_db)
):
    """Get chat logs for a specific participant using their TOKEN STRING"""
    
    try:
        quiz_uuid = UUID(quiz_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid quiz_id format")
    
    # Find the token record using the token string
    token_record = db.query(ParticipantToken).filter(
        ParticipantToken.token == participant_token
    ).first()
    
    if not token_record:
        raise HTTPException(status_code=404, detail="Participant token not found")
    
    token_uuid = token_record.id
    
    logs = db.query(ParticipantChatLog).filter(
        ParticipantChatLog.quiz_id == quiz_uuid,
        ParticipantChatLog.participant_token_id == token_uuid
    ).order_by(ParticipantChatLog.created_at).all()
    
    return [
        {
            "id": str(log.id),
            "message": log.message,
            "sender": log.sender,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]


@router.post("/faqs")
async def generate_faqs(
    request: AIGenerateFAQsRequest,
    db: Session = Depends(get_db)
):
    """Generate FAQs for a quiz"""
    analyzer = AIAnalyzer()
    try:
        faqs = await analyzer.generate_faqs(
            quiz_id=request.quiz_id,
            db=db
        )
        return {"faqs": faqs}
    except Exception as e:
        print(f"❌ FAQ error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ============================================================
# CHAT ENDPOINTS
# ============================================================

@router.post("/chat")
async def chat_with_participant(
    request: AIChatRequest,
    db: Session = Depends(get_db)
):
    """Chat with participant AI assistant"""
    
    print(f"📥 Chat request received:")
    print(f"  quiz_id: {request.quiz_id}")
    print(f"  participant_token_id: {request.participant_token_id}")
    
    token = db.query(ParticipantToken).filter(
        ParticipantToken.token == request.participant_token_id
    ).first()
    
    if not token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")
    
    print(f"✅ Found token UUID: {token.id}")
    
    analyzer = AIAnalyzer()
    response = await analyzer.generate_participant_chat_response(
        quiz_id=request.quiz_id,
        participant_token_id=token.id,
        message=request.message,
        db=db,
        chat_history=request.chat_history or []
    )
    
    return {"response": response}


@router.post("/admin/qa")
async def admin_qa(
    request: AIAdminQARequest,
    db: Session = Depends(get_db)
):
    """Answer admin's question about quiz data"""
    
    quiz = db.query(Quiz).filter(Quiz.id == request.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    analyzer = AIAnalyzer()
    try:
        answer = await analyzer.answer_admin_question(
            quiz_id=request.quiz_id,
            question=request.question,
            db=db
        )
        return {"question": request.question, "answer": answer}
    except Exception as e:
        print(f"❌ Admin QA error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))