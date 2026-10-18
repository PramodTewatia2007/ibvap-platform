import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "IBVAP — Intelligent Border Video Analytics Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "ibvap-secure-border-analytics-secret-key-32bytes-min")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./ibvap.db")
    
    # Storage
    EVIDENCE_DIR: str = os.getenv("EVIDENCE_DIR", "./evidence")
    SNAPSHOT_DIR: str = os.path.join(EVIDENCE_DIR, "snapshots")
    RECORDINGS_DIR: str = os.path.join(EVIDENCE_DIR, "recordings")
    
    # Frontend build path for unified container serving
    FRONTEND_DIST: str = os.getenv(
        "FRONTEND_DIST", 
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "dist"))
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # AI Engine settings
    ENABLE_REALTIME_INFERENCE: bool = True
    DETECTION_CONFIDENCE_THRESHOLD: float = 0.50
    ANPR_CONFIDENCE_THRESHOLD: float = 0.60
    FACE_CONFIDENCE_THRESHOLD: float = 0.65
    
    # Optional Facial Recognition (Disabled by default per strict safeguards)
    ENABLE_FACIAL_RECOGNITION: bool = False
    
    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()

