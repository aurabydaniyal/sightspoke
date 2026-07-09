from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from database import get_db
from models import Quiz, ParticipantToken
from .schemas import (
    AIAnalyzeRequest, AIChatRequest, AIAdminQARequest,
    AIGenerateFAQsRequest
)
from .analyzer import AIAnalyzer

router = APIRouter(tags=["AI"])

@router.post("/analyze")
async def analyze_responses(
    request: AIAnalyzeRequest,
    db: Session = Depends(get_db)
):
    """Analyze responses for a quiz and generate insights"""
    analyzer = AIAnalyzer()
    try:
        result = await analyzer.analyze_quiz_responses(
            quiz_id=request.quiz_id,
            db=db,
            participant_token_id=request.participant_token_id
        )
        return result
    except Exception as e:
        print(f"❌ Analyze error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

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

@router.post("/faqs")
async def generate_faqs(
    request: AIGenerateFAQsRequest,
    db: Session = Depends(get_db)
):
    """Generate FAQs for a quiz"""
    
    print(f"📥 FAQ request for quiz: {request.quiz_id}")
    
    quiz = db.query(Quiz).filter(Quiz.id == request.quiz_id).first()
    if not quiz:
        print(f"❌ Quiz not found: {request.quiz_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    analyzer = AIAnalyzer()
    try:
        faqs = await analyzer.generate_faqs(
            quiz_id=request.quiz_id,
            db=db
        )
        print(f"✅ FAQs generated: {len(faqs)} items")
        return {"faqs": faqs}
    except Exception as e:
        print(f"❌ FAQ error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/participant/analyze-chat")
async def analyze_participant_chat(
    quiz_id: UUID,
    participant_token_id: UUID,
    db: Session = Depends(get_db)
):
    """Analyze a participant's chat history"""
    
    analyzer = AIAnalyzer()
    try:
        result = await analyzer.analyze_participant_chat(
            quiz_id=quiz_id,
            participant_token_id=participant_token_id,
            db=db
        )
        return result
    except Exception as e:
        print(f"❌ Participant chat analysis error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

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
    
    from models import ParticipantChatLog
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

# ✅ NEW ENDPOINT: Combined Chat Summary
@router.post("/combined-chat-summary")
async def generate_combined_chat_summary(
    request: dict,
    db: Session = Depends(get_db)
):
    """Generate a combined summary of all participant chats for a quiz"""
    
    quiz_id = request.get("quiz_id")
    if not quiz_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="quiz_id is required")
    
    analyzer = AIAnalyzer()
    try:
        result = await analyzer.generate_combined_chat_summary(
            quiz_id=quiz_id,
            db=db
        )
        
        # ✅ Save as AI insight
        from models import AIInsight
        insight = AIInsight(
            quiz_id=quiz_id,
            participant_token_id=None,
            insight_type="combined_chat_summary",
            content=result
        )
        db.add(insight)
        db.commit()
        
        return result
    except Exception as e:
        print(f"❌ Combined chat summary error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))