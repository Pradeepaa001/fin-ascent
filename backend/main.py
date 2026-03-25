from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import personalization, decision, chat
from app.api.upload import router as upload_router

app = FastAPI(title="FinAscent Personalization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(personalization.router, prefix="/api/personalization", tags=["Personalization"])
app.include_router(decision.router, prefix="/api/decision", tags=["Decision"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(upload_router, prefix="/api/upload", tags=["Upload"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FinAscent Backend Running"}
