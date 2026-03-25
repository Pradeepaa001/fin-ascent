import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv

# Repo root (…/Gradient_Ascent) so GEMINI_API_KEY loads when cwd is backend/
_REPO_ROOT = Path(__file__).resolve().parents[4]
load_dotenv(_REPO_ROOT / ".env")
load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY")
if _api_key:
    genai.configure(api_key=_api_key)

# gemini-1.5-* removed from v1beta; use current stable multimodal model (see ai.google.dev models)
model = genai.GenerativeModel("gemini-2.5-flash")