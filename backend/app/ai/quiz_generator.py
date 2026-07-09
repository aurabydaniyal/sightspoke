import json
import httpx
import os
from typing import List, Dict, Any, Optional
from uuid import uuid4
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from .groq_client import GroqClient
from models import Quiz, QuizPage, Image, PageImage
from config import settings

class QuizGenerator:
    """Handles AI-powered quiz generation using GROQ"""
    
    def __init__(self):
        self.groq = GroqClient()
        self.pexels_api_key = os.getenv("PEXELS_API_KEY")
        self.pexels_base_url = "https://api.pexels.com/v1"
    
    async def generate_quiz(
        self,
        admin_id: str,
        topic: str,
        description: str,
        page_count: int,
        db: Session
    ) -> Dict[str, Any]:
        """Generate a complete quiz with AI + Pexels images"""
        
        subtopics = await self._generate_subtopics(topic, description, page_count)
        
        if not subtopics or len(subtopics) != page_count:
            raise ValueError(f"Failed to generate {page_count} subtopics")
        
        quiz = Quiz(
            id=uuid4(),
            admin_id=admin_id,
            title=topic,
            description=description,
            is_published=False,
            ai_overview=description,
            version=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(quiz)
        db.flush()
        
        for idx, subtopic in enumerate(subtopics, start=1):
            page = await self._create_page(
                quiz_id=quiz.id,
                page_number=idx,
                subtopic=subtopic,
                db=db
            )
            if not page:
                db.rollback()
                raise ValueError(f"Failed to create page {idx} for subtopic: {subtopic}")
        
        db.commit()
        db.refresh(quiz)
        
        return {
            "quiz_id": str(quiz.id),
            "title": quiz.title,
            "description": quiz.description,
            "pages": len(subtopics),
            "message": "Quiz generated successfully!"
        }
    
    async def _generate_subtopics(
        self,
        topic: str,
        description: str,
        page_count: int
    ) -> List[str]:
        """Generate subtopics using GROQ API"""
        
        prompt = f"""
        You are a quiz generator for visual preference testing.
        
        Quiz Topic: {topic}
        Quiz Description: {description}
        Number of Pages: {page_count}
        
        Generate {page_count} subtopics for this quiz. Each subtopic should be a specific theme or concept that:
        1. Relates to the main topic
        2. Can be represented by 2-3 relevant images
        3. Is distinct from other subtopics
        
        Return ONLY a JSON array of strings, nothing else.
        Example: ["Subtopic 1", "Subtopic 2", "Subtopic 3"]
        """
        
        messages = [
            {"role": "system", "content": "You are a helpful quiz generator. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response = await self.groq.chat_completion(messages, temperature=0.7, max_tokens=500)
            
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                subtopics = json.loads(json_match.group())
                if isinstance(subtopics, list) and len(subtopics) == page_count:
                    return subtopics
        except Exception as e:
            print(f"⚠️ Subtopics generation error: {e}")
        
        return [f"{topic} - Theme {i+1}" for i in range(page_count)]
    
    async def _create_page(
        self,
        quiz_id: str,
        page_number: int,
        subtopic: str,
        db: Session
    ) -> Optional[QuizPage]:
        """Create a page with images from Pexels"""
        
        page = QuizPage(
            id=uuid4(),
            quiz_id=quiz_id,
            page_number=page_number,
            time_limit_seconds=10,
            layout_template_id=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(page)
        db.flush()
        
        images_data = await self._fetch_images_from_pexels(subtopic, count=3)
        
        if not images_data:
            broader_keyword = subtopic.split(' ')[0] if ' ' in subtopic else subtopic
            images_data = await self._fetch_images_from_pexels(broader_keyword, count=3)
        
        if not images_data or len(images_data) < 2:
            images_data = self._get_placeholder_images(subtopic)
        
        # ✅ Save images with UNIQUE titles
        for idx, img_data in enumerate(images_data[:3]):
            # ✅ Create unique title with index
            unique_title = f"{subtopic} - View {idx + 1}" if idx > 0 else subtopic
            unique_description = f"Image of {subtopic} - Style {idx + 1}" if idx > 0 else f"Image of {subtopic}"
            
            image = Image(
                id=uuid4(),
                filename=img_data["filename"],
                file_path=img_data["url"],
                file_size=0,
                mime_type="image/jpeg",
                title=unique_title,  # ✅ UNIQUE title
                description=unique_description,  # ✅ UNIQUE description
                img_metadata={"source": "pexels", "original_url": img_data["url"]},
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(image)
            db.flush()
            
            page_image = PageImage(
                id=uuid4(),
                page_id=page.id,
                image_id=image.id,
                display_order=idx,
                position_index=idx,
                created_at=datetime.now(timezone.utc)
            )
            db.add(page_image)
        
        return page
    
    async def _fetch_images_from_pexels(
        self,
        query: str,
        count: int = 3
    ) -> List[Dict[str, Any]]:
        """Fetch images from Pexels API"""
        
        if not self.pexels_api_key:
            return self._get_placeholder_images(query)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.pexels_base_url}/search",
                    params={
                        "query": query,
                        "per_page": count * 2,
                        "orientation": "square"
                    },
                    headers={
                        "Authorization": self.pexels_api_key
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    print(f"⚠️ Pexels API error: {response.status_code}")
                    return self._get_placeholder_images(query)
                
                data = response.json()
                photos = data.get("photos", [])
                
                if not photos:
                    return self._get_placeholder_images(query)
                
                results = []
                for i, photo in enumerate(photos[:count]):
                    src = photo.get("src", {})
                    image_url = src.get("medium") or src.get("large") or src.get("original", "")
                    
                    if image_url:
                        # ✅ Use different titles for each image
                        result = {
                            "url": image_url,
                            "filename": f"pexels_{photo.get('id', '')}.jpg",
                            "title": f"{query} - View {i + 1}",  # ✅ UNIQUE
                            "description": f"Image of {query} - Style {i + 1}"  # ✅ UNIQUE
                        }
                        results.append(result)
                
                return results if results else self._get_placeholder_images(query)
                
        except Exception as e:
            print(f"⚠️ Pexels error: {e}")
            return self._get_placeholder_images(query)
    
    def _get_placeholder_images(self, query: str) -> List[Dict[str, Any]]:
        """Return placeholder images if Pexels fails"""
        return [
            {
                "url": "https://via.placeholder.com/400x400/428475/FFF4E1?text=Image+1",
                "filename": f"placeholder_1_{query[:10]}.jpg",
                "title": f"{query} - View 1",
                "description": f"Image of {query} - Style 1"
            },
            {
                "url": "https://via.placeholder.com/400x400/89D7B7/1A312C?text=Image+2",
                "filename": f"placeholder_2_{query[:10]}.jpg",
                "title": f"{query} - View 2",
                "description": f"Image of {query} - Style 2"
            },
            {
                "url": "https://via.placeholder.com/400x400/1A312C/FFF4E1?text=Image+3",
                "filename": f"placeholder_3_{query[:10]}.jpg",
                "title": f"{query} - View 3",
                "description": f"Image of {query} - Style 3"
            }
        ][:3]