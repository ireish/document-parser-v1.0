from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, BackgroundTasks
from fastapi.responses import FileResponse
from pathlib import Path
import logging
import uuid
import os
import json
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel

from app.models.document_schemas import UploadResponse
from app.utils.file_utils import save_upload_file, UPLOAD_DIR
from app.db.database import get_db
from app.db.models import ExtractionJobs
from app.services.document_processor import schedule_document_processing

router = APIRouter()

logger = logging.getLogger(__name__)

# Request model for updating extracted fields
class UpdateExtractedFieldsRequest(BaseModel):
    extracted_fields_json: dict

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    original_file_name: str = Form(...),
    document_id: str = Form(...),  # Accept UUID from frontend
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Receives an uploaded file, its original filename, and a UUID.
    Saves the file as <uuid>.<extension>.
    Also creates an entry in the ExtractionJobs table and schedules processing with LLM.
    """
    if not file.filename:
        logger.error("Upload attempt with no filename.")
        raise HTTPException(status_code=400, detail="No filename provided with the file.")

    try:
        # Use the UUID provided by the frontend
        generated_uuid = document_id
        
        # Validate UUID format
        try:
            uuid_obj = uuid.UUID(generated_uuid)
        except ValueError:
            logger.error(f"Invalid UUID format: {generated_uuid}")
            raise HTTPException(status_code=400, detail="Invalid UUID format")
        
        # Save file to `backend/uploads`
        saved_path = save_upload_file(upload_file=file, uuid=generated_uuid)
        logger.info(f"File saved: {saved_path} | Original name: {original_file_name} | UUID: {generated_uuid}")
        
        # Get file extension to determine file type
        _, extension = Path(file.filename).suffix.split('.', 1) if '.' in Path(file.filename).suffix else ('', Path(file.filename).suffix[1:])
        file_type = extension.lower()
        
        # Create a record in the database
        extraction_job = ExtractionJobs(
            id=generated_uuid,
            file_type=file_type,
            original_filename=original_file_name,
            stored_filename=saved_path.name,
            upload_path=str(saved_path),
            status="processing"
        )
        
        db.add(extraction_job)
        db.commit()
        
        # Schedule the document for processing with LLM in the background
        schedule_document_processing(generated_uuid, background_tasks, db)
        
        return {
            "message": "File uploaded successfully",
            "uuid": generated_uuid,
            "filename": saved_path.name,  # This is <uuid>.<extension>
            "original_filename": original_file_name
        }
    except IOError as e:
        logger.error(f"Could not save file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    except Exception as e:
        logger.error(f"An unexpected error occurred during file upload: {file.filename}, error: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.get("/{job_id}", response_model=dict)
async def get_document_status(
    job_id: str, 
    db: Session = Depends(get_db)
):
    """Get the status and results of a document processing job"""
    job = db.query(ExtractionJobs).filter(ExtractionJobs.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found")
    
    return {
        "id": job.id,
        "status": job.status,
        "document_type": job.document_type,
        "file_type": job.file_type,
        "original_filename": job.original_filename,
        "extracted_fields": job.extracted_fields_json
    }

@router.get("/{job_id}/content")
async def get_document_content(
    job_id: str,
    db: Session = Depends(get_db)
):
    """Get the actual document file content by job ID"""
    job = db.query(ExtractionJobs).filter(ExtractionJobs.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found")
    
    # Construct path to the file
    file_path = Path(job.upload_path)
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Document file not found on server")
    
    # Determine content type based on file extension
    filename = job.original_filename
    return FileResponse(
        path=file_path, 
        filename=filename,
        media_type=None  # Let FastAPI infer the media type
    )

@router.put("/{job_id}", response_model=dict)
async def update_extracted_fields(
    job_id: str,
    request: UpdateExtractedFieldsRequest,
    db: Session = Depends(get_db)
):
    """Update the extracted fields for a document after manual editing"""
    job = db.query(ExtractionJobs).filter(ExtractionJobs.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job with ID {job_id} not found")
    
    try:
        # Update the extracted fields JSON
        job.extracted_fields_json = json.dumps(request.extracted_fields_json)
        db.commit()
        
        return {
            "id": job.id,
            "status": job.status,
            "message": "Extracted fields updated successfully"
        }
    except Exception as e:
        logger.error(f"Error updating extracted fields: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update extracted fields: {str(e)}")

@router.get("/recent/list", response_model=List[dict])
async def get_recent_documents(
    db: Session = Depends(get_db)
):
    """Get a list of all document extraction jobs"""
    recent_jobs = db.query(ExtractionJobs)\
        .order_by(desc(ExtractionJobs.created_at))\
        .all()
    
    result = []
    for job in recent_jobs:
        # Parse the extracted_fields_json if it exists
        document_type = job.document_type or "Unknown"
        
        result.append({
            "id": job.id,
            "original_filename": job.original_filename,
            "document_type": document_type,
            "status": job.status,
            "created_at": job.created_at.isoformat() if job.created_at else None
        })
    
    return result

@router.delete("/clear_all", status_code=204)
async def clear_all_extraction_jobs(db: Session = Depends(get_db)):
    """Deletes all extraction jobs from the database."""
    try:
        num_deleted = db.query(ExtractionJobs).delete()
        db.commit()
        logger.info(f"Successfully deleted {num_deleted} extraction jobs.")
        return # Return 204 No Content on success
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting all extraction jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete all extraction jobs.") 