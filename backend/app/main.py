from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dashboard import router as dashboard_router
from app.api.jobs import router as jobs_router
from app.api.upload import router as upload_router
<<<<<<< HEAD
from app.scheduler import shutdown_scheduler, start_scheduler
=======
from app.api.personalization import router as personalization_router
from app.api.decision import router as decision_router
from app.api.chat import router as chat_router
>>>>>>> 21fa1cec22c9985041b219faef20706f988c544e


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router, prefix="/api/dashboard")
app.include_router(upload_router, prefix="/api/upload")
<<<<<<< HEAD
app.include_router(jobs_router, prefix="/api/jobs")

=======
app.include_router(personalization_router, prefix="/api/personalization", tags=["Personalization"])
app.include_router(decision_router, prefix="/api/decision", tags=["Decision"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
>>>>>>> 21fa1cec22c9985041b219faef20706f988c544e

@app.get("/")
def root():
    return {"message": "Backend running"}
