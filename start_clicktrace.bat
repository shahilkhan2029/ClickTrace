@echo off
title ClickTrace - AI-Powered Website UX Intelligence
cd /d "%~dp0"
python launcher.py
if %errorlevel% neq 0 (
    echo.
    echo Launcher encountered an error. Press any key to exit.
    pause >nul
)
