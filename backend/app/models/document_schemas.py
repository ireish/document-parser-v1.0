from pydantic import BaseModel

class UploadResponse(BaseModel):
    message: str
    uuid: str
    filename: str
    original_filename: str 