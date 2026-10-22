@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ASTILLA MAPAL - Instalacion en Google Apps Script
echo.
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 goto NEED_NODE
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 22 ? 0 : 1)"
if errorlevel 1 goto NEED_NODE
goto INSTALL
:NEED_NODE
echo Se necesita Node.js 22 o superior para cargar los archivos automaticamente.
where winget >nul 2>nul
if errorlevel 1 goto MANUAL_NODE
winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-package-agreements --accept-source-agreements
if errorlevel 1 goto MANUAL_NODE
echo Node.js instalado. Cierre esta ventana y vuelva a abrir INSTALAR_WINDOWS.cmd.
pause
exit /b 0
:MANUAL_NODE
echo Instale Node.js LTS desde la pagina oficial y vuelva a abrir este archivo.
start "" "https://nodejs.org/en/download"
pause
exit /b 1
:INSTALL
echo Preparando las herramientas con versiones verificadas por npm...
call npm ci --include=dev --ignore-scripts
if errorlevel 1 goto FAILED
node scripts\install-apps-script.cjs
if errorlevel 1 goto FAILED
echo.
echo Finalizado. Consulte los pasos que aparecen arriba.
pause
exit /b 0
:FAILED
echo.
echo No se completo la instalacion. Conserve esta ventana para revisar el error.
pause
exit /b 1
