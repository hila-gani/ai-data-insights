import google.generativeai as genai
import os
from dotenv import load_dotenv


load_dotenv()


api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)

def ask_gemini(prompt: str) -> str:
    if not api_key:
        return {"error": "GEMINI_API_KEY is not configured"}
    if not prompt or not prompt.strip():
        return {"error": "prompt is empty"}

    try:
        model = genai.GenerativeModel("gemini-3.5-flash")
        response = model.generate_content(prompt)
        return {"answer": response.text}

    except Exception as e:
        return {"error": f"Gemini request failed: {str(e)}"}
    
  