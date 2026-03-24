@echo off
echo Starting HistoryWeaver setup...
echo.

REM Check if .env file exists
if not exist .env (
    echo No configuration found. Running setup...
    npm run setup
    if errorlevel 1 (
        echo Setup failed. Please try again.
        pause
        exit /b 1
    )
)

echo Installing dependencies...
npm install

echo.
echo Starting server...
echo Server will be available at http://localhost:3002
echo.
npm run dev 