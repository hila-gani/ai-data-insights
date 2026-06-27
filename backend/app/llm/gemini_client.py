import os

import google.generativeai as genai
from dotenv import load_dotenv


load_dotenv()


api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)


def ask_gemini(prompt: str):
    if not api_key:
        return {"error": "GEMINI_API_KEY is not configured"}
    if not prompt or not prompt.strip():
        return {"error": "prompt is empty"}

    try:
        model = genai.GenerativeModel("gemini-3.5-flash")
        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        error_text = str(e).lower()
        if "429" in error_text or "quota" in error_text or "rate limit" in error_text or "resource exhausted" in error_text:
            return {"error": "The AI service quota was exceeded. Please try again later."}
        return {"error": f"Gemini request failed: {str(e)}"}
    
  