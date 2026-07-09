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
        self.groq = GroqClient()
    
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
        
        # Get all images with their titles and descriptions
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
        
        response = await self.groq.analyze_responses(response_data, quiz_info)
        
        # ✅ Calculate most selected image with full metadata
        most_selected = None
        if response_data:
            # Count selections by image title
            selected_titles = [r.get("selected_image_title") for r in response_data if r.get("selected_image_title")]
            if selected_titles:
                most_common = Counter(selected_titles).most_common(1)[0]
                # Find the image with this title to get URL and description
                for r in response_data:
                    if r.get("selected_image_title") == most_common[0]:
                        most_selected = {
                            "title": most_common[0],
                            "count": most_common[1],
                            "percentage": round((most_common[1] / len(response_data) * 100), 1),
                            "url": r.get("selected_image_url", ""),  # ✅ ADD URL
                            "description": r.get("selected_image_description", ""),  # ✅ ADD DESCRIPTION
                            "selection_count": most_common[1]
                        }
                        break
                # If no URL found, try to get from image_map
                if most_selected and not most_selected.get("url"):
                    for img_id, img in image_map.items():
                        if img.title == most_selected["title"]:
                            most_selected["url"] = f"/uploads/{img.filename}"
                            most_selected["description"] = img.description or ""
                            break
        
        # ✅ Calculate avg latency with 2 decimal places
        avg_latency = 0
        if responses:
            total_latency = sum(r.latency_ms for r in responses if r.latency_ms)
            avg_latency = round((total_latency / len(responses) / 1000), 2) if responses else 0
        
        insight = AIInsight(
            quiz_id=quiz_id,
            participant_token_id=participant_token_id,
            insight_type="summary" if not participant_token_id else "participant_analysis",
            content={
                "analysis": response,
                "total_responses": len(responses),
                "chat_history": chat_history if participant_token_id else [],
                "most_selected": most_selected,
                "avg_latency": avg_latency
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
            "avg_latency": avg_latency
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
            responses=response_data
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
            img = db.query(Image).filter(Image.id == r.selected_image_id).first() if r.selected_image_id else None
            response_data.append({
                "page_number": r.page.page_number if r.page else None,
                "selected_image_title": img.title if img else "Unknown",
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
    
    # ✅ NEW METHOD: Combined chat summary for all participants
    async def generate_combined_chat_summary(
        self,
        quiz_id: UUID,
        db: Session
    ) -> Dict[str, Any]:
        """Generate a combined summary of all participant chats for a quiz"""
        
        # Get all chat logs for this quiz
        chats = db.query(ParticipantChatLog).filter(
            ParticipantChatLog.quiz_id == quiz_id
        ).order_by(ParticipantChatLog.created_at).all()
        
        if not chats:
            return {
                "summary": "No chat activity found for this quiz.",
                "total_messages": 0,
                "participants": 0
            }
        
        # Get unique participants
        participant_ids = set()
        chat_data = []
        for c in chats:
            participant_ids.add(str(c.participant_token_id))
            chat_data.append({
                "sender": c.sender,
                "message": c.message,
                "created_at": c.created_at.isoformat() if c.created_at else None
            })
        
        # Get quiz info
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        
        # Prepare prompt for combined analysis
        prompt = f"""
        Analyze ALL chat conversations from participants who took the quiz "{quiz.title if quiz else 'Unknown'}".
        
        Total Messages: {len(chats)}
        Total Participants: {len(participant_ids)}
        
        Chat Messages:
        {json.dumps(chat_data[:100], indent=2)}  # Limit to 100 messages for efficiency
        
        Please provide a COMBINED SUMMARY that covers:
        1. Most common questions asked by participants
        2. Key themes or topics discussed
        3. Overall sentiment across all participants
        4. Any concerns, confusion, or feedback mentioned
        5. Recommendations for the admin
        
        Format as a professional report.
        """
        
        system_prompt = """You are SightSpoke AI, an expert in analyzing participant feedback and questions.
        Provide a comprehensive, combined summary of all participant conversations.
        Focus on common themes, frequently asked questions, and overall sentiment.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        summary = await self.groq.chat_completion(messages, temperature=0.7, max_tokens=2000)
        
        return {
            "summary": summary,
            "total_messages": len(chats),
            "participants": len(participant_ids)
        }