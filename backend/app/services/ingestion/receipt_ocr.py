from app.services.llm.gemini_client import model
import json
import re

def clean_json(response_text):
    match = re.search(r"\{.*\}", response_text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return {"error": "Invalid JSON"}


def extract_receipt_data(image_bytes):

    prompt = """
    You are an OCR system.

    Your task is to TRANSCRIBE the handwritten receipt EXACTLY as it appears.

    STRICT RULES:
    - Do NOT summarize
    - Do NOT interpret
    - Do NOT calculate totals
    - Do NOT infer missing values
    - Do NOT clean or reformat text
    - Preserve original spelling, numbers, and formatting as closely as possible

    OUTPUT FORMAT:
    Return JSON with:
    {
    "transcript": "full raw text exactly as seen in the image"
    }

    If text is unclear, include it as [unclear].

    ONLY return valid JSON. No explanation.
    """

    response = model.generate_content([
        prompt,
        {"mime_type": "image/jpeg", "data": image_bytes}
    ])

    return clean_json(response.text)