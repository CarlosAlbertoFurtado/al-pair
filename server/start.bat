@echo off
setlocal enabledelayedexpansion
echo.
echo ============================================
echo   AuPairConnect - Iniciando Backend
echo ============================================
echo.

cd /d "%~dp0"

:: 1. Verifica se Docker esta rodando
docker info >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Docker Desktop nao esta rodando.
  echo        Abra o Docker Desktop e execute este script novamente.
  pause
  exit /b 1
)

:: 2. Sobe PostgreSQL + Redis
echo [1/4] Subindo PostgreSQL e Redis...
docker compose up -d
if errorlevel 1 (
  echo [ERRO] Falha ao iniciar containers Docker.
  pause
  exit /b 1
)

:: 3. Aguarda PostgreSQL ficar pronto (ate 60s)
echo [2/4] Aguardando PostgreSQL ficar pronto...
set /a attempts=0
:wait_pg
set /a attempts+=1
docker exec aupairconnect-postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
  if !attempts! geq 30 (
    echo [ERRO] PostgreSQL nao respondeu apos 60 segundos.
    pause
    exit /b 1
  )
  timeout /t 2 /nobreak >nul
  goto wait_pg
)
echo       PostgreSQL OK!

:: 4. Aplica schema do banco
echo [3/4] Sincronizando schema do banco...
call npx prisma db push --skip-generate >nul 2>&1
call npx prisma generate >nul 2>&1

:: 5. Inicia servidor de desenvolvimento
echo [4/4] Iniciando API na porta 3001...
echo.
echo   Health: http://localhost:3001/api/health
echo   Login de teste: demo@aupair.com / Demo123!
echo.
npm run dev
