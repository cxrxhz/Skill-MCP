@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

REM ============================================================
REM Git commit + push + Cloudflare deploy
REM Project: Personal Skills MCP
REM ============================================================

set "PROJECT_DIR=G:\pythonProject\Skill-mcp"

echo.
echo [1/6] Enter project directory...
if not exist "%PROJECT_DIR%\.git" (
    echo ERROR: Git repo not found:
    echo   %PROJECT_DIR%
    echo.
    echo Please edit PROJECT_DIR in this .bat file.
    pause
    exit /b 1
)

cd /d "%PROJECT_DIR%" || (
    echo ERROR: Failed to enter project directory.
    pause
    exit /b 1
)

echo Current directory:
cd
echo.

echo [2/6] Detect current branch...
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD 2^>nul') do set "BRANCH=%%b"

if "%BRANCH%"=="" (
    echo ERROR: Failed to detect current git branch.
    pause
    exit /b 1
)

echo Current branch: %BRANCH%
echo.

echo [3/6] Check local changes...
git status --short
echo.

set "HAS_CHANGES="
for /f "delims=" %%s in ('git status --porcelain') do set "HAS_CHANGES=1"

if not defined HAS_CHANGES (
    echo No local git changes found. Skip commit.
    goto PUSH_STEP
)

set "DEFAULT_MSG=update skills mcp"
set /p "COMMIT_MSG=Commit message [default: %DEFAULT_MSG%]: "
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=%DEFAULT_MSG%"

echo.
echo Running: git add .
git add .
if errorlevel 1 (
    echo ERROR: git add failed.
    pause
    exit /b 1
)

echo.
echo Running: git commit -m "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo.
    echo WARNING: git commit failed. This may mean there is nothing to commit,
    echo or a commit hook rejected the commit.
    echo.
    set /p "CONTINUE_AFTER_COMMIT_FAIL=Continue to git push anyway? [y/N]: "
    if /i not "%CONTINUE_AFTER_COMMIT_FAIL%"=="y" (
        echo Aborted.
        pause
        exit /b 1
    )
)

:PUSH_STEP
echo.
echo [4/6] Push to remote...
git push
if errorlevel 1 (
    echo.
    echo Git push failed.
    echo Common reason: remote branch has new commits.
    echo.
    set /p "DO_REBASE=Run 'git pull --rebase origin %BRANCH%' and push again? [y/N]: "
    if /i not "%DO_REBASE%"=="y" (
        echo Aborted before deploy.
        pause
        exit /b 1
    )

    echo.
    echo Running: git pull --rebase origin %BRANCH%
    git pull --rebase origin %BRANCH%
    if errorlevel 1 (
        echo.
        echo ERROR: rebase failed. Resolve conflicts manually, then run this script again.
        pause
        exit /b 1
    )

    echo.
    echo Running: git push
    git push
    if errorlevel 1 (
        echo ERROR: git push still failed. Aborted before deploy.
        pause
        exit /b 1
    )
)

echo.
echo [5/6] Deploy to Cloudflare Workers...
echo Running: npm run deploy
npm run deploy
if errorlevel 1 (
    echo.
    echo ERROR: npm run deploy failed.
    echo Check npm / wrangler / Cloudflare login / TypeScript errors.
    pause
    exit /b 1
)

echo.
echo [6/6] Done.
echo Git push succeeded and Cloudflare deploy succeeded.
echo.
echo If tool schema changed, refresh tools in ChatGPT:
echo Settings / Apps / Skill / Refresh tools
echo.

pause
exit /b 0
