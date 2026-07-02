@echo off
echo Starting Backend Server on port 3005...

where node >nul 2>nul
if %errorlevel% equ 0 (
    start "English Words Backend" node server.js
) else (
    if exist "C:\Program Files\nodejs\node.exe" (
        start "English Words Backend" "C:\Program Files\nodejs\node.exe" server.js
    ) else (
        echo Node.js not found. Please install it.
        pause
        exit
    )
)

echo Starting Frontend Server on port 8080...
start "English Words Frontend" python -m http.server 8080

echo Both servers started!
echo Frontend: http://localhost:8080
echo Backend API: http://localhost:3005/api
pause
