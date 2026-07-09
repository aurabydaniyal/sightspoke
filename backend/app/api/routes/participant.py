from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional

from database import get_db
from models import ParticipantToken, Quiz, QuizPage, Image, Response

router = APIRouter()

# ============================================================
# VALIDATE PARTICIPANT TOKEN
# ============================================================

@router.get("/validate/{token}")
async def validate_participant_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Validate a participant token and return quiz information.
    This is the entry point for participants.
    """
    # Find token
    participant_token = db.query(ParticipantToken).filter(
        ParticipantToken.token == token,
        ParticipantToken.is_used == False,
        ParticipantToken.is_expired == False,
        ParticipantToken.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not participant_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired token")
    
    # Get quiz
    quiz = db.query(Quiz).filter(Quiz.id == participant_token.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    # Get pages
    pages = db.query(QuizPage).filter(QuizPage.quiz_id == quiz.id).order_by(QuizPage.page_number).all()
    total_time = sum(page.time_limit_seconds for page in pages)
    
    return {
        "quiz_id": str(quiz.id),
        "title": quiz.title,
        "description": quiz.description,
        "ai_overview": quiz.ai_overview or "",
        "pages": len(pages),
        "total_time": total_time,
        "is_published": quiz.is_published
    }


# ============================================================
# GET QUIZ PAGE
# ============================================================

@router.get("/{token}/page/{page_number}")
async def get_quiz_page(
    token: str,
    page_number: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific page of the quiz with images.
    """
    # Validate token
    participant_token = db.query(ParticipantToken).filter(
        ParticipantToken.token == token,
        ParticipantToken.is_used == False,
        ParticipantToken.is_expired == False,
        ParticipantToken.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not participant_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired token")
    
    # Get quiz
    quiz = db.query(Quiz).filter(Quiz.id == participant_token.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    # Get page
    page = db.query(QuizPage).filter(
        QuizPage.quiz_id == quiz.id,
        QuizPage.page_number == page_number
    ).first()
    
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    
    # ✅ Get images with correct data for display
    images = []
    for pi in page.page_images:
        image = pi.image
        if image:
            # ✅ Check if it's a Pexels URL or local file
            image_url = None
            if image.file_path and image.file_path.startswith('http'):
                # Pexels URL
                image_url = image.file_path
            elif image.file_path and image.file_path.startswith('/uploads/'):
                # Local file with full path
                image_url = image.file_path
            else:
                # Local file - construct URL
                image_url = f"/uploads/{image.filename}" if image.filename else None
            
            images.append({
                "id": str(image.id),
                "url": image_url,
                "filename": image.filename,
                "file_path": image.file_path,
                "title": image.title or "",
                "description": image.description or "",
                "position_index": pi.position_index
            })
    
    # Get total pages
    total_pages = db.query(QuizPage).filter(QuizPage.quiz_id == quiz.id).count()
    
    return {
        "page_id": str(page.id),
        "page_number": page.page_number,
        "time_limit_seconds": page.time_limit_seconds,
        "layout_class": page.layout.css_class if page.layout else "grid-layout-2x2",
        "images": images,
        "total_pages": total_pages,
        "is_last_page": page_number == total_pages
    }


# ============================================================
# SUBMIT RESPONSE
# ============================================================

@router.post("/{token}/response")
async def submit_response(
    token: str,
    response_data: dict,
    db: Session = Depends(get_db)
):
    """
    Submit a participant's response for a page.
    """
    # Validate token
    participant_token = db.query(ParticipantToken).filter(
        ParticipantToken.token == token,
        ParticipantToken.is_used == False,
        ParticipantToken.is_expired == False,
        ParticipantToken.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not participant_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired token")
    
    # Get page
    page = db.query(QuizPage).filter(QuizPage.id == response_data.get("page_id")).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    
    # ✅ Get images displayed for this page
    page_images = page.page_images
    images_displayed = [str(pi.image_id) for pi in sorted(page_images, key=lambda x: x.display_order)]
    randomized_order = images_displayed.copy()
    
    # ✅ Create response
    response = Response(
        quiz_id=page.quiz_id,
        participant_token_id=participant_token.id,
        page_id=page.id,
        selected_image_id=response_data.get("selected_image_id"),
        selected_position_index=response_data.get("selected_position_index"),
        latency_ms=response_data.get("latency_ms"),
        timeout_flag=response_data.get("timeout_flag", False),
        time_limit_seconds=page.time_limit_seconds,
        layout_template_id=page.layout_template_id,
        images_displayed=images_displayed,
        randomized_order=randomized_order
    )
    
    db.add(response)
    
    # ✅ Check if this was the last page
    total_pages = db.query(QuizPage).filter(QuizPage.quiz_id == page.quiz_id).count()
    if response_data.get("page_number") == total_pages:
        participant_token.is_used = True
        participant_token.used_at = datetime.now(timezone.utc)
    
    db.commit()
    return {"message": "Response submitted", "response_id": str(response.id)}


# ============================================================
# COMPLETE QUIZ
# ============================================================

@router.post("/{token}/complete")
async def complete_quiz(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Mark a quiz as completed by the participant.
    """
    # Find token
    participant_token = db.query(ParticipantToken).filter(
        ParticipantToken.token == token,
        ParticipantToken.is_used == False
    ).first()
    
    if not participant_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")
    
    # Mark as used
    participant_token.is_used = True
    participant_token.used_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Quiz completed successfully"}