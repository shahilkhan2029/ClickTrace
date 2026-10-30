@echo off
title Stop ClickTrace Services
color 0C

echo ==============================================================================
echo                      STOPPING CLICKTRACE SERVICES                             
echo ==============================================================================
echo.
echo Stopping FastAPI Backend and Frontend processes...

taskkill /F /FI "WINDOWTITLE eq ClickTrace Backend*" /T >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq ClickTrace Frontend*" /T >nul 2>nul
taskkill /F /IM uvicorn.exe >nul 2>nul

echo [OK] ClickTrace Backend and Frontend stopped.
echo Note: Ollama service was left running for fast future inference.
echo.
echo Press any key to exit...
pause >nul
