# 📄 Document Parser Web Application

## 🔍 Overview

This intuitive web application lets you upload documents and automatically extract important information using AI. Built with FastAPI backend and React frontend, it offers a seamless experience for document processing and data management.

## ✨ Key Features

- **Easy Document Upload:** Supports PDF files and images
- **AI-Powered Extraction:** Intelligently extracts data fields using LLM technology
- **Document History:** View all your previously processed documents
- **Document Preview:** See the original uploaded document
- **Data Management:** Review and manage extracted information
- **Secure Storage:** All document data safely stored in a database

## 🛠️ Getting Started

### Prerequisites

- **Python:** 3.8 or higher
- **Node.js:** 16.x or higher
- **Git:** For cloning the repository

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   - **macOS/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows:**
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```

3. **Install required packages:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```

5. **Get your Groq LLM API key:**
   - Go to [Groq Console](https://console.groq.com/)
   - Sign up or log in to your account
   - Navigate to API keys section
   - Generate a new API key
   - Copy the key to your `.env` file

6. **Start the backend server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Your API will be running at http://localhost:8000

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Go to http://localhost:5173

## 📁 Project Structure

```
/
├── backend/               # FastAPI server
│   ├── app/               # Application code
│   ├── uploads/           # Uploaded documents
│   ├── .env.example       # Example environment variables
│   └── requirements.txt   # Python dependencies
├── frontend/              # React application
│   ├── src/               # Source code
│   ├── index.html         # Entry HTML file
│   └── package.json       # Node dependencies
└── README.md              # This file
```

## 🤔 Common Questions

### How does the application handle ambiguous data formats?

The AI extraction engine uses contextual clues to properly identify and separate fields like first and last names, even when they appear together.

### How are different date formats standardized?

The system detects and normalizes various date formats (MM/DD/YYYY, DD/MM/YYYY) into a consistent ISO format for storage and display.

### What LLM model is used for extraction?

We use Groq's LLM service which provides fast inference and high accuracy for document parsing tasks.

## 🌟 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📞 Need Help?

If you encounter any issues or have questions, please file an issue in the repository.

---

✨ Happy Document Parsing! ✨