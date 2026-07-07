from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import ParticipantToken, Quiz, QuizPage, Image, Response

router = APIRouter()

@router.get("/validate/{token}")
async def validate_participant_token(
    token: str,
    db: Session = Depends(get_db)
):
    participant_token = db.query(ParticipantToken).filter(
        ParticipantToken.token == token,
        ParticipantToken.is_used == False,
        ParticipantToken.is_expired == False,
        ParticipantToken.expires_at > datetime.utcnow()
    ).first()
    
    if not participant_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired token")
    
    quiz = db.query(Quiz).filter(Quiz.id == participant_token.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    pages = db.query(QuizPage).filter(QuizPage.quiz_id == quiz.id).order_by(QuizPage.page_number).all()
    total_time = sum(page.time_limit_seconds for page in pages)
    
    return {
        "quiz_id": str(quiz.id),
        "title": quiz.title,
        "description": quiz.description,
        "pages": len(pages),
        "total_time": total_time,
        "is_published": quiz.is_published
    }

@router.get("/{token}/page/{page_number}")
async def get_quiz_page(
    token: str,
    page_number: int,
    db: Session = Depends(get_db)
):
    participant_token = db.query(ParticipantToken).filter(
        ParticipantToken.token == token,
        ParticipantToken.is_used == False,
        ParticipantToken.is_expired == False,
        ParticipantToken.expires_at > datetime.utcnow()
    ).first()
    
    if not participant_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired token")
    
    quiz = db.query(Quiz).filter(Quiz.id == participant_token.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    page = db.query(QuizPage).filter(
        QuizPage.quiz_id == quiz.id,
        QuizPage.page_number == page_number
    ).first()
    
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    
    page_images = page.page_images
    images = []
    for pi in page_images:
        image = pi.image
        images.append({
            "id": str(image.id),
            "url": f"/uploads/{image.filename}",
            "filename": image.filename,
            "position_index": pi.position_index
        })
    
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

@router.post("/{token}/response")
async def submit_response(
    token: str,
    response_data: dict,
    db: Session = Depends(get_db)
):
    participant_token = db.query(ParticipantToken).filter(
        ParticipantToken.token == token,
        ParticipantToken.is_used == False,
        ParticipantToken.is_expired == False,
        ParticipantToken.expires_at > datetime.utcnow()
    ).first()
    
    if not participant_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid or expired token")
    
    page = db.query(QuizPage).filter(QuizPage.id == response_data.get("page_id")).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    
    page_images = page.page_images
    images_displayed = [str(pi.image_id) for pi in sorted(page_images, key=lambda x: x.display_order)]
    randomized_order = images_displayed.copy()
    
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
    
    total_pages = db.query(QuizPage).filter(QuizPage.quiz_id == page.quiz_id).count()
    if response_data.get("page_number") == total_pages:
        participant_token.is_used = True
        participant_token.used_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Response submitted", "response_id": str(response.id)}

@router.post("/{token}/complete")
async def complete_quiz(
    token: str,
    db: Session = Depends(get_db)
):
    participant_token = db.query(ParticipantToken).filter(
        ParticipantToken.token == token,
        ParticipantToken.is_used == False
    ).first()
    
    if not participant_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token not found")
    
    participant_token.is_used = True
    participant_token.used_at = datetime.utcnow()
    db.commit()
    return {"message": "Quiz completed successfully"}