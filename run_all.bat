@echo off
echo ============================================================
echo  Capmarket - Start All Services
echo ============================================================
echo.
echo Starting backend in new window...
start "Capmarket Backend" cmd /k "call run_backend.bat"
timeout /t 3 /nobreak >nul
echo Starting frontend in new window...
start "Capmarket Frontend" cmd /k "call run_frontend.bat"
echo.
echo Services starting...
echo   Backend: http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API docs: http://localhost:8000/docs
