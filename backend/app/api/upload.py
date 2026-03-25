from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.ingestion.receipt_ocr import extract_receipt_data

router = APIRouter()


@router.get("/receipt")
async def receipt_upload_info():
    """Browser GET returns guidance; OCR requires POST with multipart field `file`."""
    return {
        "message": "Send POST with multipart form field 'file' (a receipt image).",
        "path": "/api/upload/receipt",
    }


@router.post("/receipt")
async def upload_receipt(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file upload")

        mime = file.content_type or "application/octet-stream"
        result = extract_receipt_data(image_bytes, mime_type=mime)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {e!s}",
        ) from e

    return {
        "status": "success",
        "data": result
    }