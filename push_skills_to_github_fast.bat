@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

REM ============================================================
REM Fast one-click Git push for Personal Skills MCP
REM Put this .bat file in your project root and double-click it.
REM
REM Default behavior:
REM   1. Add all changes
REM   2. Commit if there are changes
REM   3. Push directly
REM
REM If push is rejected because remote has new commits:
REM   - The script will offer to run: git pull --rebase origin CURRENT_BRANCH
REM   - Then it will push again
REM ============================================================

cd /d "%~dp0"

echo.
echo [1/6] Current folder:
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

echo [2/6] Current branch: %BRANCH%
echo.

echo [3/6] Adding all changes...
git add .
if errorlevel 1 (
    echo [ERROR] git add failed.
    pause
    exit /b 1
)

echo.
echo [4/6] Checking whether there is anything to commit...
git diff --cached --quiet
if not errorlevel 1 (
    echo No staged changes. Nothing to commit.
) else (
    set /p COMMIT_MSG=Enter commit message, or press Enter to use default: 
    if "!COMMIT_MSG!"=="" set COMMIT_MSG=update skills

    git commit -m "!COMMIT_MSG!"
    if errorlevel 1 (
        echo [ERROR] git commit failed.
        pause
        exit /b 1
    )
)

echo.
echo [5/6] Pushing to origin/%BRANCH%...
git push origin %BRANCH%
if not errorlevel 1 (
    goto PUSH_DONE
)

echo.
echo [WARN] Direct push failed.
echo This is often caused by remote changes that you do not have locally.
echo.

choice /C YN /M "Run git pull --rebase origin %BRANCH% and try pushing again"
if errorlevel 2 (
    echo.
    echo Cancelled. Nothing else was done.
    pause
    exit /b 1
)

echo.
echo Running rebase...
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
echo Trying push again...
git push origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [ERROR] git push still failed.
    echo Check your GitHub login, network, branch protection, or unresolved conflicts.
    pause
    exit /b 1
)

:PUSH_DONE
echo.
echo ============================================================
echo Done. Your changes have been pushed to GitHub.
echo For normal skill changes, Cloudflare redeploy is NOT needed.
echo Only run "npm run deploy" if you changed Worker code/config.
echo ============================================================
echo.
pause
exit /b 0
