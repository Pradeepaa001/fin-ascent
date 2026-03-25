from app.services.llm.gemini_client import model
import json
import re

def clean_json(response_text):
    # Extract the first {...} block and parse it as JSON.
    # The OCR model sometimes wraps JSON in extra text/formatting.
    match = re.search(r"\{[\s\S]*?\}", response_text or "", re.DOTALL)
    if not match:
        return {"error": "Invalid JSON", "raw": response_text}

    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return {"error": "Invalid JSON", "raw": response_text}


def _normalize_image_mime(mime_type):
    if not mime_type or mime_type == "application/octet-stream":
        return "image/jpeg"
    if mime_type.startswith("image/"):
        return mime_type
    return "image/jpeg"


def extract_receipt_data(image_bytes, mime_type="image/jpeg"):
    mime = _normalize_image_mime(mime_type)

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

    try:
        response = model.generate_content(
            [
                prompt,
                {"mime_type": mime, "data": image_bytes},
            ]
        )
    except Exception as e:
        return {
            "error": "Gemini request failed",
            "detail": str(e),
        }

    try:
        raw_text = response.text or ""
    except Exception as e:
        feedback = getattr(response, "prompt_feedback", None)
        return {
            "error": "No OCR text returned (blocked or empty response)",
            "detail": str(e),
            "prompt_feedback": str(feedback) if feedback is not None else None,
        }

    return clean_json(raw_text)