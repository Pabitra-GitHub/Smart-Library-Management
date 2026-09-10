@echo off
title AI Smart Library System
echo ========================================================
echo    AI SMART LIBRARY MANAGEMENT SYSTEM
echo    B.Tech CSE 7th Semester Minor Project
echo ========================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this computer!
    echo.
    echo To run this project:
    echo 1. Go to https://nodejs.org and install the recommended version.
    echo 2. After installing, double-click this "run.bat" file again.
    echo.
    pause
    exit /b
)

:: Install dependencies if node_modules does not exist yet
if not exist node_modules (
    echo [1/2] First-time setup detected: Installing required components...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install packages. Please check your internet connection.
        pause
        exit /b
    )
)

echo [2/2] Launching AI Smart Library server...
echo.
echo Opening system in your web browser: http://localhost:3000
echo.
echo ========================================================
echo  FIRST TIME ACCESS:
echo   Create your Librarian or Student account on the screen!
echo   Librarian Master Passcode: admin123
echo ========================================================
echo.
echo (Press Ctrl+C at any time in this window to stop the server)
echo.

:: Launch default web browser automatically after 1 second
start "" "http://localhost:3000"

:: Start the Node server
node server.js
pause
