@echo off
set GIT="C:\Program Files\Git\cmd\git.exe"

REM Check if git exists at the path
if not exist %GIT% (
    echo Git not found at default location. Please check your installation.
    pause
    exit /b
)

REM Navigate to script directory
cd /d "%~dp0"

echo Current Directory: %CD%

REM Check if .git exists, initialize if not
if not exist .git (
    echo Initializing Git repository...
    %GIT% init
    %GIT% branch -M main
    %GIT% remote add origin https://github.com/usmanrimi/abb-gallery-ease.git
) else (
    echo Git repository already initialized.
    REM Ensure remote is correct just in case
    %GIT% remote set-url origin https://github.com/usmanrimi/abb-gallery-ease.git
)

REM Add, Commit, Push
echo Adding files...
%GIT% add .

echo Committing...
%GIT% commit -m "Auto-deploy RBAC changes from script"

echo Pushing to GitHub...
%GIT% push -u origin main

echo.
echo ========================================================
echo Deployment Complete!
echo You can now check Netlify for the build status.
echo ========================================================
pause
