from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import csv
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}


dataset = None

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):

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
def get_rows(limit: int = 50, offset: int = 0):
    if dataset is None:
        return {"error": "no dataset uploaded yet"}

    return {
        "rows": dataset[offset:offset+limit],
        "total": len(dataset)
    }