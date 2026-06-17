@echo off
chcp 65001 >nul
title Sistema de Gestion para Minimarkets - "El Surtidor"
cd /d "%~dp0"
echo ============================================================
echo    SISTEMA DE GESTION PARA MINIMARKETS  -  "El Surtidor"
echo    UNIFRANZ - Ingenieria en Sistemas - Gestion 2026
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [!] No se encontro Node.js en esta PC.
  echo      Instalalo desde:  https://nodejs.org   ^(version LTS^)
  echo      Luego vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b
)

if not exist "node_modules\" (
  echo  [1/4] Instalando dependencias ^(1-3 min la primera vez^)...
  call npm install
)

if not exist "node_modules\.prisma\client\" (
  echo  [2/4] Generando cliente de base de datos...
  call npx prisma generate
)

if not exist "prisma\dev.db" (
  echo  [3/4] Creando base de datos con datos de ejemplo...
  call npx prisma db push
  call node prisma/seed.mjs
)

if not exist ".next\BUILD_ID" (
  echo  [4/4] Compilando la aplicacion ^(~15s^)...
  call npm run build
)

echo.
echo  Iniciando servidor...  ->  http://localhost:3000
echo  El navegador se abrira automaticamente.
echo  Para DETENER el sistema: cierra esta ventana.
echo.
start "" cmd /c "timeout /t 5 >nul & start """" http://localhost:3000"
call npm run start
