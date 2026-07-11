import os
import json
from typing import List, Dict, Any, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

class GroqClient:
    """Client for GROQ API - Complete with all methods"""
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1"
        self.model = "llama-3.3-70b-versatile"
        
        if not self.api_key:
            print("⚠️ WARNING: GROQ_API_KEY not found")
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 3000
    ) -> str:
        """Base chat completion method"""
        if not self.api_key:
            return "⚠️ API key not configured. Please add GROQ_API_KEY to .env"
        
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
                    timeout=120.0
                )
                
                if response.status_code != 200:
                    print(f"❌ GROQ API error: {response.status_code}")
                    print(f"❌ Response: {response.text[:500]}")
                    return "⚠️ AI service error. Please try again."
                
                data = response.json()
                return data["choices"][0]["message"]["content"]
                
            except httpx.TimeoutException:
                print("❌ GROQ API timeout")
                return "⚠️ AI service is taking too long. Please try again."
            except Exception as e:
                print(f"❌ GROQ exception: {e}")
                return f"⚠️ AI service temporarily unavailable: {str(e)}"
    
    # ============================================================
    # ORIGINAL METHODS
    # ============================================================
    
    async def analyze_responses(
        self,
        responses: List[Dict[str, Any]],
        quiz_info: Dict[str, Any]
    ) -> str:
        """Original response analysis"""
        
        response_summary = {
            "total_responses": len(responses),
            "quiz_title": quiz_info.get("title", "Unknown"),
            "quiz_description": quiz_info.get("description", ""),
            "responses": responses[:20]
        }
        
        system_prompt = """You are SightSpoke AI, an expert in behavioral analysis and visual preference testing."""
        
        user_prompt = f"""
        I have a quiz titled "{quiz_info.get('title', 'Unknown')}".
        I collected {len(responses)} responses from participants.
        
        Response Data: {json.dumps(response_summary, indent=2)[:8000]}
        
        Please provide:
        1. Key patterns in selections (using image titles)
        2. Insights about decision-making behavior
        3. Recommendations for the admin
        4. What participants asked about most (if chat history available)
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return await self.chat_completion(messages, temperature=0.7, max_tokens=2000)
    
    async def generate_chat_response(
        self,
        message: str,
        quiz_info: Dict[str, Any],
        chat_history: List[Dict[str, str]] = []
    ) -> str:
        """Participant chat response"""
        
        system_prompt = f"""You are SightSpoke AI, a friendly assistant for a visual preference quiz.
        
        Quiz Topic: {quiz_info.get('title', 'Visual Preference Quiz')}
        Quiz Description: {quiz_info.get('description', '')}
        AI Overview: {quiz_info.get('ai_overview', '')}
        
        Rules:
        - Stay on topic (the quiz and visual preferences)
        - Don't discuss unrelated subjects
        - Be positive and encouraging
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in chat_history[-10:]:
            messages.append(msg)
        
        messages.append({"role": "user", "content": message})
        
        return await self.chat_completion(messages, temperature=0.8, max_tokens=500)
    
    async def generate_admin_qa(
        self,
        question: str,
        quiz_info: Dict[str, Any],
        responses: List[Dict[str, Any]]
    ) -> str:
        """Admin Q&A"""
        
        system_prompt = """You are SightSpoke AI, an expert data analyst."""
        
        data_summary = {
            "quiz_title": quiz_info.get("title", "Unknown"),
            "total_responses": len(responses),
            "responses": responses[:15]
        }
        
        user_prompt = f"""
        Quiz Data: {json.dumps(data_summary, indent=2)[:5000]}
        
        Admin Question: {question}
        
        Please answer based on the data provided.
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return await self.chat_completion(messages, temperature=0.5, max_tokens=1000)
    
    async def generate_faqs(
        self,
        quiz_info: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate FAQs"""
        
        system_prompt = """You are SightSpoke AI. Generate helpful FAQs for a visual preference quiz.
        Format as a list of objects with 'question' and 'answer' fields.
        Return ONLY valid JSON."""
        
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
        
        response = await self.chat_completion(messages, temperature=0.7, max_tokens=1500)
        
        try:
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except:
            pass
        
        return [
            {"question": "What is this quiz about?", "answer": "This quiz explores your visual preferences."},
            {"question": "How long will it take?", "answer": "The quiz takes 3-5 minutes."},
            {"question": "Is my data private?", "answer": "Yes, all responses are anonymous."}
        ]
    
    # ============================================================
    # PSYCHOLOGICAL METHODS - FIXED WITH ERROR HANDLING
    # ============================================================

    async def analyze_survey_responses(
        self,
        responses: List[Dict[str, Any]],
        quiz_info: Dict[str, Any],
        chat_history: List[Dict[str, str]] = []
    ) -> str:
        """Professional Survey Expert Analysis"""
        
        formatted_responses = []
        for r in responses:
            formatted_responses.append({
                "page": r.get("page_number", "Unknown"),
                "selected_image": r.get("selected_image_title", "Unknown"),
                "selected_description": r.get("psychological_description", ""),
                "psychological_concept": r.get("psychological_concept", ""),
                "analysis_context": r.get("analysis_context", ""),
                "decision_time_ms": r.get("latency_ms", 0),
                "timed_out": r.get("timeout_flag", False),
            })
        
        response_summary = {
            "total_responses": len(responses),
            "quiz_title": quiz_info.get("title", "Unknown"),
            "quiz_description": quiz_info.get("description", ""),
            "responses": formatted_responses[:30],
            "chat_history": chat_history[:30] if chat_history else []
        }
        
        system_prompt = """You are a Senior Survey Expert and Clinical Psychologist with 20+ years of experience in behavioral analysis and survey research.

    Your task is to analyze survey data and provide professional insights.

    IMPORTANT RULES:
    1. ALWAYS use image TITLES when referring to images (not IDs or URLs)
    2. Use natural, professional language
    3. Structure your response with clear headings
    4. Use bullet points for key findings
    5. Speak like a survey expert analyzing real data

    Your response MUST have these sections:

    ## Executive Summary
    [2-3 sentences summarizing the key finding]

    ## Key Findings
    - Finding 1
    - Finding 2
    - Finding 3

    ## Behavioral Patterns
    [Analysis of what the selections reveal about participants]

    ## Implications
    [What these patterns mean in real-world context]

    ## Recommendations
    [Actionable recommendations based on findings]

    Use professional language. Avoid markdown symbols."""
        
        user_prompt = f"""
    Survey Topic: {quiz_info.get('title', 'Unknown')}
    Survey Description: {quiz_info.get('description', '')}
    Total Participants: {len(responses)}

    Response Data:
    {json.dumps(response_summary, indent=2)[:12000]}

    Chat History:
    {json.dumps(chat_history, indent=2)[:5000]}

    Please provide a professional survey analysis.
    """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return await self.chat_completion(messages, temperature=0.5, max_tokens=4000)


    async def analyze_individual_participant(
        self,
        responses: List[Dict[str, Any]],
        chat_history: List[Dict[str, str]],
        quiz_info: Dict[str, Any]
    ) -> str:
        """Individual participant summary report"""
        
        system_prompt = """You are a Senior Survey Expert and Clinical Psychologist.

    Your task is to create a CONCISE SUMMARY report for an individual participant.

    IMPORTANT RULES:
    1. Keep it brief and actionable (2-3 paragraphs maximum)
    2. Focus on key insights, not everything
    3. Use professional but accessible language
    4. Include 3-5 bullet points for quick reading
    5. Speak like a survey expert summarizing individual data

    Example format:
    ## Participant Summary
    [Brief overview of their pattern]

    ## Key Observations
    - Observation 1
    - Observation 2
    - Observation 3

    ## Recommendation
    [One actionable recommendation]

    Use professional language. Avoid markdown symbols."""
        
        user_prompt = f"""
    Survey: {quiz_info.get('title', 'Unknown')}

    Participant Responses:
    {json.dumps(responses, indent=2)[:5000]}

    Chat History:
    {json.dumps(chat_history, indent=2)[:3000]}

    Please provide a concise summary report for this participant.
    """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        return await self.chat_completion(messages, temperature=0.4, max_tokens=2000)

    async def generate_image_prompt(
        self,
        subtopic: str,
        description: str
    ) -> Dict[str, str]:
        """Generate psychologically-focused image prompts"""
        
        try:
            prompt = f"""
        You are a Clinical Psychologist creating image prompts.

        Subtopic: {subtopic}
        Description: {description}

        Return ONLY JSON:
        {{
            "prompt": "Detailed prompt for Stable Diffusion",
            "title": "Image title",
            "psychological_description": "Psychological meaning",
            "psychological_concept": "The concept being measured"
        }}
        """
            
            messages = [
                {"role": "system", "content": "You are a Clinical Psychologist. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.chat_completion(messages, temperature=0.7, max_tokens=800)
            
            try:
                import re
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            except:
                pass
            
            return {
                "prompt": f"professional photograph, realistic, {description}, high quality",
                "title": subtopic,
                "psychological_description": description,
                "psychological_concept": subtopic
            }
            
        except Exception as e:
            print(f"❌ Image prompt error: {e}")
            return {
                "prompt": f"professional photograph, realistic, {description}, high quality",
                "title": subtopic,
                "psychological_description": description,
                "psychological_concept": subtopic
            }
    
    async def answer_expert_query(
        self,
        question: str,
        quiz_info: Dict[str, Any],
        responses: List[Dict[str, Any]],
        chat_history: List[Dict[str, str]] = []
    ) -> str:
        """Expert-level admin query"""
        
        try:
            system_prompt = """You are a Senior Clinical Psychologist. Answer the admin's question professionally.

        Use natural text with headings and paragraphs. Avoid markdown symbols."""
            
            user_prompt = f"""
        Survey: {quiz_info.get('title', 'Unknown')}
        Question: {question}

        Data:
        {json.dumps({
            "total_responses": len(responses),
            "responses": responses[:20],
            "chats": chat_history[:20]
        }, indent=2)[:8000]}

        Please provide a professional response.
        """
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            return await self.chat_completion(messages, temperature=0.5, max_tokens=1500)
            
        except Exception as e:
            print(f"❌ Expert query error: {e}")
            return f"⚠️ Error answering query: {str(e)}"