from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pathlib import Path
import logging
import uuid

from app.models.document_schemas import UploadResponse
from app.utils.file_utils import save_upload_file, UPLOAD_DIR

router = APIRouter()

logger = logging.getLogger(__name__)

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    original_file_name: str = Form(...)
):
    """
    Receives an uploaded file and its original filename.
    Generates a UUID on the server side, and saves the file as <uuid>.<extension>.
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