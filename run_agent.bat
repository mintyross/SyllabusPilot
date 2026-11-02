@echo off
cd /d "%~dp0"
call venv\Scripts\activate.bat
adk web
