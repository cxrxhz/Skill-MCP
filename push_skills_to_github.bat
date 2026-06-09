@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

REM ============================================================
REM One-click Git push for Personal Skills MCP
REM Put this .bat file in your project root and double-click it.
REM It will:
REM   1. Enter this script's folder
REM   2. Check Git repository
REM   3. Pull remote changes with rebase
REM   4. Add all changes
REM   5. Commit if there are changes
REM   6. Push to the current branch
REM ============================================================

cd /d "%~dp0"

echo.
echo [1/7] Current folder:
echo %CD%
echo.

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
    echo [ERROR] This folder is not a Git repository.
    echo Put this .bat file in your project root folder, then try again.
    pause
    exit /b 1
)

for /f "delims=" %%b in ('git branch --show-current') do set BRANCH=%%b
if "%BRANCH%"=="" (
    echo [ERROR] Cannot detect current Git branch.
    pause
    exit /b 1
)

echo [2/7] Current branch: %BRANCH%
echo.

echo [3/7] Checking remote...
git remote -v
echo.

set /p COMMIT_MSG=Enter commit message, or press Enter to use default: 
if "%COMMIT_MSG%"=="" set COMMIT_MSG=update skills

echo.
echo [4/7] Pulling latest remote changes with rebase...
git pull --rebase origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [ERROR] git pull --rebase failed.
    echo If there are conflicts:
    echo   1. Open the conflicted files and fix them.
    echo   2. Run: git add .
    echo   3. Run: git rebase --continue
    echo   4. Run this .bat again.
    pause
    exit /b 1
)

echo.
echo [5/7] Adding all changes...
git add .
if errorlevel 1 (
    echo [ERROR] git add failed.
    pause
    exit /b 1
)

echo.
echo [6/7] Checking whether there is anything to commit...
git diff --cached --quiet
if not errorlevel 1 (
    echo No staged changes. Nothing to commit.
) else (
    git commit -m "%COMMIT_MSG%"
    if errorlevel 1 (
        echo [ERROR] git commit failed.
        pause
        exit /b 1
    )
)

echo.
echo [7/7] Pushing to origin/%BRANCH%...
git push origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [ERROR] git push failed.
    echo You may need to check your GitHub login, network, branch protection, or conflicts.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Done. Your changes have been pushed to GitHub.
echo For normal skill changes, Cloudflare redeploy is NOT needed.
echo Only run "npm run deploy" if you changed Worker code/config.
echo ============================================================
echo.
pause
exit /b 0
