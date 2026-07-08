from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any

from .groq_client import GroqClient
from models import ParticipantChatLog, Quiz, AIInsight
from .prompts import SYSTEM_PROMPTS, USER_PROMPT_TEMPLATES

class ChatService:
    """Service for handling AI chat functionality"""
    
    def __init__(self):
        self.groq = GroqClient()
    
    async def get_participant_chat_history(
        self,
        quiz_id: UUID,
        participant_token_id: UUID,
        db: Session,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get chat history for a participant"""
        
        chats = db.query(ParticipantChatLog).filter(
            ParticipantChatLog.quiz_id == quiz_id,
            ParticipantChatLog.participant_token_id == participant_token_id
        ).order_by(ParticipantChatLog.created_at.desc()).limit(limit).all()
        
        # Return in chronological order
        return [
            {
                "id": str(chat.id),
                "message": chat.message,
                "sender": chat.sender,
                "created_at": chat.created_at.isoformat() if chat.created_at else None
            }
            for chat in reversed(chats)
        ]
    
    async def get_quiz_chat_summary(
        self,
        quiz_id: UUID,
        db: Session
    ) -> Dict[str, Any]:
        """Get summary of all chats for a quiz"""
        
        # Get all chat logs for this quiz
        chats = db.query(ParticipantChatLog).filter(
            ParticipantChatLog.quiz_id == quiz_id
        ).order_by(ParticipantChatLog.created_at).all()
        
        if not chats:
            return {
                "total_chats": 0,
                "participants": 0,
                "summary": "No chat activity yet."
            }
        
        # Get unique participants
        participant_ids = set()
        for chat in chats:
            if chat.participant_token_id:
                participant_ids.add(str(chat.participant_token_id))
        
        # Get quiz info
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        
        # Prepare data for AI summary
        chat_messages = []
        for chat in chats[:100]:  # Limit for efficiency
            chat_messages.append({
                "sender": chat.sender,
                "message": chat.message[:200]  # Truncate long messages
            })
        
        # Generate AI summary
        prompt = f"""
        Analyze the following chat messages from participants taking the quiz "{quiz.title if quiz else 'Unknown'}".
        
        Total Messages: {len(chats)}
        Total Participants: {len(participant_ids)}
        
        Sample Messages:
        {chat_messages[:30]}
        
        Please provide:
        1. Common themes in participant questions
        2. Frequently asked questions
        3. Any concerns or confusion expressed
        4. Overall sentiment
        5. Recommendations for improving the quiz
        """
        
        system_prompt = """You are SightSpoke AI, an expert in analyzing participant feedback and questions.
        Provide clear, actionable insights based on chat conversations.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        summary = await self.grok.chat_completion(messages, temperature=0.7, max_tokens=1000)
        
        return {
            "total_chats": len(chats),
            "participants": len(participant_ids),
            "summary": summary
        }
    
    async def get_chat_insights_for_participant(
        self,
        quiz_id: UUID,
        participant_token_id: UUID,
        db: Session
    ) -> Dict[str, Any]:
        """Get AI insights for a specific participant based on their chat"""
        
        # Get chat history
        chats = db.query(ParticipantChatLog).filter(
            ParticipantChatLog.quiz_id == quiz_id,
            ParticipantChatLog.participant_token_id == participant_token_id
        ).order_by(ParticipantChatLog.created_at).all()
        
        if not chats:
            return {"error": "No chat history found for this participant"}
        
        # Prepare chat data
        chat_data = []
        for chat in chats:
            chat_data.append({
                "sender": chat.sender,
                "message": chat.message
            })
        
        # Get quiz info
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        
        # Generate insights
        prompt = f"""
        Analyze this participant's chat conversation about the quiz "{quiz.title if quiz else 'Unknown'}".
        
        Chat History:
        {chat_data}
        
        Please provide:
        1. What the participant seems interested in
        2. Their understanding of the quiz
        3. Any concerns or confusion
        4. Overall sentiment
        5. Recommendations for the admin
        """
        
        system_prompt = """You are SightSpoke AI, an expert in analyzing participant behavior and understanding.
        Provide clear, empathetic insights about the participant's experience.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        insight = await self.grok.chat_completion(messages, temperature=0.7, max_tokens=1000)
        
        # Save insight to database
        ai_insight = AIInsight(
            quiz_id=quiz_id,
            participant_token_id=participant_token_id,
            insight_type="participant_chat_insight",
            content={
                "analysis": insight,
                "chat_count": len(chats)
            }
        )
        db.add(ai_insight)
        db.commit()
        db.refresh(ai_insight)
        
        return {
            "insight_id": str(ai_insight.id),
            "analysis": insight,
            "chat_count": len(chats)
        }