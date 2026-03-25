@echo off
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Starting FastAPI Server on port 8000...
uvicorn app.main:app --reload --port 8000
pause
