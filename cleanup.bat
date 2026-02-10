@echo off
echo Limpando arquivos desnecessarios...

if exist temp.bin (
    del /f temp.bin
    echo - Removido: temp.bin
)

if exist tmp.patch (
    del /f tmp.patch
    echo - Removido: tmp.patch
)

if exist fix-utf8.js (
    del /f fix-utf8.js
    echo - Removido: fix-utf8.js
)

if exist codemagic.yaml (
    del /f codemagic.yaml
    echo - Removido: codemagic.yaml
)

if exist .bolt (
    rmdir /s /q .bolt
    echo - Removido: .bolt/
)

if exist dist (
    rmdir /s /q dist
    echo - Removido: dist/
)

if exist scripts (
    rmdir /s /q scripts
    echo - Removido: scripts/
)

echo.
echo Limpeza concluida!
echo.
echo NOTA: A pasta 'docs/' foi preservada pois contem documentacao tecnica relevante.
pause
