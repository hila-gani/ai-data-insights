import os

import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()

class AIServiceError(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)


def ask_gemini(prompt: str):
    if not api_key:
        raise AIServiceError("GEMINI_API_KEY is not configured", status_code=500)
        
    if not prompt or not prompt.strip():
        raise AIServiceError("Prompt is empty", status_code=400)

    try:
        model = genai.GenerativeModel("gemini-3.5-flash")
        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        error_text = str(e).lower()
        
        is_quota_error = (
            "429" in error_text
            or "quota" in error_text
            or "rate limit" in error_text
            or "resource exhausted" in error_text
            or "too many requests" in error_text
        )

        if is_quota_error:
            raise AIServiceError(
                "The AI service quota was exceeded. Please try again later.",
                status_code=429,
            ) from e

        raise AIServiceError(f"Gemini request failed: {str(e)}", status_code=500) from e
    
  