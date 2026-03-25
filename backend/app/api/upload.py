from fastapi import APIRouter, UploadFile, File, Query
from app.services.ingestion.receipt_ocr import extract_receipt_data

router = APIRouter()

@router.post("/receipt")
async def upload_receipt(file: UploadFile = File(...)):

    image_bytes = await file.read()

    result = extract_receipt_data(image_bytes)

    return {
        "status": "success",
        "data": result
    }