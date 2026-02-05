#!/bin/bash

# Script de Preparação para Produção
# Este script ajuda a verificar e preparar o app para publicação

echo "🚀 Preparando aplicativo para produção..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de problemas
ISSUES=0

# 1. Verificar console.logs
echo "📝 Verificando console.logs no código..."
CONSOLE_LOGS=$(grep -r "console.log" app/ components/ contexts/ hooks/ lib/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${RED}✗ Encontrados $CONSOLE_LOGS console.log() no código${NC}"
    echo "  Execute: grep -r 'console.log' app/ components/ contexts/ hooks/ lib/ --include='*.ts' --include='*.tsx'"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✓ Nenhum console.log encontrado${NC}"
fi
echo ""

# 2. Verificar keystore
echo "🔑 Verificando keystore de produção..."
if [ -f "android/app/upload-keystore.jks" ]; then
    echo -e "${GREEN}✓ Keystore de produção encontrado${NC}"
else
    echo -e "${RED}✗ Keystore de produção NÃO encontrado${NC}"
    echo "  Execute: keytool -genkeypair -v -keystore android/app/upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 36500"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 3. Verificar versionCode e versionName
echo "📌 Verificando versão do app..."
VERSION_CODE=$(grep "versionCode" android/app/build.gradle | grep -oE '[0-9]+')
VERSION_NAME=$(grep "versionName" android/app/build.gradle | grep -oE '"[0-9.]+"' | tr -d '"')
echo "  versionCode: $VERSION_CODE"
echo "  versionName: $VERSION_NAME"
echo ""

# 4. Verificar permissões no AndroidManifest
echo "🔐 Verificando permissões..."
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
    echo "  Permissões declaradas:"
    grep "uses-permission" "$MANIFEST" | sed 's/.*android:name="\([^"]*\)".*/    - \1/'
else
    echo -e "${RED}✗ AndroidManifest.xml não encontrado${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 5. Verificar assets
echo "🎨 Verificando assets..."
if [ -f "assets/images/icon.png" ]; then
    echo -e "${GREEN}✓ Ícone do app encontrado${NC}"
else
    echo -e "${RED}✗ Ícone do app NÃO encontrado${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 6. Verificar dependências
echo "📦 Verificando dependências..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ package.json encontrado${NC}"
    echo "  Dependências principais:"
    echo "    - expo: $(node -pe "require('./package.json').dependencies.expo")"
    echo "    - react-native-iap: $(node -pe "require('./package.json').dependencies['react-native-iap']")"
else
    echo -e "${RED}✗ package.json NÃO encontrado${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 7. Testar build
echo "🏗️  Testando build de release..."
echo "  Para testar o build, execute:"
echo "  cd android && ./gradlew bundleRelease"
echo ""

# Resumo
echo "======================================"
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Tudo pronto para produção!${NC}"
else
    echo -e "${RED}⚠️  $ISSUES problema(s) encontrado(s)${NC}"
    echo "Revise os itens acima antes de publicar."
fi
echo "======================================"
echo ""
echo "📋 Consulte docs/PRE_PUBLISH_TESTING_CHECKLIST.md para mais detalhes"
