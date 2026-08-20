@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%Backend"
set "FRONTEND_DIR=%ROOT%Frontend"
set "BACKEND_PORT=5000"
set "FRONTEND_PORT=5173"

echo ==========================================
echo   SPMJ Foundation - Stopping
echo ==========================================

call :closewindow "%BACKEND_DIR%" backend
call :closewindow "%FRONTEND_DIR%" frontend

call :killport %BACKEND_PORT% backend
call :killport %FRONTEND_PORT% frontend

echo Done.
exit /b 0

REM Finds the cmd.exe window that start.bat launched for this service by matching
REM its command line (it was started with "cd /d <dir> && npm run dev"), then kills
REM it and its child tree. This is NOT done by window title: on Windows 11 with
REM Windows Terminal set as the default terminal app, `start "Title" cmd /k ...`
REM opens as a TAB inside Windows Terminal rather than its own top-level window, so
REM a WINDOWTITLE-based taskkill would match WindowsTerminal.exe itself and could
REM close the whole terminal (all tabs) instead of just this one dev server.
REM Matching by command line is safe regardless of how the window is hosted.
:closewindow
set "KW_DIR=%~1"
set "KW_LABEL=%~2"
for /f "usebackq delims=" %%P in (`powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'cmd.exe' -and $_.CommandLine -like '*%KW_DIR%*npm run dev*' } | Select-Object -ExpandProperty ProcessId"`) do (
    echo Closing %KW_LABEL% window ^(PID %%P^) ...
    taskkill /PID %%P /T /F >nul 2>&1
)
exit /b 0

:killport
set "KP_PORT=%~1"
set "KP_LABEL=%~2"
set "KP_FOUND="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:"LISTENING" ^| findstr /R /C:":%KP_PORT% "') do (
    set "KP_FOUND=1"
    echo Stopping %KP_LABEL% on port %KP_PORT% ^(PID %%P^) ...
    taskkill /PID %%P /F >nul 2>&1
)
if not defined KP_FOUND echo Nothing running on port %KP_PORT%.
exit /b 0
