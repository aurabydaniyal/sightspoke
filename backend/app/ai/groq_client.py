import os
import json
from typing import List, Dict, Any, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

class GroqClient:
    """Client for interacting with Groq API"""
    
    def __init__(self):
        # ✅ CHANGE: Use GROQ_API_KEY instead of GROK_API_KEY
        self.api_key = os.getenv("GROQ_API_KEY")
        # ✅ CHANGE: Use Groq base URL
        self.base_url = "https://api.groq.com/openai/v1"
        # ✅ CHANGE: Use Groq model
        self.model = "llama-3.3-70b-versatile"  # or "llama-3.1-8b-instant"
        
        if not self.api_key:
            print("⚠️ WARNING: GROQ_API_KEY not found in environment variables")
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """Send a chat completion request to Groq"""
        
        if not self.api_key:
            return "⚠️ API key not configured. Please add GROQ_API_KEY to .env file."
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    },
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    print(f"❌ Groq API error: {response.status_code} - {response.text}")
                    return f"⚠️ AI service error. Please try again later."
                
                data = response.json()
                return data["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"❌ Groq API exception: {e}")
                return "⚠️ AI service temporarily unavailable. Please try again later."
    
    async def generate_faqs(
        self,
        quiz_info: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate FAQs for a quiz"""
        
        system_prompt = """You are SightSpoke AI. Generate helpful FAQs for a visual preference quiz.
        Create 5-7 frequently asked questions that participants might have.
        Format as a list of objects with 'question' and 'answer' fields.
        Return ONLY valid JSON, no other text."""
        
        user_prompt = f"""
        Quiz Title: {quiz_info.get('title', 'Visual Preference Quiz')}
        Quiz Description: {quiz_info.get('description', '')}
        AI Overview: {quiz_info.get('ai_overview', '')}
        
        Generate FAQs for this quiz.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        try:
            response = await self.chat_completion(messages, temperature=0.7, max_tokens=1500)
            
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                faqs = json.loads(json_match.group())
                return faqs
            
            # Fallback parsing
            faqs = []
            lines = response.split('\n')
            current_q = None
            for line in lines:
                line = line.strip()
                if line.startswith(('Q:', 'Question:', '"question"')):
                    if ':' in line:
                        parts = line.split(':', 1)
                        current_q = parts[1].strip()
                elif current_q and line.startswith(('A:', 'Answer:', '"answer"')):
                    if ':' in line:
                        parts = line.split(':', 1)
                        answer = parts[1].strip()
                        faqs.append({"question": current_q, "answer": answer})
                        current_q = None
            
            if faqs:
                return faqs
            
            return [
                {"question": "What is this quiz about?", "answer": "This quiz explores your visual preferences and decision-making patterns."},
                {"question": "How long will it take?", "answer": "The quiz typically takes 3-5 minutes to complete."},
                {"question": "What do my results mean?", "answer": "Your results help understand your personal preferences and thinking style."},
                {"question": "Is my data private?", "answer": "Yes, all responses are completely anonymous and private."},
                {"question": "Can I retake the quiz?", "answer": "Yes, you can retake the quiz anytime using the same link."}
            ]
        except Exception as e:
            print(f"❌ FAQ generation error: {e}")
            return [
                {"question": "What is this quiz about?", "answer": "This quiz explores your visual preferences."},
                {"question": "How long will it take?", "answer": "The quiz takes 3-5 minutes."},
                {"question": "Is my data private?", "answer": "Yes, all responses are anonymous."}
            ]
    
    async def generate_chat_response(
        self,
        message: str,
        quiz_info: Dict[str, Any],
        chat_history: List[Dict[str, str]] = []
    ) -> str:
        """Generate a response for the participant chatbot"""
        
        system_prompt = f"""You are SightSpoke AI, a friendly and helpful assistant for a visual preference quiz.
        
        Quiz Topic: {quiz_info.get('title', 'Visual Preference Quiz')}
        Quiz Description: {quiz_info.get('description', '')}
        AI Overview: {quiz_info.get('ai_overview', '')}
        
        Your role is to:
        1. Answer questions about this quiz
        2. Discuss the participant's preferences and choices
        3. Keep the conversation focused on the quiz topic
        4. Be engaging and conversational
        5. Ask questions about their preferences
        
        Important Rules:
        - Stay on topic (the quiz and visual preferences)
        - Don't discuss unrelated subjects
        - Be positive and encouraging
        - If asked about something unrelated, gently guide back to the quiz topic
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in chat_history[-10:]:
            messages.append(msg)
        
        messages.append({"role": "user", "content": message})
        
        response = await self.chat_completion(messages, temperature=0.8, max_tokens=500)
        return response if response else "I'm not sure how to respond to that. Can you ask something else about the quiz?"
    
    async def analyze_responses(
        self,
        responses: List[Dict[str, Any]],
        quiz_info: Dict[str, Any],
        chat_history: List[Dict[str, Any]] = []  # ✅ ADD THIS PARAMETER
    ) -> str:
        """Analyze participant responses and generate insights"""
        
        # ✅ Include chat history in the prompt
        chat_summary = ""
        if chat_history:
            # Summarize chat messages
            participant_messages = [c for c in chat_history if c.get("sender") == "participant"]
            ai_messages = [c for c in chat_history if c.get("sender") == "ai"]
            
            chat_summary = f"""
            Chat History:
            - Total Messages: {len(chat_history)}
            - Participant Messages: {len(participant_messages)}
            - AI Responses: {len(ai_messages)}
            
            Sample Messages:
            {json.dumps(chat_history[:20], indent=2)}
            """
        
        formatted_responses = []
        for r in responses:
            image_title = r.get("selected_image_title", "Unknown Image")
            image_desc = r.get("selected_image_description", "")
            
            formatted_responses.append({
                "page": r.get("page_number", "Unknown"),
                "selected_image": image_title,
                "image_description": image_desc[:100] if image_desc else "",
                "decision_time_ms": r.get("latency_ms", 0),
                "timed_out": r.get("timeout_flag", False),
                "time_limit": r.get("time_limit_seconds", 0)
            })
        
        response_summary = {
            "total_responses": len(responses),
            "quiz_title": quiz_info.get("title", "Unknown"),
            "quiz_description": quiz_info.get("description", ""),
            "responses": formatted_responses,
            "chat_history": chat_summary,  # ✅ ADD CHAT SUMMARY
            "total_chat_messages": quiz_info.get("total_chat_messages", 0),
            "chat_participants": quiz_info.get("chat_participants", 0)
        }
        
        system_prompt = """You are SightSpoke AI, an expert in behavioral analysis and visual preference testing.
        You analyze how people make decisions based on what they choose and how fast they choose it.
        Provide professional insights in clear language.
        
        IMPORTANT RULES:
        1. When referring to images, ALWAYS use their TITLES (not UUIDs or URLs)
        2. For example, say "Mountain Landscape" instead of "/uploads/image123.jpg"
        3. If an image has a description, use it to provide context
        4. Be specific about which images were most selected
        5. If chat history is provided, include insights about what participants asked most
        6. If no chat history is available, mention that chat history was not available
        """
        
        user_prompt = f"""
        I have a quiz titled "{quiz_info.get('title', 'Unknown')}".
        I collected {len(responses)} responses from participants.
        
        Response Data:
        {json.dumps(response_summary, indent=2)[:10000]}
        
        Please provide:
        1. Key patterns in selections (use image TITLES)
        2. Insights about decision-making behavior
        3. Recommendations for the admin
        4. What participants asked about most (use the chat history provided above)
        
        If no chat history is available, clearly state: "Chat history not available for this analysis."
        Be specific about which images were most selected using their titles.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return await self.chat_completion(messages, temperature=0.7, max_tokens=2000)

    async def generate_admin_qa(
        self,
        question: str,
        quiz_info: Dict[str, Any],
        responses: List[Dict[str, Any]]
    ) -> str:
        """Answer admin's questions about quiz data"""
        
        system_prompt = """You are SightSpoke AI, an expert data analyst for visual preference testing.
        Provide clear, concise, and accurate answers based on the data provided.
        
        IMPORTANT: When referring to images, ALWAYS use their TITLES (not UUIDs or URLs).
        For example, say "Mountain Landscape" instead of "/uploads/image123.jpg".
        """
        
        data_summary = {
            "quiz_title": quiz_info.get("title", "Unknown"),
            "total_responses": len(responses),
            "responses": responses[:15]
        }
        
        user_prompt = f"""
        Quiz Data: {json.dumps(data_summary, indent=2)[:5000]}
        
        Admin Question: {question}
        
        Please answer based on the data provided. Use image titles when referring to specific images.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return await self.chat_completion(messages, temperature=0.5, max_tokens=1000)