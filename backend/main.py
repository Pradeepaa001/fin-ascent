from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import personalization, decision, chat

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

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FinAscent Backend Running"}
