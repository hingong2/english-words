@echo off
echo Starting Backend Server on port 3005...
start "English Words Backend" python server.py

echo Starting Frontend Server on port 8080...
start "English Words Frontend" python -m http.server 8080

echo Both servers started!
echo Frontend: http://localhost:8080
echo Backend API: http://localhost:3005/api
pause
