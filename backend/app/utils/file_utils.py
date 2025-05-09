import shutil
import os
from pathlib import Path
from fastapi import UploadFile

UPLOAD_DIR = Path("./uploads")

def save_upload_file(upload_file: UploadFile, uuid: str) -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    # Get the file extension from the original filename
    _, extension = os.path.splitext(upload_file.filename)
    
    # Create a new filename using the UUID and original extension
    new_filename = f"{uuid}{extension}"
    
    # Save the file with the new UUID-based filename
    file_path = UPLOAD_DIR / new_filename
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return file_path 