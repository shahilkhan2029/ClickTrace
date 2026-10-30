@echo off
title Stop ClickTrace Services
color 0C

echo ==============================================================================
echo                      STOPPING CLICKTRACE SERVICES                             
echo ==============================================================================
echo.
echo Stopping FastAPI Backend (port 8000) and Frontend (port 5173)...

:: Kill process listening on port 8000 (FastAPI backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)

:: Kill process listening on port 5173 (Vite frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)

taskkill /F /FI "WINDOWTITLE eq ClickTrace Backend*" /T >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq ClickTrace Frontend*" /T >nul 2>nul

echo [OK] ClickTrace Backend and Frontend stopped cleanly.
echo Note: Ollama background engine was left active for fast inference.
echo.
echo Press any key to exit...
pause >nul
