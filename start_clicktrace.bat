@echo off
title ClickTrace - AI-Powered Website UX Intelligence
color 0B

echo ================================================================
echo               CLICKTRACE - UX INTELLIGENCE PLATFORM              
echo ================================================================
echo.
echo [1/4] Checking Ollama AI Service...
netstat -ano | findstr ":11434" >nul
if %errorlevel% neq 0 (
    echo       Starting Ollama local service...
    start /min "Ollama Service" "C:\Users\shahi\AppData\Local\Programs\Ollama\ollama.exe" serve
    timeout /t 2 /nobreak >nul
) else (
    echo       Ollama is already active on port 11434.
)

echo [2/4] Starting FastAPI Backend (Python Uvicorn on :8000)...
start /min "ClickTrace Backend" python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

echo [3/4] Starting React Dashboard (Vite on :5173)...
cd /d "%~dp0frontend"
start /min "ClickTrace Frontend" npm run dev

echo [4/4] Waiting for services to initialize...
timeout /t 3 /nobreak >nul

echo.
echo ================================================================
echo                    ALL SERVICES ARE ACTIVE!                    
echo ================================================================
echo  * ClickTrace Dashboard:   http://localhost:5173
echo  * Demo College Website:   http://127.0.0.1:8000/demo/index.html
echo  * Tracking SDK Endpoint:  http://127.0.0.1:8000/sdk/clicktrace.js
echo  * REST API Documentation: http://127.0.0.1:8000/docs
echo  * Local Gemma Model:      gemma:2b via Ollama (:11434)
echo ================================================================
echo.
echo Launching Dashboard and Demo Website in your default browser...
start http://localhost:5173
start http://127.0.0.1:8000/demo/index.html

echo.
echo Press any key to exit this launcher window (services keep running).
pause >nul
