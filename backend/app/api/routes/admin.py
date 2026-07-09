from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional
import os
import shutil

from database import get_db
from models import AdminUser, Quiz, QuizPage, Image, ParticipantToken, Response, PageImage
from schemas import (
    QuizCreate, QuizResponse, QuizUpdate,
    QuizPageCreate, QuizPageResponse,
    ImageResponse,
    AdminLogin, AdminResponse, TokenResponse
)
from services.auth_service import authenticate_admin, create_admin_token
from core.security import generate_participant_token, get_token_expiry, verify_password
from config import settings

router = APIRouter()

# ============================================================
# AUTHENTICATION
# ============================================================

@router.post("/login", response_model=TokenResponse)
async def admin_login(
    login_data: AdminLogin,
    db: Session = Depends(get_db)
):
    print("\n" + "=" * 50)
    print("🔍 LOGIN ATTEMPT")
    print(f"Password received: '{login_data.password}'")
    
    admin = db.query(AdminUser).filter(
        AdminUser.username == "admin",
        AdminUser.is_active == True
    ).first()
    
    if not admin:
        print("❌ Admin not found in database!")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    print(f"✅ Admin found: {admin.username}")
    print(f"Stored hash from DB: '{admin.password_hash}'")
    print(f"Stored hash length: {len(admin.password_hash)}")
    
    is_valid = verify_password(login_data.password, admin.password_hash)
    print(f"verify_password result: {is_valid}")
    
    if not is_valid:
        print("❌ Password verification FAILED!")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    print("✅ Password verification SUCCESS!")
    
    admin.last_login = datetime.now(timezone.utc)
    db.commit()
    
    token_response = create_admin_token(admin)
    print("✅ Token created successfully!")
    print("=" * 50 + "\n")
    
    return token_response

# ============================================================
# QUIZ MANAGEMENT
# ============================================================

