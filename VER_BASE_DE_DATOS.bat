@echo off
chcp 65001 >nul
title Base de Datos - Minimarket "El Surtidor"
cd /d "%~dp0"
echo ============================================================
echo    EXPLORADOR DE LA BASE DE DATOS  (Prisma Studio)
echo    Sistema "El Surtidor" - UNIFRANZ
echo ============================================================
echo.
echo  Abriendo el explorador visual de la base de datos...
echo  Se abrira en  ->  http://localhost:5555
echo  Veras todas las tablas (Usuario, Producto, Venta, etc.)
echo  con sus datos reales.
echo.
echo  Para CERRAR: cierra esta ventana.
echo.
start "" cmd /c "timeout /t 4 >nul & start """" http://localhost:5555"
call npx prisma studio
