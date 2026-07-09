from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from api.routes import admin, participant
from ai.router import router as ai_router
from config import settings
from database import test_connection

app = FastAPI(
    title="SightSpoke API",
    description="Visual Preference Testing Platform",
    version="1.0.0"
)

# ============================================================
# ✅ CORS - MUST BE FIRST!
# ============================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for images
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "SightSpoke API is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Include routers
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(participant.router, prefix="/api/participant", tags=["Participant"])
app.include_router(ai_router, prefix="/api/admin/ai", tags=["AI"])

# On startup
@app.on_event("startup")
async def startup_event():
    print("🚀 Starting SightSpoke API...")
    test_connection()