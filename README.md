# Document Parser Web Application

## Overview

This project is a full-stack web application designed for uploading documents, extracting information using AI, and managing the extracted data. It features a FastAPI backend for handling document processing and API requests, and a React frontend (built with Vite and TypeScript) for user interaction.

## Features

*   **Document Upload:** Users can upload various document types (PDF, images).
*   **AI-Powered Extraction:** Utilizes an LLM to extract relevant fields from documents (simulated/actual processing handled by backend).
*   **Recent Extractions:** Displays a list of recently processed documents.
*   **Document Viewing:** Allows users to view the original uploaded document.
*   **Data Management:** Users can view and potentially edit extracted data (editing functionality might be part of future development).
*   **Persistent Storage:** Uses SQLite via SQLAlchemy to store document metadata and extraction results.

## Directory Structure

```
/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── db/
│   │   ├── models/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   ├── uploads/
│   ├── venv/
│   ├── requirements.txt
│   └── sqlite.db
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── styles/
│   │   └── App.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Prerequisites

*   **Python:** Version 3.8 or higher
*   **Node.js:** Version 16.x or higher (with npm or yarn)
*   **Git** (for cloning, if applicable)

## Setup and Running the Application

Follow these steps to set up and run the application on your local machine.

### 1. Backend Setup (FastAPI)

   a.  **Navigate to the backend directory:**
       ```
       cd backend
       ```

   b.  **Create and activate a Python virtual environment:**
       *   On macOS and Linux:
           ```
           python3 -m venv venv
           source venv/bin/activate
           ```
       *   On Windows:
           ```
           python -m venv venv
           .\venv\Scripts\activate
           ```

   c.  **Install dependencies:**
       ```
       pip install -r requirements.txt
       ```
       This will install FastAPI, Uvicorn, SQLAlchemy, and other necessary Python packages.

   d.  **Initialize the database (if not already done):**
       The application is configured to create database tables automatically on startup (as defined in `backend/app/main.py` within the `lifespan` context manager).

   e.  **Run the FastAPI development server:**
       ```
       uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
       ```
       The backend API should now be running at `http://localhost:8000`. You can check its health at `http://localhost:8000/health`.

### 2. Frontend Setup (React + Vite)

   a.  **Navigate to the frontend directory (from the project root):**
       ```
       cd frontend
       ```

   b.  **Install Node.js dependencies:**
       ```
       npm install
       ```
       (or `yarn install` if you prefer yarn)

   c.  **Run the React development server:**
       ```
       npm run dev
       ```
       (or `yarn dev`)

   d.  **Open the application in your browser:**
       The frontend should now be accessible at `http://localhost:5173` (or another port if 5173 is busy - check the terminal output from `npm run dev`).

## FAQ / Research / Thoughts

This section outlines some key questions and challenges related to document data extraction and processing.

*   **Data can be fuzzy. For example, some documents might put first_name and last_name together in a single field. How do you distinguish which one is first_name and which is last_name?**
    *   Coming Soon...

*   **Some countries use date format MM/DD/YYYY while others use DD/MM/YYYY. How do you design standardization?**
    *   Coming Soon...

*   **Also, how do you construct your dataset (or create test cases) to validate the performance of the pipeline?**
    *   Coming Soon...

*   **Which model works best for your task? How did you make the choice?**
    *   Coming Soon...

---
