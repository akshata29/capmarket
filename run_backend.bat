@echo off
cd /d "%~dp0"
call backend\.venv\Scripts\activate.bat
echo Starting Capmarket FastAPI backend on http://localhost:8000
echo API docs: http://localhost:8000/docs
echo.
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8001 --reload
