import os
import json
import base64
import time
import logging
from pathlib import Path
from typing import Dict, Any, Tuple
from PIL import Image
from pdf2image import convert_from_path
from groq import Groq
import mimetypes
from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.db.models import ExtractionJobs

# Setup logging
logger = logging.getLogger(__name__)

# Groq configuration
VISION_MODEL = os.environ.get("GROQ_VISION_MODEL_1", "meta-llama/llama-4-scout-17b-16e-instruct")

# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds


def encode_image(image_path: Path) -> str:
    """Encode image to base64 string"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def encode_pil_image(pil_image, format="JPEG") -> str:
    """Encode PIL image to base64 string"""
    import io
    buffer = io.BytesIO()
    pil_image.save(buffer, format=format)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def retry_api_call(func, *args, **kwargs):
    """Retry API calls with exponential backoff"""
    retries = 0
    while retries < MAX_RETRIES:
        try:
            return func(*args, **kwargs)
        except Exception as e:
            retries += 1
            if retries == MAX_RETRIES:
                raise
            
            # Check if it's a server error (5xx)
            is_server_error = False
            error_str = str(e)
            if "Error code: 5" in error_str or "Service Unavailable" in error_str:
                is_server_error = True
            
            if not is_server_error:
                # If not a server error, don't retry
                raise
            
            # Calculate delay with exponential backoff
            delay = RETRY_DELAY * (2 ** (retries - 1))
            logger.warning(f"Groq API temporarily unavailable. Retrying in {delay} seconds... (Attempt {retries}/{MAX_RETRIES})")
            time.sleep(delay)


def identify_document_type(client: Groq, image_data: str) -> Dict[str, str]:
    """Identify the type of document using Groq's vision model"""
    prompt = """
    Identify this document type from these 4 options: EAD Card, Passport, USA Drivers License, or Unknown Doc.
    
    If it's a Passport, also identify the country.
    If it's a Driver License, also identify the state.
    
    Respond with a valid JSON object in this exact format:
    {"doc_type": "...", "country": "...", "state": "..."}
    
    For EAD Card, leave country and state as empty strings.
    For Passport, leave state as an empty string.
    For Driver License, leave country as an empty string.
    """
    
    def make_api_call(image_data, prompt):
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}",
                            },
                        },
                    ],
                }
            ],
            model=VISION_MODEL,
        )
        return response
    
    response = retry_api_call(make_api_call, image_data, prompt)
    
    result = response.choices[0].message.content
    # Extract JSON from the response
    try:
        return json.loads(result)
    except json.JSONDecodeError:
        # Try to extract JSON if it's embedded in text
        import re
        json_match = re.search(r'({.*})', result.replace('\n', ' '))
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except:
                pass
        logger.warning(f"Could not parse JSON response: {result}")
        return {"doc_type": "unknown", "country": "", "state": ""}


def extract_document_info(client: Groq, image_data: str, doc_info: Dict[str, str]) -> Dict[str, Any]:
    """Extract information from the document based on its type"""
    doc_type = doc_info.get("doc_type", "").lower()
    country = doc_info.get("country", "")
    state = doc_info.get("state", "")
    
    # Create a prompt based on document type
    if "passport" in doc_type:
        prompt = f"""
        You are examining a passport from {country}.
        Note: Parse Date of Birth, Issue Date, and Expiry Date in the format as followed in {country}'s official documents and store them in the format MM/DD/YYYY.
        Extract the following attributes with high accuracy:
        - First Name
        - Middle Name (if any)
        - Last Name
        - Date of Birth (MM/DD/YYYY)
        - Passport Number
        - Issue Date (MM/DD/YYYY)
        - Expiry Date (MM/DD/YYYY)
        - Place of Birth
        - Gender
        - Nationality
        
        Respond with a valid JSON object containing all these fields. Leave empty string for fields not found.
        """
    elif "ead" in doc_type or "employment authorization" in doc_type:
        prompt = """
        You are examining an Employment Authorization Document (EAD Card).
        Extract the following attributes with high accuracy:
        - First Name
        - Middle Name (if any)
        - Last Name
        - Date of Birth (MM/DD/YYYY)  
        - Card Number
        - USCIS Number
        - Category
        - Issue Date (MM/DD/YYYY)
        - Expiry Date (MM/DD/YYYY)
        - Country of Birth
        - Gender
        
        Respond with a valid JSON object containing all these fields. Leave empty string for fields not found.
        """
    elif "license" in doc_type or "driver" in doc_type:
        location = f"{state}".strip(", ")
        prompt = f"""
        You are examining a Driver License from {location}, USA.
        Extract the following attributes with high accuracy:
        - First Name
        - Middle Name (if any)
        - Last Name
        - Date of Birth (MM/DD/YYYY)
        - License Number
        - Issue Date (MM/DD/YYYY)
        - Expiry Date (MM/DD/YYYY)
        - Address
        - Gender
        - Class/Type of License
        - Restrictions (if any)
        
        Respond with a valid JSON object containing all these fields. Leave empty string for fields not found.
        """
    else:
        prompt = """
        Extract all important information from this document including:
        - First Name
        - Middle Name (if any)
        - Last Name
        - Date of Birth (MM/DD/YYYY)
        - Document Number
        - Issue Date (MM/DD/YYYY)
        - Expiry Date (MM/DD/YYYY)
        - Country of Issue
        
        Respond with a valid JSON object containing all these fields.
        """
    
    def make_api_call(image_data, prompt):
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}",
                            },
                        },
                    ],
                }
            ],
            model=VISION_MODEL,
        )
        print(response)
        return response
    
    response = retry_api_call(make_api_call, image_data, prompt)
    
    raw_content = response.choices[0].message.content
    # print(result) # You can remove this debug print

    # New parsing logic:
    parsed_json = None
    try:
        # Attempt 1: Try to parse the raw_content directly
        parsed_json = json.loads(raw_content)
    except json.JSONDecodeError:
        import re
        # Attempt 2: Look for JSON within ```json ... ``` markdown blocks
        # re.DOTALL makes '.' match newlines as well
        json_blocks = re.findall(r"```json\s*(.*?)\s*```", raw_content, re.DOTALL)
        if json_blocks:
            # Try parsing the last found block first (often the most refined)
            try:
                parsed_json = json.loads(json_blocks[-1])
            except json.JSONDecodeError:
                # If last block fails and there are others, try the first one
                if len(json_blocks) > 1:
                    try:
                        parsed_json = json.loads(json_blocks[0])
                    except json.JSONDecodeError:
                        pass # Fall through to next attempt
        
        if parsed_json is None:
            # Attempt 3: Fallback to a non-greedy search for any JSON object
            # Using re.DOTALL for '.' to match newlines, and .*? for non-greedy
            json_match = re.search(r'({.*?})', raw_content, re.DOTALL)
            if json_match:
                try:
                    parsed_json = json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass # Fall through

    if parsed_json:
        return parsed_json
    else:
        logger.warning(f"Warning: Could not parse JSON response. Raw response: {raw_content}")
        return {"error": "Failed to parse response"}


