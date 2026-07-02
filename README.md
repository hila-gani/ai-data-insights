# AI Data Insights CSV Analyzer

A full-stack, AI-powered interactive CSV exploration application. Users can upload CSV datasets, search and preview tabular rows, and ask natural-language analytical questions to receive direct answers synthesized by the Gemini LLM, using dataset metadata, sample context, and dynamic SQL query generation when needed.

---

## 1. Project Overview

The **AI Data Insights CSV Analyzer** is designed to bridge the gap between non-technical users and structured databases. By combining a modern, interactive React user interface with a robust FastAPI backend, the system allows users to upload CSV dataset, browse records with live pagination and search, and ask free-form analytical questions. The backend automatically determines the best answering pathway (direct pandas metadata inspection, summary synthesis, or dynamically generated SQLite query execution) to provide accurate answers.

---

## 2. Architecture Overview

The system uses a clean, decoupled architecture:

```
[ Frontend: React + Vite ] 
         │
         ▼ (HTTP POST / GET Requests)
[ Backend: FastAPI Web Server ]
         │
         ├─► [ LLM Services: Gemini API Client ]
         │     ├── Route Classification & SQL Generation
         │     └── Final Factual Response Synthesis
         │
         └─► [ Execution Services: Pandas + SQLite ]
               └── Dynamic SQL Query Run on a Temp Database
```

### Data Flow
1. **Upload & Preview**: The React frontend uploads a CSV file as `FormData` to the FastAPI backend. The backend reads the CSV into memory using `pandas` and computes structural summaries.
2. **Interactive Browsing**: The frontend requests paginated records from the `/rows` endpoint, supporting filter terms mapped via Pandas vector operations.
3. **Smart Question Routing**: When a question is submitted to `/ask`, the backend routes it using a dedicated classification layer into one of 5 precise strategies:
   - `summary_only`: For high-level dataset inspection questions. The backend builds a Pandas-based dataset summary, including dataset shape, column data types, descriptive statistics, and a small preview of the first rows, allowing the LLM to answer structural questions without unnecessary SQL execution.
   - `sample_rows_only`: For qualitative questions that can be answered by inspecting a small subset or head of the dataset without aggregation.
   - `sql_required`: For complex logical queries, filtering, calculations, and structured aggregations requiring full dynamic SQL execution.
   - `hybrid`: For multi-faceted questions needing both structural summaries and specific query execution data to synthesize an accurate answer.
   - `not_answerable`: For ambiguous queries, out-of-scope prompts, or questions completely unrelated to the uploaded dataset.
4. **SQL Generation & Read-Only Execution**: If SQL is required, Gemini generates a `SELECT` statement. Before execution, the backend validates the query as a single read-only SQL statement: comments and multiple statements are rejected, only `SELECT` queries are allowed, destructive SQL keywords are blocked, and a default `LIMIT 100` is applied when no limit is provided. The approved query then runs against a temporary SQLite database populated from the uploaded DataFrame, and the result is passed back to the LLM for answer synthesis.
5. **Answer Synthesis**: The LLM synthesizes a short, human-readable answer grounded in the SQL results, dataset metadata, and sample context provided by the backend.

---

## 3. Environment Variables

### Backend Configuration
Create a `.env` file inside the `/backend` directory:

```env
# Google Gemini API key for LLM services
GEMINI_API_KEY=your_gemini_api_key_here

# Comma-separated list of allowed frontend origins for CORS configuration
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend Configuration
Create a `.env` file inside the `/frontend` directory:

```env
# The HTTP base URL pointing to the FastAPI backend API
VITE_API_BASE_URL=http://localhost:8001
```

---

## 4. How to Run Locally

### Prerequisites
- Node.js 18+
- Python 3.12.x recommended (tested with Python 3.12.0)

### Setup & Run Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows (PowerShell):
   .venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```

### Setup & Run Frontend

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the URL provided in the console (typically `http://localhost:5173`).

---

## 5. How to Deploy

### Backend Deployment (Render)
1. Push your code repository to GitHub/GitLab.
2. Sign in to [Render](https://render.com/) and create a new **Web Service**.
3. Link your repository and set the following configuration parameters:
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set the Environment Variables (`GEMINI_API_KEY` and `FRONTEND_ORIGINS`) under the Render environment settings.

### Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com/) and import your project repository.
2. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set the Environment Variable `VITE_API_BASE_URL` to point to your live Render backend URL.

---

## 6. What I'd Do Next

Given more time, I would improve the application in the following ways:

* **Analytical Ambiguity Handling**: Improve the routing and prompts so the system explicitly states assumptions for ambiguous terms such as "most popular", "best", or "highest performing".
* **Tie-Aware SQL Generation**: Improve generated SQL so min/max and ranking questions can return all tied rows instead of relying on `LIMIT 1`.
* **Conversation History**: Add a session-based chat flow so users can ask follow-up questions about the same uploaded dataset.
* **Persistent Database Storage**: Replace temporary SQLite execution with PostgreSQL or MySQL storage to support larger datasets, indexing, and saved user datasets.
* **Security & Resiliency Layer**: The current implementation uses prompt-level instructions and read-only execution guardrails to reduce the risk of basic jailbreaks, prompt-injection attempts, and unsafe LLM-generated SQL. In a production release, I would add an isolated security layer (e.g., Llama Guard) for prompt-injection filtering, stricter input sanitization, backend API retries, and fallback LLM providers.
