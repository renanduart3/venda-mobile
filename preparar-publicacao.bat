@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   PREPARACAO COMPLETA PARA PUBLICACAO
echo   Venda Mobile App
echo ========================================
echo.

cd /d "c:\Users\renan\Desktop\project\venda-mobile"

echo Este script ira:
echo 1. Limpar builds antigos
echo 2. Organizar o repositorio Git
echo 3. Sincronizar com o remoto
echo.
echo Pressione qualquer tecla para continuar ou Ctrl+C para cancelar...
pause > nul
echo.

echo ========================================
echo   ETAPA 1/2: LIMPEZA DE BUILDS
echo ========================================
echo.

call limpar-builds.bat
if errorlevel 1 (
    echo ERRO na limpeza de builds!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ETAPA 2/2: ORGANIZACAO DO REPOSITORIO
echo ========================================
echo.

call organizar-repositorio.bat
if errorlevel 1 (
    echo ERRO na organizacao do repositorio!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   PREPARACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo Proximos passos:
echo 1. Gerar build de producao: gerar-build.bat
echo 2. Consultar CHECKLIST_PUBLICACAO.md
echo 3. Configurar Google Play Console
echo.
pause
