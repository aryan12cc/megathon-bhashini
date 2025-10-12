"""
Configuration for Saraansh (Clinical Transcript Processing)
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Gemini API Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")

GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
GEMINI_TIMEOUT = 60

# MT API Configuration
API_SERVER_URL = os.getenv('API_SERVER_URL', 'http://localhost:8000')
MT_ENDPOINT = f"{API_SERVER_URL}/mt"
