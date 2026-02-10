@echo off
echo ========================================
echo Criando Keystore de Release
echo ========================================
echo.
echo IMPORTANTE: Anote a senha que voce vai criar!
echo Voce vai precisar dela para sempre!
echo.
pause

cd /d "%~dp0android\app"

keytool -genkeypair -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 36500

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Keystore criado com sucesso!
    echo ========================================
    echo.
    echo Arquivo criado em: android\app\upload-keystore.jks
    echo.
    echo PROXIMOS PASSOS:
    echo 1. Edite o arquivo android\gradle.properties
    echo 2. Substitua TROCAR_PELA_SUA_SENHA pela senha que voce escolheu
    echo 3. Execute: npm run build:android:release
    echo.
) else (
    echo.
    echo ========================================
    echo ERRO ao criar keystore!
    echo ========================================
    echo.
    echo Verifique se o Java JDK esta instalado e no PATH
    echo.
)

pause
