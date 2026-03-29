@echo off
echo ============================================================
echo  Capmarket - Backend Setup
echo  Creates .venv, installs dependencies, installs MAF
echo ============================================================
echo.

cd /d "%~dp0"

REM Create virtual environment
echo [1/4] Creating Python virtual environment...
python -m venv backend\.venv
if errorlevel 1 (
    echo ERROR: Failed to create venv. Is Python 3.11+ installed?
    pause
    exit /b 1
)

REM Activate venv
echo [2/4] Activating virtual environment...
call backend\.venv\Scripts\activate.bat

REM Install packages
echo [3/4] Installing backend dependencies...
pip install --upgrade pip
pip install -r backend\requirements.txt
if errorlevel 1 (
    echo ERROR: pip install failed
    pause
    exit /b 1
)

REM Install MAF (Microsoft Agent Framework)
echo [4/4] Installing Microsoft Agent Framework (MAF)...
pip install agent-framework --pre

echo.
echo ============================================================
echo  Setup complete!
echo  Copy backend\.env.example to .env and fill in credentials.
echo  Then run: run_backend.bat
echo ============================================================
pause
