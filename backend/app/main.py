from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import csv
import io
from app.schemas import AskRequest
from app.llm.gemini_client import ask_gemini

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

dataset = None

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Uploads a CSV file, parses it into memory, and stores it as a list of dictionaries.

    Args:
        file (UploadFile): The uploaded CSV file.

    Returns:
        filename: The uploaded file name.
        rows_count: Number of rows parsed.
        columns: List of column names.
        message: Status message.
    """
    if not file.filename.lower().endswith(".csv"):
        return {"error": "only CSV files are supported"}
    
    content = await file.read()

    decoded = content.decode("utf-8")
    stream = io.StringIO(decoded)

    reader = csv.DictReader(stream)
    rows = list(reader)

    global dataset
    dataset = rows

    return {
        "filename": file.filename,
        "rows_count": len(rows),
        "columns": reader.fieldnames,
        "message": "CSV uploaded and parsed into memory"
    }


@app.get("/rows")
def get_rows(limit: int = 50, offset: int = 0, search: str | None = None):
    """
    Returns a paginated list of rows from the uploaded dataset.
    Supports optional free-text search across all columns.

    Args:
        limit: Maximum number of rows to return.
        offset: Starting index for pagination.
        search: Optional free-text search term.

    Returns:
        rows: The requested page of rows (filtered if search is provided).
        total: Total number of rows after filtering.
    """

    if dataset is None:
        return {"error": "no dataset uploaded yet"}
    
    rows = dataset
    if search:
        search_lower = search.lower()
        filtered_rows = []

        for row in rows:
            for value in row.values():
                value_str = str(value).lower()
                if search_lower in value_str:
                    filtered_rows.append(row)
                    break

        rows = filtered_rows
    
    return {
        "rows": rows[offset:offset+limit],
        "total": len(rows)
    }


@app.post("/ask")
def ask_question(payload: AskRequest):
    """
    Processes a natural-language question and generates an AI-based answer.
    The model uses sample rows from the uploaded dataset as context.
    
    Returns:
        dict: Contains the original question and the AI-generated answer.
    """

    if dataset is None:
        return {"error": "no dataset uploaded yet"}

    question = payload.question

    context_rows = dataset[:50]  # limit to first 50 rows for safety & performance
    context_text = "\n".join(str(row) for row in context_rows)

    # Secure prompt with guardrails to prevent unsafe output
    prompt = f"""
    You are a data assistant. The user uploaded a dataset.
    Here are sample rows from the dataset:

    {context_text}

    The user asks: "{question}"

    Rules:
    - Answer ONLY based on the dataset above.
    - If the answer cannot be found in the dataset, say "I don't have enough information".
    - Do NOT guess.
    - Do NOT use external knowledge.
    - Do NOT generate or execute code.
    - Do NOT return Python, shell commands, SQL, or scripts of any kind.
    - Keep the answer short and factual.
    """

    answer = ask_gemini(prompt)

    dangerous_patterns = ["import ", "rm -rf", "DROP TABLE", "exec(", "eval("]
    if any(pattern in answer for pattern in dangerous_patterns):
        answer = "Blocked unsafe output."

    return answer