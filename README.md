# 📄 Document Parser Web Application

## 🔍 Overview

Simply upload an image or PDF of an EAD Card, Passport, or US Driver's License, and let my AI-powered backend, utilizing Groq's Llama 4 Scout vision model, accurately identify the document type and extract relevant details with high accuracy.


## ⚙️ How It Works: The Extraction Pipeline

Extracting structured data accurately from diverse documents presents unique challenges, especially with name ordering and date formats varying across regions. I employed a two-step AI-driven approach:

1.  **Identification & Contextualization:**
    *   The uploaded document/image is first analyzed by the Llama 4 Scout model with a specific prompt to identify its type (Passport, EAD, Driver's License) and relevant region (Country for Passports, State for DLs).
    *   This identification step is crucial for setting the context for the next stage.

2.  **Targeted Extraction:**
    *   A second prompt is dynamically generated based on the identified document type and region. For example: *"You are examining a passport from [Country]. Extract the following attributes..."*
    *   This targeted prompt guides the LLM to look for specific fields relevant to that document type and helps it understand regional conventions (like date formats or name order implicitly).

Initially, a parsing challenge was encountered with one document, which was successfully resolved by implementing a more flexible JSON parsing technique.

My Thougts:
While I initially considered creating a HashMap mapping each country to its official document date format (e.g., {"Country": "<date_format>"}), allowing us to specify the expected format after country identification, I found the current prompt handled all test documents effectively without this additional complexity.

---

## 🤖 Model Selection: Why Llama 4 Scout?

Choosing the right Vision Language Model (VLLM) is critical for accuracy. I evaluated three freely available Vision LLMs:

1.  **Google Gemini 2.0 Flash**
2.  **Groq Llama 4 Maverick**
3.  **Groq Llama 4 Scout**

**Evaluation:** While all models performed well on clear, high-quality images and PDFs, the true test came when I processed an unclear image of my real EAD card.

**Results:**
*   Gemini 2.0 Flash and Llama 4 Maverick struggled to accurately extract the Date of Birth and Document Number from the unclear EAD image.
*   **Llama 4 Scout demonstrated superior performance**, successfully extracting all required fields with high precision even from the challenging image.

Based on this evaluation, I selected **Llama 4 Scout** as the primary model due to its accuracy, particularly on real-world imperfect document images.

---

## ✅ Testing & Validation

The application and the underlying extraction model were tested using a diverse set of sample documents obtained online, covering examples of Passports, EAD cards, and US Driver's Licenses.

*   **Scope:** 15 distinct document images/PDFs were processed.
*   **Results:** The application successfully identified and parsed all 15 documents, correctly extracting the requested fields.
*   **Note:** While initial results are promising, further testing with a broader range of document qualities, layouts, and edge cases is recommended to fully understand the model's limitations and identify potential breakpoints.

---

## 🚀 Getting Started

### Prerequisites

*   **Python:** 3.8 or higher
*   **Node.js:** 16.x or higher
*   **Git:** For cloning the repository
*   **Poppler:** Required by `pdf2image` for PDF processing (Installation varies by OS - see [pdf2image documentation](https://github.com/Belval/pdf2image#how-to-install))

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    *   *macOS/Linux:*
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```
    *   *Windows:*
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```

3.  **Install required packages:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   **Get your Groq API key:**
        *   Go to [Groq Console](https://console.groq.com/keys)
        *   Sign up or log in.
        *   Generate a new API key.
    *   **Edit your `.env` file:** Paste your Groq API key and optionally set the vision model (defaults to Llama 4 Scout):
        ```dotenv
        GROQ_API_KEY=your_actual_api_key_here
        GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
        ```

5.  **Start the backend server:**
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    Your API will be running at `http://localhost:8000`. You can access the health check at `http://localhost:8000/health` and API docs at `http://localhost:8000/docs`.

### Frontend Setup

1.  **Navigate to the frontend directory (from the project root):**
    ```bash
    cd ../frontend
    # Or from the backend directory: cd ../frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  **Open your browser:**
    Navigate to `http://localhost:5173` (or the port specified by Vite).

---


## 🗺️ Roadmap & Future Enhancements

### Next Steps (To-Do)

*   [ ] Replace `RecentDocumentList` polling with Server-Sent Events (SSE) for real-time updates and efficiency.
*   [ ] Implement batch upload functionality for processing multiple documents simultaneously.
*   [ ] Integrate a Date Picker component in the frontend for easier editing of extracted date fields.

### Research & Exploration

#### 1. Leveraging LlamaIndex & LlamaParse

*   **Enhanced Parsing:** Evaluate if LlamaParse's structured Markdown output can improve prompting for specific document structures compared to raw text.
*   **RAG for Validation:** Use LlamaIndex for Retrieval-Augmented Generation. Create knowledge bases (indexed by LlamaIndex) containing document template metadata (field locations, date formats per region, validation rules like MRZ checksums). Query this knowledge-base during extraction to guide the LLM or validate its output (e.g., "Is this DOB format typical for a California DL?").
*   **Few-Shot In-Context Learning:** Build a vector index of correctly parsed examples. Retrieve similar examples during processing and include them in the prompt to improve accuracy for specific document types/layouts.
*   **Structured Output Enforcement:** Utilize LlamaIndex's output parsing modules (e.g., PydanticProgram) to force LLM output into a predefined schema and perform initial validation.

#### 2. Custom Model Fine-Tuning

*   **Domain-Specific Fine-Tuning:** Collect and label a diverse dataset of target documents (Passports, EADs, DLs) covering various layouts, regions, and quality levels. Fine-tune a base vision model on this dataset for potentially higher accuracy and robustness.
*   **Region/Type Specific Models:** Explore training separate fine-tuned models for distinct, high-variance categories (e.g., US Driver Licenses, EU Passports) if sufficient data is available.

---


## 🌟 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📞 Need Help?

If you encounter any issues or have questions, please file an issue in the repository.

---

✨ Happy Document Parsing! ✨