from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from typing import List, Dict, Any
from datetime import datetime, timezone
import os
import shutil

from database import get_db
from models import (
    AdminUser, 
    Quiz, 
    QuizPage,      # ✅ ADD THIS
    PageImage,     # ✅ ADD THIS
    Image, 
    Response, 
    ParticipantChatLog, 
    AIInsight, 
    ParticipantToken
)
from core.security import verify_password, get_password_hash
from config import settings
from services.auth_service import create_first_admin

router = APIRouter(prefix="/settings", tags=["Settings"])

# ============================================================
# GET STATS - Dashboard Cards
# ============================================================

@router.get("/stats")
async def get_stats(
    db: Session = Depends(get_db)
):
    """Get all statistics for settings dashboard"""
    
    # Count quizzes
    total_quizzes = db.query(Quiz).count()
    
    # Count images
    total_images = db.query(Image).count()
    
    # Count responses
    total_responses = db.query(Response).count()
    
    # Count chat logs
    total_chats = db.query(ParticipantChatLog).count()
    
    # Count participants (unique tokens)
    total_participants = db.query(ParticipantToken).filter(
        ParticipantToken.is_used == True
    ).count()
    
    # Count AI insights
    total_insights = db.query(AIInsight).count()
    
    return {
        "total_quizzes": total_quizzes,
        "total_images": total_images,
        "total_responses": total_responses,
        "total_chats": total_chats,
        "total_participants": total_participants,
        "total_insights": total_insights,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


# ============================================================
# DATA MANAGEMENT
# ============================================================

@router.delete("/delete-all-images")
async def delete_all_images(
    db: Session = Depends(get_db)
):
    """Delete all images and their files"""
    
    # Get all images
    images = db.query(Image).all()
    
    # Delete files from disk
    deleted_files = 0
    for img in images:
        if img.file_path and os.path.exists(img.file_path):
            try:
                os.remove(img.file_path)
                deleted_files += 1
            except Exception as e:
                print(f"⚠️ Could not delete file: {img.file_path} - {e}")
    
    # Delete from database
    deleted_count = db.query(Image).delete()
    db.commit()
    
    return {
        "message": f"Deleted {deleted_count} images and {deleted_files} files from disk",
        "images_deleted": deleted_count,
        "files_deleted": deleted_files
    }


@router.delete("/clear-all-chats")
async def clear_all_chats(
    db: Session = Depends(get_db)
):
    """Clear all chat logs"""
    
    deleted_count = db.query(ParticipantChatLog).delete()
    db.commit()
    
    return {
        "message": f"Cleared {deleted_count} chat messages",
        "chats_deleted": deleted_count
    }


@router.delete("/delete-all-responses")
async def delete_all_responses(
    db: Session = Depends(get_db)
):
    """Delete all responses"""
    
    deleted_count = db.query(Response).delete()
    db.commit()
    
    return {
        "message": f"Deleted {deleted_count} responses",
        "responses_deleted": deleted_count
    }


@router.delete("/delete-all-data")
async def delete_all_data(
    db: Session = Depends(get_db)
):
    """Delete ALL data (Danger Zone)"""
    
    # Delete in correct order to avoid FK violations
    data = {
        "chat_logs": db.query(ParticipantChatLog).delete(),
        "ai_insights": db.query(AIInsight).delete(),
        "responses": db.query(Response).delete(),
        "tokens": db.query(ParticipantToken).delete(),
        "page_images": db.query(PageImage).delete(),
        "images": db.query(Image).delete(),
        "quiz_pages": db.query(QuizPage).delete(),
        "quizzes": db.query(Quiz).delete(),
    }
    
    db.commit()
    
    return {
        "message": "All data deleted successfully",
        "deleted": data
    }


# ============================================================
# UPDATE PASSWORD
# ============================================================

@router.post("/update-password")
async def update_password(
    request: dict,
    db: Session = Depends(get_db)
):
    """Update admin password"""
    
    old_password = request.get("old_password")
    new_password = request.get("new_password")
    confirm_password = request.get("confirm_password")
    
    if not old_password or not new_password or not confirm_password:
        raise HTTPException(status_code=400, detail="All fields are required")
    
    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Get admin
    admin = db.query(AdminUser).filter(AdminUser.is_active == True).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Verify old password
    if not verify_password(old_password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Old password is incorrect")
    
    # Update password
    admin.password_hash = get_password_hash(new_password)
    admin.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Password updated successfully"}


# ============================================================
# SECURE RECOVERY ENDPOINT (Developer Only)
# ============================================================

@router.post("/recover-password")
async def recover_password(
    request: dict,
    db: Session = Depends(get_db)
):
    """
    SECURE RECOVERY: Reset admin password to 'admin123'
    Requires a secret key for security
    
    ONLY FOR EMERGENCY USE
    """
    
    secret_key = request.get("secret_key")
    
    # ✅ Secure: Verify secret key matches
    if secret_key != os.getenv("RECOVERY_SECRET_KEY", "sightspoke-recovery-key"):
        raise HTTPException(status_code=401, detail="Invalid recovery key")
    
    # Reset admin password to default
    admin = db.query(AdminUser).filter(AdminUser.is_active == True).first()
    if not admin:
        # Create admin if doesn't exist
        admin = create_first_admin(db, "admin", "admin123")
        return {"message": "Admin created with default password 'admin123'"}
    
    admin.password_hash = get_password_hash("admin123")
    admin.updated_at = datetime.now(timezone.utc)
    db.commit()
    
    return {
        "message": "Password reset to default: 'admin123'",
        "username": admin.username
    }