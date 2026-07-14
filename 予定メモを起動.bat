@echo off
cd /d "%~dp0"
set PORT=8771

where py >nul 2>&1
if %errorlevel%==0 (
  start "" "http://127.0.0.1:%PORT%"
  py -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

where python >nul 2>&1
if %errorlevel%==0 (
  start "" "http://127.0.0.1:%PORT%"
  python -m http.server %PORT% --bind 127.0.0.1
  goto :eof
)

echo Pythonが見つからないため起動できませんでした。
pause
