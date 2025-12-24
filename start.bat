@echo off
REM GAERS Website - Local Development Server Startup Script
REM Usage: start.bat [port]
REM Default port: 8000

setlocal

REM Set default port
if "%1"=="" (
    set PORT=8000
) else (
    set PORT=%1
)

echo =========================================
echo   GAERS Website - Local Server
echo =========================================
echo.

REM Check if Python 3 is available
where python >nul 2>nul
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3 to run the local server
    pause
    exit /b 1
)

echo Working directory: %CD%
echo Starting HTTP server on port %PORT%...
echo.
echo Open in browser:
echo    http://localhost:%PORT%
echo.
echo Available pages:
echo    http://localhost:%PORT%/index.html
echo    http://localhost:%PORT%/spatial-transcriptomics.html
echo    http://localhost:%PORT%/bulk-rnaseq.html
echo    http://localhost:%PORT%/gene-search.html
echo.
echo Press Ctrl+C to stop the server
echo =========================================
echo.

REM Auto-open browser (optional)
start http://localhost:%PORT%

REM Start server
python -m http.server %PORT%

pause
