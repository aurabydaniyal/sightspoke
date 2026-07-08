from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection() -> bool:
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        print("Ã¢Å“â€¦ Database connected successfully!")
        return True
    except Exception as e:
        print(f"Ã¢ÂÅ’ Database connection failed: {e}")
        return False