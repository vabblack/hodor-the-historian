@echo off
echo Starting HistoryWeaver servers...

:: Start the main server in a new window
start "HistoryWeaver Main Server" cmd /k "npm run dev-main"

:: Start the modular server in a new window
start "HistoryWeaver Modular Server" cmd /k "npm run dev"

echo Both servers started!
echo Main server: http://localhost:3000
echo Modular server: http://localhost:3001 