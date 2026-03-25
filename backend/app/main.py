from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.dashboard import router as dashboard_router
from app.api.upload import router as upload_router
from app.api.personalization import router as personalization_router
from app.api.decision import router as decision_router
from app.api.chat import router as chat_router


# Create app
app = FastAPI()




#Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Include routes
app.include_router(dashboard_router, prefix="/api/dashboard")
app.include_router(upload_router, prefix="/api/upload")
app.include_router(personalization_router, prefix="/api/personalization", tags=["Personalization"])
app.include_router(decision_router, prefix="/api/decision", tags=["Decision"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])

# Optional root route
@app.get("/")
def root():
    return {"message": "Backend running"}

