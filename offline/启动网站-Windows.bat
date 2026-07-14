@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  start "" http://127.0.0.1:8000/
  py -3 -m http.server 8000
  goto :eof
)
where python >nul 2>&1
if %errorlevel%==0 (
  start "" http://127.0.0.1:8000/
  python -m http.server 8000
  goto :eof
)
echo 未检测到 Python 3。请先从 https://www.python.org/downloads/ 安装 Python，然后重新运行。
pause
