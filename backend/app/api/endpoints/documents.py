from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, BackgroundTasks
from pathlib import Path
import logging
import uuid
from sqlalchemy.orm import Session

from app.models.document_schemas import UploadResponse
from app.utils.file_utils import save_upload_file, UPLOAD_DIR
from app.db.database import get_db
from app.db.models import ExtractionJobs
from app.services.document_processor import schedule_document_processing

router = APIRouter()

logger = logging.getLogger(__name__)

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    original_file_name: str = Form(...),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Receives an uploaded file and its original filename.
    Generates a UUID on the server side, and saves the file as <uuid>.<extension>.
    Also creates an entry in the ExtractionJobs table and schedules processing with LLM.
    """
    if not file.filename:
        logger.error("Upload attempt with no filename.")
        raise HTTPException(status_code=400, detail="No filename provided with the file.")

    try:
        # Generate UUID on the server side
        generated_uuid = str(uuid.uuid4())
        
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