def process_document(file_path: Path) -> Tuple[Dict[str, Any], bool]:
    """
    Process a document file (PDF or image) and extract information
    Returns tuple of (result, success)
    """
    try:
        # Check if Groq API key is set
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            logger.error("GROQ_API_KEY environment variable not set")
            return {"error": "GROQ_API_KEY not configured"}, False
        
        # Setup Groq client
        client = Groq(api_key=api_key)
        
        # Determine content type
        content_type, _ = mimetypes.guess_type(file_path)
        
        if content_type == 'application/pdf':
            logger.info(f"Converting PDF to image: {file_path}")
            images = convert_from_path(file_path, first_page=1, last_page=1)
            image = images[0]  # This is a PIL Image object
            # Convert PIL image to base64
            image_data = encode_pil_image(image)
        else:  # It's an image
            logger.info(f"Processing image: {file_path}")
            # Load image using PIL
            image = Image.open(file_path)
            image_data = encode_image(file_path)
        
        # Step 1: Identify document type
        logger.info("Identifying document type...")
        doc_info = identify_document_type(client, image_data)
        logger.info(f"Document identified as: {json.dumps(doc_info, indent=2)}")
        
        # Step 2: Extract information based on document type
        logger.info("Extracting document information...")
        doc_attributes = extract_document_info(client, image_data, doc_info)
        
        # Combine results
        result = {
            "document_type": doc_info,
            "attributes": doc_attributes
        }
        
        # Check if there's an error
        if "error" in doc_attributes:
            return result, False
            
        return result, True
        
    except Exception as e:
        logger.error(f"Error processing document: {e}")
        return {"error": str(e)}, False


async def process_document_async(job_id: str, db: Session):
    """
    Asynchronously process a document and update the database
    This function is meant to be run in a background task
    """
    # Get the job from the database
    job = db.query(ExtractionJobs).filter(ExtractionJobs.id == job_id).first()
    if not job:
        logger.error(f"Job with ID {job_id} not found")
        return
    
    try:
        # Process the document
        logger.info(f"Processing document with job ID: {job_id}")
        file_path = Path(job.upload_path)
        result, success = process_document(file_path)
        
        # Update the job in the database
        if success:
            # Extract document type from result
            doc_type = result.get("document_type", {}).get("doc_type", "unknown")
            
            # Update job with results
            job.document_type = doc_type
            job.extracted_fields_json = json.dumps(result)
            job.status = "completed"
            logger.info(f"Document processing completed for job ID: {job_id}")
        else:
            # Update job with error status
            job.status = "error"
            job.extracted_fields_json = json.dumps(result)  # Store error information
            logger.error(f"Document processing failed for job ID: {job_id}")
        
        # Commit changes to database
        db.commit()
        
    except Exception as e:
        # Update job with error status
        logger.error(f"Exception during document processing for job ID {job_id}: {e}")
        job.status = "error"
        job.extracted_fields_json = json.dumps({"error": str(e)})
        db.commit()


def schedule_document_processing(job_id: str, background_tasks: BackgroundTasks, db: Session):
    """
    Schedule a document for processing in the background
    """
    background_tasks.add_task(process_document_async, job_id, db)
    logger.info(f"Document processing scheduled for job ID: {job_id}") 