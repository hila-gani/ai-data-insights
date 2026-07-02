# AI Data Insights CSV Analyzer

A full-stack, AI-powered interactive CSV exploration application. Users can upload arbitrary CSV files, search and preview tabular rows, and ask complex natural-language questions to receive direct answers synthesized by Gemini LLM (using dynamic SQL query generation and execution).

---

## 1. Project Overview

The **AI Data Insights CSV Analyzer** is designed to bridge the gap between non-technical users and structured databases. By combining a modern, interactive React user interface with a robust FastAPI backend, the system allows users to upload any CSV dataset, browse records with live pagination and search, and ask free-form analytical questions. The backend automatically determines the best answering pathway (direct pandas metadata inspection, summary synthesis, or dynamically generated SQLite query execution) to provide accurate answers.

---

## 2. Architecture Overview

The system utilizes a clean, decoupled architecture:

```
[ Frontend: React + Vite ] 
         │
         ▼ (HTTP POST / GET Requests)
[ Backend: FastAPI Web Server ]
         │
         ├─► [ LLM Services: Gemini Client (gemini-3.5-flash) ]
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
   - `summary_only`: For high-level dataset inspection. Instead of just returning column names, this triggers a comprehensive metadata extraction service using Pandas. It synthesizes structural dimension statistics (`df.shape`), column data type mappings (`df.dtypes`), full descriptive statistical distributions (`df.describe(include='all')`), and a safe data preview layout (`df.head(3)`), allowing the LLM to answer holistic data profile questions efficiently without needing SQL overhead.
   - `sample_rows_only`: For qualitative questions that can be answered by inspecting a small subset or head of the dataset without aggregation.
   - `sql_required`: For complex logical queries, filtering, calculations, and structured aggregations requiring full dynamic SQL execution.
   - `hybrid`: For multi-faceted questions needing both structural summaries and specific query execution data to synthesize an accurate answer.
   - `not_answerable`: For ambiguous queries, out-of-scope prompts, or questions completely unrelated to the uploaded dataset.
4. **SQL Gen & Safe Execution**: If SQL is required, Gemini generates a `SELECT` statement. The query undergoes strict keyword matching to prevent dangerous SQL injection or mutations, executes against an in-memory/temporary SQLite file populated from the DataFrame, and returns the result to the LLM.
5. **Answer Synthesis**: The LLM synthesizes a short, human-readable answer strictly backed by the SQL results and sample context, preventing hallucinations.

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
- Python 3.10+

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

## 6. What I'd Do Next (Production Readiness Roadmap)

Based on manual quality assurance and architectural review, the following enhancements are planned for future releases:

*   **Analytical Ambiguity Calibration**: Improve the router and system prompts so the LLM explicitly states its assumptions when metrics like "most popular" or "best" are ambiguous (e.g. asking whether popularity is measured by transaction count, review score, or sales volume). This will reduce defensive over-refusal and increase query accuracy.
*   **Tie-Breaking SQL Logic**: Upgrade the SQL code generation framework to detect ties (multiple rows sharing identical min/max values) instead of blindly relying on `LIMIT 1`. The LLM should automatically structure queries to handle ranks or return all matching records in a tied state.
* **Enterprise-Grade Security Guardrails**: While the current implementation successfully mitigates prompt injections and jailbreak attempts through strict **Context Anchoring** and robust system instructions (forcing the LLM to strictly bound its answers to the provided metadata context), a production release would benefit from an isolated, dedicated security layer (such as Llama Guard or NeMo Guardrails). This would provide pre-execution string sanitation and post-generation compliance checking to implement a true "Defense in Depth" security model.
*   **Conversation History & Stateful Chat UI**: Transition the frontend to a multi-turn conversational chat layout, maintaining session-based context in the backend (using redis or state caches) so users can ask follow-up questions within the scope of their previous queries.
*   **Persistent Database Storage (PostgreSQL/MySQL)**: Move away from temporary SQLite files and in-memory execution to a persistent database. This will support larger datasets (increasing scalability), allow index optimization for sub-second performance, and enable user accounts to securely save and load previously uploaded datasets.
*   **API Resiliency & Fallbacks**: Enhance the frontend error-handling state (`aiError`) by introducing backend-side retry mechanisms with jitter, and implementing alternative LLM fallbacks (e.g. Claude or GPT) in case the primary Gemini API experiences rate limits or quota exhaustion.
