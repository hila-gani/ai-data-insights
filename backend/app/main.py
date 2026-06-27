from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import io
from app.schemas import AskRequest
from app.processor import get_data_summary
from app.services.ask_service import answer_question
import pandas as pd

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

dataset = None
dataset_summary = None

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Uploads a CSV file, parses it into memory, and stores it as a DataFrame.

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

    global dataset, dataset_summary
    dataset = pd.read_csv(io.BytesIO(content))
    dataset_summary = get_data_summary(dataset)

    return {
        "filename": file.filename,
        "rows_count": len(dataset),
        "columns": dataset.columns.tolist(),
        "message": "CSV uploaded and parsed into memory"
    }


@app.get("/rows")
def get_rows(limit: int = 50, offset: int = 0, search: str | None = None):
    """
    Returns a paginated list of rows from the uploaded dataset.
    Supports optional free-text search across all columns.

    Args:
        limit (int): Maximum number of rows to return.
        offset (int): Starting index for pagination.
        search (str, optional): Search term to filter rows across all columns.

    Returns:
        dict: A dictionary containing 'rows' (list of dicts) and 'total' (int).
    """
    global dataset
    if dataset is None:
        return {"error": "no dataset uploaded yet"}
    
    df_filtered = dataset.copy()

    limit = max(1, min(limit, 200))
    offset = max(0, offset)

    if search:
        search = search.strip()
        if search:
            # Create a boolean mask: True for rows where any column contains the search term
            mask = df_filtered.apply(
                lambda row: row.astype(str).str.contains(
                    search,
                    case=False,
                    na=False,
                    regex=False
                ).any(),
                axis=1
            )
            # Apply the mask to filter the DataFrame
            df_filtered = df_filtered[mask]
    
    # Paginate results and convert to list of dicts for the frontend (JSON)
    rows = df_filtered.iloc[offset:offset+limit].to_dict(orient='records')
    return {
        "rows": rows,
        "total": len(df_filtered)
    }


@app.post("/ask")
def ask_question(payload: AskRequest):
    """
    Generates an AI-based answer using dataset statistics and sample context.
    """
    global dataset, dataset_summary
    if dataset is None:
        return {"error": "no dataset uploaded yet"}

    return answer_question(payload.question, dataset, dataset_summary)