import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# ✅ Load .env file
load_dotenv()

from api.routes import admin, participant
from api.routes.st_routes import router as settings_router
from ai.router import router as ai_router
from config import settings
from database import test_connection

# ✅ Get environment from .env (default to development)
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT.lower() == "production"

# ✅ Conditional docs - completely hide in production
app = FastAPI(
    title="SightSpoke API",
    description="Visual Preference Testing Platform",
    version="1.0.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
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
app.include_router(settings_router, prefix="/api/admin", tags=["Settings"])

# On startup
@app.on_event("startup")
async def startup_event():
    print(f"🚀 Starting SightSpoke API...")
    print(f"📁 Environment: {ENVIRONMENT}")
    print(f"📁 Docs enabled: {not IS_PRODUCTION}")
    test_connection()