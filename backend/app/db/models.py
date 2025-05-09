from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
import uuid
from sqlalchemy.dialects.sqlite import JSON
from sqlalchemy.ext.declarative import declarative_base

from .database import Base

class ExtractionJobs(Base):
    __tablename__ = "extraction_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    file_type = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False, unique=True)
    upload_path = Column(String, nullable=False)
    status = Column(String, nullable=False, default="processing")
    document_type = Column(String, nullable=True)
    extracted_fields_json = Column(Text, nullable=True)  # Using Text as SQLite has limited JSON support
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ExtractionJob(id={self.id}, status={self.status})>" 