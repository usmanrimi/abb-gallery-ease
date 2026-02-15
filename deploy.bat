@echo off
set GIT="C:\Program Files\Git\cmd\git.exe"

if not exist %GIT% (
    echo Git not found at default location. Please check your installation.
    pause
    exit /b
)

cd /d "%~dp0"
echo Current Directory: %CD%

if not exist .git (
    echo Initializing Git repository...
    %GIT% init
    %GIT% branch -M main
    %GIT% remote add origin https://github.com/usmanrimi/abb-gallery-ease.git
)

echo Adding files...
%GIT% add .

echo Committing...
%GIT% commit -m "Auto-deploy RBAC changes from script"

echo Pulling remote changes...
%GIT% pull origin main --allow-unrelated-histories --no-edit

echo Pushing to GitHub...
%GIT% push -u origin main

echo.
echo ========================================================
echo Deployment Complete!
echo You can now check Netlify for the build status.
echo ========================================================
pause
