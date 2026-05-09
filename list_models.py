
import os
from google import genai
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / "ClauseGuard-rag" / ".env")
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)
for model in client.models.list():
    print(f"Model: {model.name}")
