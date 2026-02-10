@echo off
echo ========================================
echo Gerando Build de Release (AAB)
echo ========================================
echo.

cd /d "%~dp0android"

echo Limpando builds anteriores...
call gradlew.bat clean

echo.
echo Gerando AAB de release...
call gradlew.bat bundleRelease

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Build gerado com sucesso!
    echo ========================================
    echo.
    echo Arquivo AAB criado em:
    echo android\app\build\outputs\bundle\release\app-release.aab
    echo.
    echo Agora voce pode fazer upload desse arquivo no Google Play Console!
    echo.
) else (
    echo.
    echo ========================================
    echo ERRO ao gerar build!
    echo ========================================
    echo.
    echo Verifique:
    echo 1. Se o keystore foi criado (android\app\upload-keystore.jks)
    echo 2. Se as senhas no gradle.properties estao corretas
    echo 3. Os erros acima
    echo.
)

pause
