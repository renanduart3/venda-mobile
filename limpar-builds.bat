@echo off
echo ========================================
echo   LIMPEZA DE ARQUIVOS DE BUILD
echo ========================================
echo.

cd /d "c:\Users\renan\Desktop\project\venda-mobile"

echo Removendo builds Android antigos...
if exist "android\app\build" (
    rmdir /s /q "android\app\build"
    echo [OK] android\app\build removido
) else (
    echo [INFO] android\app\build nao existe
)

if exist "android\build" (
    rmdir /s /q "android\build"
    echo [OK] android\build removido
) else (
    echo [INFO] android\build nao existe
)

if exist "android\.gradle" (
    rmdir /s /q "android\.gradle"
    echo [OK] android\.gradle removido
) else (
    echo [INFO] android\.gradle nao existe
)

echo.
echo Removendo arquivos APK/AAB soltos...
del /s /q *.apk 2>nul
del /s /q *.aab 2>nul
echo [OK] APK/AAB removidos

echo.
echo Removendo cache do Metro...
if exist ".expo" (
    rmdir /s /q ".expo"
    echo [OK] .expo removido
) else (
    echo [INFO] .expo nao existe
)

echo.
echo ========================================
echo   LIMPEZA CONCLUIDA!
echo ========================================
echo.
echo Arquivos de build removidos com sucesso.
echo O repositorio esta limpo e pronto para commit.
echo.
pause
