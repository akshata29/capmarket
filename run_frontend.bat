@echo off
cd /d "%~dp0\frontend"
echo Installing frontend dependencies...
call npm install
echo.
echo Starting Capmarket React frontend on http://localhost:5173
echo.
call npm run dev
