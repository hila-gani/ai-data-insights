import json
import re
from typing import Any

import pandas as pd

from app.llm.gemini_client import ask_gemini
from app.services.sql_service import execute_query


ROUTING_RETRIES = 2
SQL_RETRIES = 2


def answer_question(question: str, dataset: pd.DataFrame, dataset_summary: str) -> dict:
    """Route the user's question and produce a short factual answer."""
    if dataset is None:
        return {"answer": "No dataset has been uploaded yet.", "route": "error"}

    if dataset.empty:
        return {"answer": "The uploaded dataset is empty.", "route": "error"}

    sample_rows = dataset.head(5).to_csv(index=False)
    columns = dataset.columns.tolist()

    local_answer = answer_from_dataset(question, dataset)
    if local_answer is not None:
        return {"answer": local_answer, "route": "summary_only"}

    routing_result = route_question(question, dataset_summary, sample_rows, columns)
    route = routing_result.get("route", "summary_only")
    reason = routing_result.get("reason")

    if route == "not_answerable":
        message = "I can't answer that from this dataset."
        if reason:
            message = f"{message} {reason}"
        return {"answer": message, "route": route, "reason": reason}

    if route in {"sql_required", "hybrid"}:
        return answer_with_sql(question, dataset, dataset_summary, sample_rows, route, reason)

    return answer_without_sql(question, dataset_summary, sample_rows, route, reason)


def route_question(question: str, dataset_summary: str, sample_rows: str, columns: list[str]) -> dict:
    """Ask Gemini to classify the question into one of the supported routes."""
    prompt = f"""
    You are a routing assistant for a CSV dataset explorer.
    Return strict JSON only. Do not wrap the result in markdown.

    Question: {question}

    Dataset summary:
    {dataset_summary}

    Sample rows:
    {sample_rows}

    Available columns:
    {', '.join(columns)}

    Return a JSON object with exactly these keys:
    - route: one of summary_only, sample_rows_only, sql_required, hybrid, not_answerable
    - reason: short explanation
    - needs_sql: true or false
    """

    for _ in range(ROUTING_RETRIES):
        raw_response = ask_gemini(prompt)
        parsed = _parse_json_response(raw_response)
        if parsed is not None:
            route = parsed.get("route", "summary_only")
            if route in {"summary_only", "sample_rows_only", "sql_required", "hybrid", "not_answerable"}:
                return {
                    "route": route,
                    "reason": parsed.get("reason", ""),
                    "needs_sql": bool(parsed.get("needs_sql", route in {"sql_required", "hybrid"})),
                }

    return {"route": "not_answerable", "reason": "Routing failed", "needs_sql": False}


def answer_without_sql(question: str, dataset_summary: str, sample_rows: str, route: str, reason: str | None) -> dict:
    """Answer from the summary and sample rows without using SQL."""
    prompt = f"""
    You are a factual data assistant.
    Answer the user's question using only the dataset summary and sample rows.
    Do not use external knowledge.
    Do not guess.
    Do not include code or SQL.
    Return a short factual answer.

    Route: {route}
    Reason: {reason or ''}

    Dataset summary:
    {dataset_summary}

    Sample rows:
    {sample_rows}

    Question: {question}
    """

    answer = ask_gemini(prompt)
    if isinstance(answer, dict) and answer.get("error"):
        return {"error": answer["error"]}
    return {"answer": answer, "route": route, "reason": reason}


def answer_with_sql(
    question: str,
    dataset: pd.DataFrame,
    dataset_summary: str,
    sample_rows: str,
    route: str,
    reason: str | None,
) -> dict:
    """Generate SQL, validate and execute it, then ask Gemini for a final answer."""
    columns = dataset.columns.tolist()

    for _ in range(SQL_RETRIES):
        sql_query = generate_sql_query(question, dataset_summary, columns)
        if not sql_query:
            continue

        result = execute_query(dataset, sql_query)
        if result.get("error"):
            continue

        prompt = f"""
        You are a factual data assistant.
        Answer the user's question using only the SQL result below.
        Do not use external knowledge.
        Do not guess.
        Do not include code or SQL.
        Return a short factual answer.

        Route: {route}
        Reason: {reason or ''}

        Dataset summary:
        {dataset_summary}

        Sample rows:
        {sample_rows}

        SQL query:
        {sql_query}

        SQL result:
        {json.dumps(result, ensure_ascii=False)}

        Question: {question}
        """
        answer = ask_gemini(prompt)
        if isinstance(answer, dict) and answer.get("error"):
            return {"error": answer["error"]}
        return {
            "answer": answer,
            "route": route,
            "reason": reason,
            "sql_query": sql_query,
            "sql_result": result,
        }

    return {
        "answer": "I couldn't safely generate a reliable answer from the dataset.",
        "route": route,
        "reason": reason,
    }


def generate_sql_query(question: str, dataset_summary: str, columns: list[str]) -> str | None:
    """Ask Gemini to generate a read-only SQL query for the dataset."""
    prompt = f"""
    You are a SQL generator for a CSV dataset stored in a SQLite table named dataset.
    Return strict JSON only. Do not wrap the result in markdown.

    Question: {question}

    Dataset summary:
    {dataset_summary}

    Available columns:
    {', '.join(columns)}

    Return a JSON object with exactly these keys:
    - sql_query: a single read-only SELECT query against the table dataset
    - reason: short explanation
    """

    raw_response = ask_gemini(prompt)
    parsed = _parse_json_response(raw_response)
    if parsed is None:
        return None

    sql_query = parsed.get("sql_query", "")
    if isinstance(sql_query, str) and sql_query.strip():
        return sql_query.strip()
    return None


def answer_from_dataset(question: str, dataset: pd.DataFrame) -> str | None:
    """Answer common metadata questions directly from the DataFrame."""
    normalized = question.strip().lower()

    if re.search(r"column(s)? in the dataset|which columns|list the columns", normalized):
        columns = ", ".join(dataset.columns.tolist())
        return f"The columns are: {columns}."

    if re.search(r"data type(s)? of each column|column data type|types of each column", normalized):
        dtypes = dataset.dtypes.astype(str).to_dict()
        parts = [f"{name}: {dtype}" for name, dtype in dtypes.items()]
        return "The column data types are: " + "; ".join(parts) + "."

    if re.search(r"number of rows|how many rows|rows in the dataset", normalized):
        return f"The dataset has {len(dataset)} rows."

    if re.search(r"number of columns|how many columns|columns in the dataset", normalized):
        return f"The dataset has {len(dataset.columns)} columns."

    return None


def _parse_json_response(raw_response: Any) -> dict | None:
    """Parse Gemini JSON responses while tolerating simple markdown wrappers."""
    if raw_response is None:
        return None

    if isinstance(raw_response, dict):
        return raw_response

    text = str(raw_response).strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None
