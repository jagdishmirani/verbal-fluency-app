@echo off
REM Verbal Fluency App launcher for Windows.
REM Starts the backend, starts the frontend, and opens the app in your browser.

cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  py scripts\launch_app.py
) else (
  python scripts\launch_app.py
)
if errorlevel 1 (
  echo.
  echo If the launcher failed, make sure the first-time setup steps in README.md are complete.
  pause
)
