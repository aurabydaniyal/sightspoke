from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID
from collections import Counter
import json

from .groq_client import GroqClient
from .prompts import SYSTEM_PROMPTS, USER_PROMPT_TEMPLATES
from models import Response, Quiz, ParticipantToken, AIInsight, ParticipantChatLog, Image
from database import get_db

class AIAnalyzer:
    """Core AI analysis logic"""
    
    def __init__(self):
        self.groq = GroqClient()  # ✅ Fixed: was self.grok before
    
    async def analyze_quiz_responses(
        self,
        quiz_id: UUID,
        db: Session,
        participant_token_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Analyze all responses for a quiz"""
        
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise ValueError("Quiz not found")
        
        query = db.query(Response).filter(Response.quiz_id == quiz_id)
        if participant_token_id:
            query = query.filter(Response.participant_token_id == participant_token_id)
        responses = query.all()
        
        if not responses:
            return {"error": "No responses found for analysis"}
        
        # Get all images with their titles
        image_ids = [r.selected_image_id for r in responses if r.selected_image_id]
        images = db.query(Image).filter(Image.id.in_(image_ids)).all() if image_ids else []
        image_map = {str(img.id): img for img in images}
        
        response_data = []
        for r in responses:
            img = image_map.get(str(r.selected_image_id)) if r.selected_image_id else None
            
            response_data.append({
                "page_number": r.page.page_number if r.page else None,
                "selected_image_id": str(r.selected_image_id) if r.selected_image_id else None,
                "selected_image_title": img.title if img else "Unknown Image",
                "selected_image_description": img.description if img else "",
                "selected_position_index": r.selected_position_index,
                "latency_ms": r.latency_ms,
                "timeout_flag": r.timeout_flag,
                "time_limit_seconds": r.time_limit_seconds,
                "images_displayed": r.images_displayed,
                "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None
            })
        
        # Get chat history
        chat_history = []
        if participant_token_id:
            chats = db.query(ParticipantChatLog).filter(
                ParticipantChatLog.participant_token_id == participant_token_id
            ).order_by(ParticipantChatLog.created_at).all()
            chat_history = [{"sender": c.sender, "message": c.message} for c in chats]
        
        quiz_info = {
            "title": quiz.title,
            "description": quiz.description or "",
            "ai_overview": quiz.ai_overview or ""
        }
        
        # ✅ FIX: Use self.groq (not self.grok)
        response = await self.groq.analyze_responses(response_data, quiz_info)
        
        # Calculate most selected image
        most_selected = None
        if response_data:
            selected_titles = [r.get("selected_image_title") for r in response_data if r.get("selected_image_title")]
            if selected_titles:
                most_common = Counter(selected_titles).most_common(1)[0]
                most_selected = {
                    "title": most_common[0],
                    "count": most_common[1],
                    "percentage": round((most_common[1] / len(response_data) * 100), 1)
                }
        
        insight = AIInsight(
            quiz_id=quiz_id,
            participant_token_id=participant_token_id,
            insight_type="summary" if not participant_token_id else "participant_analysis",
            content={
                "analysis": response,
                "total_responses": len(responses),
                "chat_history": chat_history if participant_token_id else [],
                "most_selected": most_selected,
                "avg_latency": sum(r.latency_ms for r in responses if r.latency_ms) / len(responses) / 1000 if responses else 0
            }
        )
        db.add(insight)
        db.commit()
        db.refresh(insight)
        
        return {
            "insight_id": str(insight.id),
            "analysis": response,
            "total_responses": len(responses),
            "chat_history": chat_history if participant_token_id else [],
            "most_selected": most_selected,
            "avg_latency": sum(r.latency_ms for r in responses if r.latency_ms) / len(responses) / 1000 if responses else 0
        }
    
    async def generate_participant_chat_response(
        self,
        quiz_id: UUID,
        participant_token_id: UUID,
        message: str,
        db: Session,
        chat_history: List[Dict[str, str]] = []
    ) -> str:
        """Generate AI response for participant chat"""
        
        token = db.query(ParticipantToken).filter(
            ParticipantToken.id == participant_token_id
        ).first()
        
        if not token:
            raise ValueError("Participant token not found")
        
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise ValueError("Quiz not found")
        
        quiz_info = {
            "title": quiz.title,
            "description": quiz.description or "",
            "ai_overview": quiz.ai_overview or ""
        }
        
        # ✅ FIX: Use self.groq
        response = await self.groq.generate_chat_response(
            message=message,
            quiz_info=quiz_info,
            chat_history=chat_history
        )
        
        chat_log = ParticipantChatLog(
            quiz_id=quiz_id,
            participant_token_id=token.id,
            message=message,
            sender="participant"
        )
        db.add(chat_log)
        
        ai_log = ParticipantChatLog(
            quiz_id=quiz_id,
            participant_token_id=token.id,
            message=response,
            sender="ai"
        )
        db.add(ai_log)
        db.commit()
        
        return response
    
    async def answer_admin_question(
        self,
        quiz_id: UUID,
        question: str,
        db: Session
    ) -> str:
        """Answer admin's question about quiz data"""
        
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise ValueError("Quiz not found")
        
        responses = db.query(Response).filter(Response.quiz_id == quiz_id).all()
        
        if not responses:
            return "No responses found for this quiz yet. Please wait for participants to complete the quiz."
        
        chats = db.query(ParticipantChatLog).filter(
            ParticipantChatLog.quiz_id == quiz_id
        ).order_by(ParticipantChatLog.created_at).all()
        
        # ✅ Get image titles for each response
        response_data = []
        for r in responses[:50]:
            img = db.query(Image).filter(Image.id == r.selected_image_id).first() if r.selected_image_id else None
            response_data.append({
                "page_number": r.page.page_number if r.page else None,
                "selected_image_title": img.title if img else "Unknown Image",
                "selected_image_description": img.description if img else "",
                "selected_position_index": r.selected_position_index,
                "latency_ms": r.latency_ms,
                "timeout_flag": r.timeout_flag
            })
        
        chat_summary = []
        for c in chats[:50]:
            chat_summary.append({"sender": c.sender, "message": c.message})
        
        quiz_info = {
            "title": quiz.title,
            "description": quiz.description or "",
            "total_responses": len(responses)
        }
        
        answer = await self.groq.generate_admin_qa(
            question=question,
            quiz_info=quiz_info,
            responses=response_data  # ✅ Now contains image titles
        )
        
        return answer
    
    async def generate_faqs(
        self,
        quiz_id: UUID,
        db: Session
    ) -> List[Dict[str, str]]:
        """Generate FAQs for a quiz"""
        
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            print(f"❌ Quiz not found: {quiz_id}")
            return [
                {"question": "What is this quiz about?", "answer": "This quiz explores your visual preferences."},
                {"question": "How long will it take?", "answer": "The quiz takes 3-5 minutes."}
            ]
        
        quiz_info = {
            "title": quiz.title or "Visual Preference Quiz",
            "description": quiz.description or "",
            "ai_overview": quiz.ai_overview or ""
        }
        
        try:
            # ✅ FIX: Use self.groq
            faqs = await self.groq.generate_faqs(quiz_info)
            return faqs
        except Exception as e:
            print(f"❌ FAQ generation error: {e}")
            return [
                {"question": "What is this quiz about?", "answer": "This quiz explores your visual preferences."},
                {"question": "How long will it take?", "answer": "The quiz takes 3-5 minutes."}
            ]
    
    async def analyze_participant_chat(
        self,
        quiz_id: UUID,
        participant_token_id: UUID,
        db: Session
    ) -> Dict[str, Any]:
        """Analyze a participant's chat history"""
        
        chats = db.query(ParticipantChatLog).filter(
            ParticipantChatLog.quiz_id == quiz_id,
            ParticipantChatLog.participant_token_id == participant_token_id
        ).order_by(ParticipantChatLog.created_at).all()
        
        if not chats:
            return {"error": "No chat history found for this participant"}
        
        responses = db.query(Response).filter(
            Response.quiz_id == quiz_id,
            Response.participant_token_id == participant_token_id
        ).all()
        
        chat_data = []
        for c in chats:
            chat_data.append({"sender": c.sender, "message": c.message})
        
        response_data = []
        for r in responses:
            response_data.append({
                "page_number": r.page.page_number if r.page else None,
                "selected_position_index": r.selected_position_index,
                "latency_ms": r.latency_ms,
                "timeout_flag": r.timeout_flag
            })
        
        prompt = f"""
        Analyze this participant's chat history and quiz responses.
        
        Chat History:
        {json.dumps(chat_data, indent=2)}
        
        Quiz Responses:
        {json.dumps(response_data, indent=2)}
        
        Please provide:
        1. What the participant seems interested in
        2. Their mindset about the quiz topic
        3. Any concerns or questions they raised
        4. Overall sentiment
        5. Recommendations for the admin
        """
        
        system_prompt = """You are SightSpoke AI, an expert in analyzing participant behavior and preferences."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        # ✅ FIX: Use self.groq
        analysis = await self.groq.chat_completion(messages)
        
        insight = AIInsight(
            quiz_id=quiz_id,
            participant_token_id=participant_token_id,
            insight_type="participant_chat_analysis",
            content={
                "analysis": analysis,
                "chat_count": len(chats),
                "response_count": len(responses)
            }
        )
        db.add(insight)
        db.commit()
        db.refresh(insight)
        
        return {
            "insight_id": str(insight.id),
            "analysis": analysis,
            "chat_count": len(chats),
            "response_count": len(responses)
        }