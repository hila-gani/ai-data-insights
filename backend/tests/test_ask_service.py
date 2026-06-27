import pandas as pd

from app.services.ask_service import answer_question
from app.services.sql_service import execute_query, validate_sql_query


def test_answer_question_returns_safe_not_answerable_message(monkeypatch):
    df = pd.DataFrame({"age": [20, 30], "city": ["Paris", "London"]})
    summary = "Dataset size: 2 rows, 2 columns."

    def fake_gemini(prompt: str):
        return '{"route": "not_answerable", "reason": "The question cannot be answered from the dataset."}'

    monkeypatch.setattr("app.services.ask_service.ask_gemini", fake_gemini)

    result = answer_question("What is the capital of France?", df, summary)

    assert result["route"] == "not_answerable"
    assert "I can't answer that from this dataset" in result["answer"]


def test_validate_sql_query_rejects_dangerous_keywords():
    is_valid, error = validate_sql_query("DROP TABLE dataset")

    assert is_valid is False
    assert error


def test_execute_query_returns_rows_and_columns():
    df = pd.DataFrame({"name": ["Alice", "Bob"], "age": [25, 30]})

    result = execute_query(df, "SELECT name, age FROM dataset LIMIT 1")

    assert result["row_count"] == 1
    assert result["columns"] == ["name", "age"]
    assert result["rows"][0]["name"] == "Alice"


def test_answer_question_answers_metadata_questions_locally(monkeypatch):
    df = pd.DataFrame({"name": ["Alice"], "age": [30]})
    summary = "Dataset size: 1 row, 2 columns."

    called = {"count": 0}

    def fake_gemini(prompt: str):
        called["count"] += 1
        return "should not be used"

    monkeypatch.setattr("app.services.ask_service.ask_gemini", fake_gemini)

    result = answer_question("What is the data type of each column?", df, summary)

    assert result["answer"].startswith("The column data types")
    assert called["count"] == 0


def test_answer_question_returns_clean_error_for_quota(monkeypatch):
    df = pd.DataFrame({"name": ["Alice"]})
    summary = "Dataset size: 1 row, 1 column."

    monkeypatch.setattr("app.services.ask_service.ask_gemini", lambda prompt: {"error": "429 quota exceeded"})

    result = answer_question("Tell me a summary of the dataset.", df, summary)

    assert result["error"] == "429 quota exceeded"
