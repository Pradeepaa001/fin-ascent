from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.dashboard import router as dashboard_router
from app.api.upload import router as upload_router


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

# Optional root route
@app.get("/")
def root():
    return {"message": "Backend running"}

