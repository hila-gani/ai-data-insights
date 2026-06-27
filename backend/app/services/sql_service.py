import re
import sqlite3
import tempfile
from typing import Any

import pandas as pd


DANGEROUS_KEYWORDS = [
    "drop",
    "delete",
    "update",
    "insert",
    "alter",
    "create",
    "replace",
    "truncate",
    "attach",
    "detach",
    "pragma",
    "vacuum",
    "exec",
    "execute",
]


def execute_query(df: pd.DataFrame, query: str, table_name: str = "dataset") -> dict:
    """Execute a validated SELECT query against an in-memory SQLite table."""
    if df is None or df.empty:
        return {"rows": [], "columns": [], "row_count": 0, "error": "Dataset is empty."}

    is_valid, error = validate_sql_query(query, allowed_table=table_name)
    if not is_valid:
        return {"rows": [], "columns": [], "row_count": 0, "error": error}

    normalized_query = normalize_query(query, allowed_table=table_name)

    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as temp_file:
        temp_path = temp_file.name

    try:
        conn = sqlite3.connect(temp_path)
        df.to_sql(table_name, conn, index=False, if_exists="replace")

        cursor = conn.execute(normalized_query)
        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description] if cursor.description else []
        conn.close()

        result_rows = [dict(zip(columns, row)) for row in rows]
        return {"rows": result_rows, "columns": columns, "row_count": len(result_rows)}
    except Exception as exc:
        return {"rows": [], "columns": [], "row_count": 0, "error": f"SQL execution failed: {exc}"}
    finally:
        try:
            import os
            os.remove(temp_path)
        except OSError:
            pass


def validate_sql_query(query: str, allowed_table: str = "dataset") -> tuple[bool, str]:
    """Validate that the SQL query is a safe, single-statement SELECT."""
    if not query or not query.strip():
        return False, "Query is empty."

    candidate = query.strip()

    if re.search(r"--|/\*|\*/", candidate):
        return False, "Comments are not allowed."

    if ";" in candidate:
        return False, "Multiple statements are not allowed."

    if not re.search(r"^select\b", candidate, re.IGNORECASE):
        return False, "Only SELECT queries are allowed."

    lowered = candidate.lower()
    for keyword in DANGEROUS_KEYWORDS:
        if re.search(rf"\b{keyword}\b", lowered):
            return False, f"Dangerous keyword '{keyword}' is not allowed."

    if re.search(rf"\b(from|join|into|update|delete|insert|truncate|create|alter|replace|attach|detach|pragma|vacuum)\b", lowered):
        if allowed_table not in lowered:
            return False, f"Only the '{allowed_table}' table is allowed."

    return True, ""


def normalize_query(query: str, allowed_table: str = "dataset") -> str:
    """Ensure the query is limited and only references the allowed table."""
    candidate = query.strip()
    if re.search(r"\blimit\b", candidate, re.IGNORECASE):
        return candidate

    if re.search(r"\bselect\b", candidate, re.IGNORECASE):
        return f"{candidate} LIMIT 100"
    return candidate
