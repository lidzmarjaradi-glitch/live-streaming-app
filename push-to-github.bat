@echo off
REM Live Streaming App - GitHub Push Script
REM This script will push your project to GitHub

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Live Streaming App - GitHub Push
echo ========================================
echo.

set /p GITHUB_USERNAME="Enter your GitHub username: "
set /p REPO_NAME="Enter your repository name (default: live-streaming-app): "

if "%REPO_NAME%"=="" set "REPO_NAME=live-streaming-app"

set "REPO_URL=https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git"

echo.
echo Repository URL: %REPO_URL%
echo.
pause

REM Check if remote already exists
git remote -v | findstr "origin" >nul
if %errorlevel% equ 0 (
    echo Removing existing remote...
    git remote remove origin
)

REM Add remote and push
echo Adding remote...
git remote add origin %REPO_URL%

echo Switching to main branch...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS! Your repository is now on GitHub.
    echo.
    echo Next steps:
    echo 1. Go to https://render.com
    echo 2. Create a Web Service and connect this repository
    echo 3. Follow the DEPLOYMENT.md guide for configuration
    echo.
) else (
    echo.
    echo ERROR: Push failed. Please check your GitHub credentials.
    echo.
)

pause
