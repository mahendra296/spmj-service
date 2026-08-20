@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%Backend"
set "FRONTEND_DIR=%ROOT%Frontend"
set "BACKEND_PORT=5000"
set "FRONTEND_PORT=5173"

echo ==========================================
echo   SPMJ Foundation - Starting
echo ==========================================

REM --- Backend requires Backend\.env (node --env-file=.env fails if missing) ---
if not exist "%BACKEND_DIR%\.env" (
    echo Backend\.env not found - copy Backend\.env.example and fill in real secrets first.
    exit /b 1
)

REM --- Free up ports in case a previous run is still hanging around ---
call :killport %BACKEND_PORT% backend
call :killport %FRONTEND_PORT% frontend

REM --- Install dependencies if missing ---
if not exist "%BACKEND_DIR%\node_modules" (
    echo Installing backend dependencies...
    pushd "%BACKEND_DIR%"
    call npm install
    popd
)
if not exist "%FRONTEND_DIR%\node_modules" (
    echo Installing frontend dependencies...
    pushd "%FRONTEND_DIR%"
    call npm install
    popd
)

echo Starting backend on port %BACKEND_PORT% ...
start "SpmjService-Backend" cmd /k "cd /d "%BACKEND_DIR%" && npm run dev"

echo Waiting for backend to come up...
timeout /t 3 /nobreak >nul

echo Starting frontend on port %FRONTEND_PORT% ...
start "SpmjService-Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo Backend:  http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo Both services are starting in separate windows. Run stop.bat to stop them.
exit /b 0

:killport
set "KP_PORT=%~1"
set "KP_LABEL=%~2"
set "KP_FOUND="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:"LISTENING" ^| findstr /R /C:":%KP_PORT% "') do (
    set "KP_FOUND=1"
    echo Port %KP_PORT% already in use by PID %%P - killing it ^(%KP_LABEL%^) ...
    taskkill /PID %%P /F >nul 2>&1
)
if not defined KP_FOUND echo Port %KP_PORT% is free.
exit /b 0
