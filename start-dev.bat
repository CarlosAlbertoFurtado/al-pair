@echo off
echo.
echo ============================================
echo   AuPairConnect - Ambiente Completo
echo ============================================
echo.

cd /d "%~dp0"

:: Backend (Docker + API) em nova janela
start "AuPairConnect API" cmd /k "cd /d "%~dp0server" && call start.bat"

:: Aguarda backend subir
timeout /t 8 /nobreak >nul

:: Frontend em nova janela
start "AuPairConnect Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001/api/health
echo.
echo Login de teste: demo@aupair.com / Demo123!
echo.
pause