@router.post("/quizzes", response_model=QuizResponse)
async def create_quiz(
    quiz_data: QuizCreate,
    db: Session = Depends(get_db)
):
    admin = db.query(AdminUser).filter(AdminUser.is_active == True).first()
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    
    quiz = Quiz(
        admin_id=admin.id,
        title=quiz_data.title,
        description=quiz_data.description,
        is_published=quiz_data.is_published,
        ai_overview=quiz_data.ai_overview
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz

@router.get("/quizzes", response_model=List[QuizResponse])
async def get_all_quizzes(
    db: Session = Depends(get_db)
):
    return db.query(Quiz).all()

@router.get("/quizzes/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: UUID,
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz

@router.put("/quizzes/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: UUID,
    quiz_data: QuizUpdate,
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    for key, value in quiz_data.dict(exclude_unset=True).items():
        setattr(quiz, key, value)
    
    db.commit()
    db.refresh(quiz)
    return quiz

@router.delete("/quizzes/{quiz_id}")
async def delete_quiz(
    quiz_id: UUID,
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted successfully"}

# ============================================================
# QUIZ PAGES
# ============================================================

@router.post("/quizzes/{quiz_id}/pages", response_model=QuizPageResponse)
async def add_page_to_quiz(
    quiz_id: UUID,
    page_data: QuizPageCreate,
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    page = QuizPage(
        quiz_id=quiz_id,
        page_number=page_data.page_number,
        time_limit_seconds=page_data.time_limit_seconds,
        layout_template_id=page_data.layout_template_id
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page

@router.get("/quizzes/{quiz_id}/pages", response_model=List[QuizPageResponse])
async def get_quiz_pages(
    quiz_id: UUID,
    db: Session = Depends(get_db)
):
    return db.query(QuizPage).filter(QuizPage.quiz_id == quiz_id).order_by(QuizPage.page_number).all()

@router.put("/quizzes/{quiz_id}/pages/{page_id}")
async def update_quiz_page(
    quiz_id: UUID,
    page_id: UUID,
    page_data: QuizPageCreate,
    db: Session = Depends(get_db)
):
    page = db.query(QuizPage).filter(
        QuizPage.id == page_id,
        QuizPage.quiz_id == quiz_id
    ).first()
    
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    
    page.page_number = page_data.page_number
    page.time_limit_seconds = page_data.time_limit_seconds
    page.layout_template_id = page_data.layout_template_id
    
    db.commit()
    db.refresh(page)
    return page

@router.delete("/quizzes/{quiz_id}/pages/{page_id}")
async def delete_quiz_page(
    quiz_id: UUID,
    page_id: UUID,
    db: Session = Depends(get_db)
):
    page = db.query(QuizPage).filter(
        QuizPage.id == page_id,
        QuizPage.quiz_id == quiz_id
    ).first()
    
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    
    db.delete(page)
    db.commit()
    return {"message": "Page deleted successfully"}

# ============================================================
# TOKENS
# ============================================================

@router.post("/quizzes/{quiz_id}/tokens")
async def generate_tokens(
    quiz_id: UUID,
    count: int = 1,
    expiry_days: int = 7,
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    tokens = []
    for i in range(count):
        token_value = generate_participant_token()
        token = ParticipantToken(
            quiz_id=quiz_id,
            token=token_value,
            admin_label=f"Participant {i+1}",
            expires_at=get_token_expiry(expiry_days)
        )
        db.add(token)
        tokens.append(token)
    
    db.commit()
    
    base_url = "http://localhost:3000"
    links = []
    for token in tokens:
        links.append({
            "token": token.token,
            "url": f"{base_url}/quiz/{token.token}",
            "admin_label": token.admin_label,
            "expires_at": token.expires_at.isoformat()
        })
    
    return {"message": f"{count} tokens generated", "links": links}

@router.get("/tokens/{quiz_id}")
async def get_all_tokens(
    quiz_id: UUID,
    db: Session = Depends(get_db)
):
    tokens = db.query(ParticipantToken).filter(ParticipantToken.quiz_id == quiz_id).all()
    return [
        {
            "token": t.token,
            "admin_label": t.admin_label,
            "is_used": t.is_used,
            "is_expired": t.is_expired,
            "expires_at": t.expires_at.isoformat() if t.expires_at else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "used_at": t.used_at.isoformat() if t.used_at else None
        }
        for t in tokens
    ]

# ============================================================
# IMAGE MANAGEMENT
# ============================================================

@router.post("/images/upload", response_model=ImageResponse)
async def upload_image(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {settings.ALLOWED_IMAGE_TYPES}"
        )
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_size = os.path.getsize(file_path)
    
    image = Image(
        filename=unique_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        title=title or "",
        description=description or "",
        img_metadata={}
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    
    return image

@router.get("/images", response_model=List[ImageResponse])
async def get_all_images(
    db: Session = Depends(get_db)
):
    return db.query(Image).all()

@router.get("/images/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: UUID,
    db: Session = Depends(get_db)
):
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return image

@router.delete("/images/{image_id}")
async def delete_image(
    image_id: UUID,
    db: Session = Depends(get_db)
):
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    
    if os.path.exists(image.file_path):
        os.remove(image.file_path)
    
    db.delete(image)
    db.commit()
    return {"message": "Image deleted successfully"}

# ============================================================
# QUIZ INSIGHTS (Image Selection Statistics)
# ============================================================

@router.get("/quizzes/{quiz_id}/insights")
async def get_quiz_insights(
    quiz_id: UUID,
    db: Session = Depends(get_db)
):
    """Get insights about image selections"""
    responses = db.query(Response).filter(Response.quiz_id == quiz_id).all()
    
    pages = db.query(QuizPage).filter(QuizPage.quiz_id == quiz_id).all()
    page_ids = [p.id for p in pages]
    
    page_images = db.query(PageImage).filter(PageImage.page_id.in_(page_ids)).all()
    image_ids = [pi.image_id for pi in page_images]
    images = db.query(Image).filter(Image.id.in_(image_ids)).all()
    
    # ✅ Create image mapping with titles and descriptions
    image_map = {}
    for img in images:
        image_map[str(img.id)] = {
            "filename": img.filename,
            "url": f"/uploads/{img.filename}",
            "title": img.title or img.filename,
            "description": img.description or "",
            "mime_type": img.mime_type
        }
    
    # ✅ Count selections with image titles and descriptions
    image_stats = {}
    for img in images:
        count = db.query(Response).filter(
            Response.quiz_id == quiz_id,
            Response.selected_image_id == img.id
        ).count()
        
        img_id = str(img.id)
        image_stats[img_id] = {
            "id": img_id,
            "title": img.title or img.filename,
            "description": img.description or "",
            "url": f"/uploads/{img.filename}",
            "filename": img.filename,
            "selection_count": count,
            "total_responses": len(responses),
            "percentage": round((count / len(responses) * 100) if responses else 0, 1)
        }
    
    return {
        "quiz_id": str(quiz_id),
        "total_responses": len(responses),
        "image_stats": image_stats,
        "image_map": image_map
    }

# ============================================================
# PAGE IMAGES (Link images to pages)
# ============================================================

@router.post("/pages/{page_id}/images/{image_id}")
async def add_image_to_page(
    page_id: UUID,
    image_id: UUID,
    display_order: int = 0,
    position_index: int = 0,
    db: Session = Depends(get_db)
):
    page = db.query(QuizPage).filter(QuizPage.id == page_id).first()
    if not page:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")
    
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    
    existing = db.query(PageImage).filter(
        PageImage.page_id == page_id,
        PageImage.image_id == image_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image already linked to this page")
    
    page_image = PageImage(
        page_id=page_id,
        image_id=image_id,
        display_order=display_order,
        position_index=position_index
    )
    db.add(page_image)
    db.commit()
    db.refresh(page_image)
    return {"message": "Image added to page successfully"}

@router.delete("/pages/{page_id}/images/{image_id}")
async def remove_image_from_page(
    page_id: UUID,
    image_id: UUID,
    db: Session = Depends(get_db)
):
    page_image = db.query(PageImage).filter(
        PageImage.page_id == page_id,
        PageImage.image_id == image_id
    ).first()
    
    if not page_image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found on this page")
    
    db.delete(page_image)
    db.commit()
    return {"message": "Image removed from page successfully"}

# ============================================================
# RESPONSES
# ============================================================

@router.get("/quizzes/{quiz_id}/responses")
async def get_quiz_responses(
    quiz_id: UUID,
    db: Session = Depends(get_db)
):
    responses = db.query(Response).filter(Response.quiz_id == quiz_id).all()
    export_data = []
    for response in responses:
        export_data.append({
            "quiz_id": str(response.quiz_id),
            "participant_token": response.participant_token.token if response.participant_token else None,
            "page_number": response.page.page_number if response.page else None,
            "selected_image_id": str(response.selected_image_id) if response.selected_image_id else None,
            "selected_position_index": response.selected_position_index,
            "latency_ms": response.latency_ms,
            "timeout_flag": response.timeout_flag,
            "time_limit_seconds": response.time_limit_seconds,
            "images_displayed": response.images_displayed,
            "randomized_order": response.randomized_order,
            "submitted_at": response.submitted_at.isoformat() if response.submitted_at else None
        })
    return export_data

@router.get("/responses/export/{quiz_id}")
async def export_responses_json(
    quiz_id: UUID,
    db: Session = Depends(get_db)
):
    """Export responses as JSON for AI analysis"""
    responses = db.query(Response).filter(Response.quiz_id == quiz_id).all()
    
    export_data = []
    for response in responses:
        export_data.append({
            "quiz_id": str(response.quiz_id),
            "participant_token": response.participant_token.token if response.participant_token else None,
            "page_number": response.page.page_number if response.page else None,
            "selected_image_id": str(response.selected_image_id) if response.selected_image_id else None,
            "selected_position_index": response.selected_position_index,
            "latency_ms": response.latency_ms,
            "timeout_flag": response.timeout_flag,
            "time_limit_seconds": response.time_limit_seconds,
            "layout_template": response.layout.name if response.layout else None,
            "images_displayed": response.images_displayed,
            "randomized_order": response.randomized_order,
            "submitted_at": response.submitted_at.isoformat() if response.submitted_at else None
        })
    
    return {
        "quiz_id": str(quiz_id),
        "total_responses": len(export_data),
        "data": export_data
    }