import json
import os
from typing import List, Dict, Any, Optional
from uuid import uuid4
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from .groq_client import GroqClient
from .sd_client import SDClient
from models import Quiz, QuizPage, Image, PageImage, AdminUser
from config import settings

class QuizGenerator:
    """Enhanced AI-powered quiz generator with psychological descriptions and SD images"""
    
    def __init__(self):
        self.groq = GroqClient()
        self.sd = SDClient()
    
    async def generate_quiz(
        self,
        admin_id: str,
        topic: str,
        description: str,
        page_count: int,
        db: Session
    ) -> Dict[str, Any]:
        """Generate a complete quiz with psychological descriptions and AI images"""
        
        print(f"🚀 Starting AI quiz generation: {topic}")
        
        # ✅ Validate page count (3-6)
        if page_count < 3 or page_count > 6:
            raise ValueError("Page count must be between 3 and 6")
        
        # Step 1: Generate psychological subtopics
        subtopics = await self._generate_psychological_subtopics(topic, description, page_count)
        
        if not subtopics or len(subtopics) != page_count:
            raise ValueError(f"Failed to generate {page_count} subtopics")
        
        # Step 2: Create quiz record with psychological context
        quiz = Quiz(
            id=uuid4(),
            admin_id=admin_id,
            title=topic,
            description=description,
            is_published=False,
            ai_overview=f"Psychological assessment quiz: {topic} - {description}",
            version=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(quiz)
        db.flush()
        
        print(f"📝 Quiz created: {quiz.id}")
        
        # Step 3: For each subtopic, create a page with psychological images
        for idx, subtopic_data in enumerate(subtopics, start=1):
            print(f"📄 Generating page {idx}: {subtopic_data['title']}")
            
            page = await self._create_psychological_page(
                quiz_id=quiz.id,
                page_number=idx,
                subtopic_data=subtopic_data,
                db=db
            )
            if not page:
                db.rollback()
                raise ValueError(f"Failed to create page {idx}")
        
        db.commit()
        db.refresh(quiz)
        
        print(f"✅ Quiz generated successfully with {len(subtopics)} pages")
        
        return {
            "quiz_id": str(quiz.id),
            "title": quiz.title,
            "description": quiz.description,
            "pages": len(subtopics),
            "message": "Quiz generated successfully with psychological images!"
        }
    
    # File: backend/app/ai/quiz_generator.py

    async def _generate_psychological_subtopics(
        self,
        topic: str,
        description: str,
        page_count: int
    ) -> List[Dict[str, str]]:
        """Generate psychological subtopics with DIVERSE perspectives"""
        
        prompt = f"""
        You are a Clinical Psychologist and Survey Expert creating a psychological assessment survey.
        
        Survey Topic: {topic}
        Survey Description: {description}
        Number of Pages: {page_count}
        
        For EACH page, generate TWO DIFFERENT PERSPECTIVES of the same psychological concept.
        Each perspective should represent a DIFFERENT angle or scenario.
        
        Return ONLY a JSON array of objects with these fields:
        - "title": Subtopic title (same for both images on the page)
        - "psychological_concept": Psychological concept being measured
        - "perspective_1": Description for first image (scenario/angle 1)
        - "perspective_2": Description for second image (scenario/angle 2 - DIFFERENT from perspective 1)
        - "analysis_context": How this relates to the survey
        
        IMPORTANT: perspective_1 and perspective_2 must be DIFFERENT and show CONTRASTING or COMPLEMENTARY scenarios.
        
        Example for Dental Health:
        perspective_1: "A person brushing teeth thoroughly in the morning"
        perspective_2: "A person eating sugary dessert without brushing afterwards"
        
        Generate {page_count} subtopics.
        """
        
        messages = [
            {"role": "system", "content": "You are a Clinical Psychologist. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        try:
            response = await self.groq.chat_completion(messages, temperature=0.8, max_tokens=2000)
            
            import re
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                subtopics = json.loads(json_match.group())
                if isinstance(subtopics, list) and len(subtopics) == page_count:
                    return subtopics
        except Exception as e:
            print(f"⚠️ Subtopics error: {e}")
        
        # Fallback
        return [
            {
                "title": f"{topic} - Concept {i+1}",
                "psychological_concept": f"Concept related to {topic}",
                "perspective_1": f"Scenario A for {topic} concept {i+1}",
                "perspective_2": f"Scenario B for {topic} concept {i+1} (different)",
                "analysis_context": f"Measures aspect of {topic}"
            }
            for i in range(page_count)
        ]


    async def _create_psychological_page(
        self,
        quiz_id: str,
        page_number: int,
        subtopic_data: Dict[str, str],
        db: Session
    ) -> Optional[QuizPage]:
        """Create a page with two DIFFERENT psychologically-themed images"""
        
        page = QuizPage(
            id=uuid4(),
            quiz_id=quiz_id,
            page_number=page_number,
            time_limit_seconds=15,
            layout_template_id=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(page)
        db.flush()
        
        print(f"📄 Page {page_number} created: {page.id}")
        
        # ✅ Generate TWO DIFFERENT images with distinct perspectives
        # Perspective 1
        prompt_1 = subtopic_data.get("perspective_1", subtopic_data.get("image_description", ""))
        # Perspective 2 - DIFFERENT from perspective 1
        prompt_2 = subtopic_data.get("perspective_2", subtopic_data.get("image_description", ""))
        
        # Generate image 1
        img_data_1 = await self.sd.generate_image_data(
            prompt=prompt_1,
            title=f"{subtopic_data['title']} - Scenario 1",
            description=prompt_1,
            psychological_concept=subtopic_data.get("psychological_concept", ""),
            analysis_context=subtopic_data.get("analysis_context", "")
        )
        
        # Generate image 2
        img_data_2 = await self.sd.generate_image_data(
            prompt=prompt_2,
            title=f"{subtopic_data['title']} - Scenario 2",
            description=prompt_2,
            psychological_concept=subtopic_data.get("psychological_concept", ""),
            analysis_context=subtopic_data.get("analysis_context", "")
        )
        
        # Save both images
        for idx, img_data in enumerate([img_data_1, img_data_2]):
            image = Image(
                id=uuid4(),
                filename=f"sd_{page_number}_{idx}.png",
                file_path=img_data["url"],
                file_size=0,
                mime_type="image/png",
                title=img_data["title"],
                description=img_data["description"],
                img_metadata={
                    "source": "stable-diffusion",
                    "psychological_concept": subtopic_data.get("psychological_concept", ""),
                    "analysis_context": subtopic_data.get("analysis_context", ""),
                    "perspective": "scenario_1" if idx == 0 else "scenario_2",
                    "generated_at": datetime.now(timezone.utc).isoformat()
                },
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
            
            print(f"🖼️ Image {idx+1} added: {img_data['title']}")
        
        return page
    
    def _get_fallback_images(self, subtopic_data: Dict[str, str]) -> List[Dict[str, str]]:
        """Return fallback images if SD fails"""
        return [
            {
                "url": "https://via.placeholder.com/512x512/428475/FFF4E1?text=Psychological+Image",
                "title": f"{subtopic_data['title']} - View 1",
                "description": subtopic_data.get("image_description", "Psychological image"),
            },
            {
                "url": "https://via.placeholder.com/512x512/89D7B7/1A312C?text=Psychological+Image",
                "title": f"{subtopic_data['title']} - View 2",
                "description": subtopic_data.get("image_description", "Psychological image"),
            }
        ]