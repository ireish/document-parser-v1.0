from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
from contextlib import asynccontextmanager
import os
from pathlib import Path
from dotenv import load_dotenv

from app.api.endpoints import documents
from app.db.database import engine
from app.db import models

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define paths
UPLOAD_DIR = Path("./uploads")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    # Create database tables
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")
    logger.info("Application startup complete.")
    # You can add other startup logic here, e.g., DB connection test
    yield
    # Shutdown logic
    logger.info("Application shutdown complete.")

app = FastAPI(
    title="Document Parser API",
    version="1.0.0",
    description="API for parsing and extracting data from documents.",
    lifespan=lifespan
)

# CORS Middleware
# Adjust origins as necessary for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Or ["*"] for all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include routers
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}

# To run this app (assuming uvicorn is installed):
# uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000 