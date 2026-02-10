@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   ORGANIZACAO DO REPOSITORIO
echo   Venda Mobile - Preparacao para Publicacao
echo ========================================
echo.

cd /d "c:\Users\renan\Desktop\project\venda-mobile"

echo [PASSO 1/8] Verificando estado atual do repositorio...
echo.
git status
echo.

echo [PASSO 2/8] Buscando atualizacoes do repositorio remoto...
echo.
git fetch origin
if errorlevel 1 (
    echo ERRO: Falha ao buscar atualizacoes do remoto.
    pause
    exit /b 1
)
echo Atualizacoes buscadas com sucesso!
echo.

echo [PASSO 3/8] Analisando diferencas entre local e remoto...
echo.
echo --- Commits no REMOTO que nao estao no LOCAL ---
git log HEAD..origin/master --oneline --max-count=5
echo.
echo --- Commits no LOCAL que nao estao no REMOTO ---
git log origin/master..HEAD --oneline --max-count=5
echo.

echo [PASSO 4/8] Verificando arquivos modificados...
echo.
git diff --name-status origin/master
echo.

echo ========================================
echo   DECISAO DE SINCRONIZACAO
echo ========================================
echo.
echo Escolha como deseja sincronizar:
echo.
echo [1] MERGE - Mesclar alteracoes locais e remotas (RECOMENDADO)
echo [2] FORCE PUSH - Sobrescrever remoto com local (CUIDADO!)
echo [3] RESET - Sobrescrever local com remoto (CUIDADO!)
echo [4] CANCELAR - Sair sem fazer alteracoes
echo.
set /p choice="Digite sua escolha (1-4): "

if "%choice%"=="1" goto merge
if "%choice%"=="2" goto force_push
if "%choice%"=="3" goto reset
if "%choice%"=="4" goto cancel
echo Escolha invalida!
pause
exit /b 1

:merge
echo.
echo [PASSO 5/8] Adicionando arquivos modificados...
git add .
echo.

echo [PASSO 6/8] Criando commit...
git commit -m "Preparacao para publicacao - IAP e relatorios funcionais"
echo.

echo [PASSO 7/8] Fazendo merge com origin/master...
git pull origin master --no-rebase
if errorlevel 1 (
    echo.
    echo ATENCAO: Conflitos detectados!
    echo Resolva os conflitos manualmente e execute:
    echo   git add .
    echo   git commit -m "Merge resolvido"
    echo   git push origin master
    pause
    exit /b 1
)
echo.

echo [PASSO 8/8] Enviando alteracoes para o repositorio remoto...
git push origin master
if errorlevel 1 (
    echo ERRO: Falha ao enviar alteracoes.
    pause
    exit /b 1
)
goto success

:force_push
echo.
echo ATENCAO: Isso ira SOBRESCREVER o repositorio remoto!
echo Todas as alteracoes remotas serao PERDIDAS!
echo.
set /p confirm="Tem certeza? (S/N): "
if /i not "%confirm%"=="S" goto cancel

echo.
echo [PASSO 5/8] Adicionando arquivos modificados...
git add .
echo.

echo [PASSO 6/8] Criando commit...
git commit -m "Preparacao para publicacao - IAP e relatorios funcionais"
echo.

echo [PASSO 7/8] Pulando merge (force push)...
echo.

echo [PASSO 8/8] Enviando alteracoes (FORCE PUSH)...
git push origin master --force
if errorlevel 1 (
    echo ERRO: Falha ao enviar alteracoes.
    pause
    exit /b 1
)
goto success

:reset
echo.
echo ATENCAO: Isso ira SOBRESCREVER suas alteracoes locais!
echo Todas as alteracoes locais serao PERDIDAS!
echo.
set /p confirm="Tem certeza? (S/N): "
if /i not "%confirm%"=="S" goto cancel

echo.
echo [PASSO 5/8] Resetando para origin/master...
git reset --hard origin/master
if errorlevel 1 (
    echo ERRO: Falha ao resetar.
    pause
    exit /b 1
)
echo.

echo [PASSO 6/8] Limpando arquivos nao rastreados...
git clean -fd
echo.

echo [PASSO 7/8] Pulando commit (reset completo)...
echo [PASSO 8/8] Pulando push (ja sincronizado)...
goto success

:cancel
echo.
echo Operacao cancelada pelo usuario.
pause
exit /b 0

:success
echo.
echo ========================================
echo   SINCRONIZACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo Estado final do repositorio:
git status
echo.
echo Ultimo commit:
git log -1 --oneline
echo.
echo ========================================
echo   PROXIMOS PASSOS
echo ========================================
echo.
echo 1. Verifique o CHECKLIST_PUBLICACAO.md
echo 2. Gere o build de producao: gerar-build.bat
echo 3. Configure o Google Play Console
echo 4. Configure os produtos IAP
echo 5. Submeta para revisao
echo.
echo Pressione qualquer tecla para sair...
pause > nul
