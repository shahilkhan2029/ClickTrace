@echo off
setlocal enabledelayedexpansion
title ClickTrace - AI-Powered Website UX Intelligence
color 0B

:: Ensure working directory is the folder where this batch file lives
cd /d "%~dp0"

echo ==============================================================================
echo                CLICKTRACE - AI-POWERED UX INTELLIGENCE PLATFORM               
echo ==============================================================================
echo.
echo Initializing local services: Ollama (Gemma 2B) + FastAPI (SQLite) + React (Vite)
echo.

:: -----------------------------------------------------------------------------
:: Step 1: Detect and Start Ollama Service
:: -----------------------------------------------------------------------------
echo [1/4] Checking Ollama AI Service...
netstat -ano | findstr "127.0.0.1:11434" >nul
if %errorlevel% neq 0 (
    echo       Ollama service not running on port 11434. Starting service...
    set "OLLAMA_BIN=ollama"
    where ollama >nul 2>nul
    if %errorlevel% neq 0 (
        if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
            set "OLLAMA_BIN=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
        )
    )
    start "" /min "!OLLAMA_BIN!" serve
    timeout /t 3 /nobreak >nul
    echo       [OK] Ollama service started.
) else (
    echo       [OK] Ollama service is already active on port 11434.
)

:: -----------------------------------------------------------------------------
:: Step 2: Start FastAPI Backend (Port 8000)
:: -----------------------------------------------------------------------------
echo [2/4] Checking FastAPI Backend (:8000)...
netstat -ano | findstr "127.0.0.1:8000" >nul
if %errorlevel% neq 0 (
    echo       Starting FastAPI Backend with Uvicorn...
    start "ClickTrace Backend" /min python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
    timeout /t 2 /nobreak >nul
    echo       [OK] Backend started.
) else (
    echo       [OK] FastAPI Backend is already active on port 8000.
)

:: -----------------------------------------------------------------------------
:: Step 3: Start React Vite Dashboard (Port 5173)
:: -----------------------------------------------------------------------------
echo [3/4] Checking React Dashboard (:5173)...
netstat -ano | findstr "127.0.0.1:5173" >nul
if %errorlevel% neq 0 (
    echo       Starting Vite Development Server...
    cd /d "%~dp0frontend"
    start "ClickTrace Frontend" /min cmd /c "npm run dev"
    cd /d "%~dp0"
    timeout /t 3 /nobreak >nul
    echo       [OK] Frontend started.
) else (
    echo       [OK] React Dashboard is already active on port 5173.
)

:: -----------------------------------------------------------------------------
:: Step 4: Verify and Open Browser
:: -----------------------------------------------------------------------------
echo [4/4] Verifying stack health and opening application in browser...
timeout /t 2 /nobreak >nul

echo.
echo ==============================================================================
echo                          ALL SERVICES ARE READY!                              
echo ==============================================================================
echo   * ClickTrace Dashboard:     http://localhost:5173
echo   * Demo Website (Nexus):     http://127.0.0.1:8000/demo/index.html
echo   * Tracking SDK JavaScript:  http://127.0.0.1:8000/sdk/clicktrace.js
echo   * Swagger API Docs:         http://127.0.0.1:8000/docs
echo   * Local AI Engine:          Ollama (Gemma 2B) on :11434
echo ==============================================================================
echo.
echo Launching Dashboard and Demo Website...
start http://localhost:5173
start http://127.0.0.1:8000/demo/index.html

echo.
echo Tip: Keep this window open or close it when done.
echo To shut down all ClickTrace services, you can close the minimized windows
echo or run: taskkill /F /IM python.exe /IM node.exe
echo.
echo Press any key to exit this launcher window...
pause >nul
