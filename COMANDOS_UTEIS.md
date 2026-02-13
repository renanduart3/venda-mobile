# 🚀 COMANDOS ÚTEIS - GUIA RÁPIDO

## 📱 Rodar o Projeto

### Modo Desenvolvimento (Expo Go)
```bash
# Iniciar o servidor de desenvolvimento
npm run dev
# OU
yarn dev
# OU
npx expo start

# Limpar cache e iniciar
npx expo start --clear
```

### Rodar no Android (Modo Nativo)
```bash
# Usando npm
npm run android

# Usando yarn (RECOMENDADO)
yarn android

# Usando expo diretamente
npx expo run:android

# Com cache limpo
npx expo run:android --no-build-cache
```

### Rodar no iOS (apenas macOS)
```bash
npm run ios
# OU
yarn ios
```

## 🧹 Limpeza de Cache

### Limpar cache do Metro Bundler
```bash
npx expo start --clear
```

### Limpar cache do npm/yarn
```bash
# npm
npm cache clean --force

# yarn
yarn cache clean
```

### Limpar builds Android
```bash
# Usar o script criado
limpar-builds.bat

# OU manualmente
cd android
gradlew.bat clean
cd ..
```

### Limpeza completa (quando nada funciona)
```bash
# 1. Limpar node_modules
rmdir /s /q node_modules

# 2. Limpar cache
npm cache clean --force
# OU
yarn cache clean

# 3. Reinstalar dependências
npm install
# OU
yarn install

# 4. Limpar builds Android
limpar-builds.bat

# 5. Iniciar com cache limpo
npx expo start --clear
```

## 🔨 Build de Produção

### Gerar AAB para Play Store
```bash
# Usar o script criado
gerar-build.bat

# OU manualmente
cd android
gradlew.bat clean bundleRelease
cd ..
```

### Gerar APK de Debug
```bash
cd android
gradlew.bat assembleDebug
cd ..
```

## 📦 Gerenciamento de Dependências

### Instalar dependências
```bash
npm install
# OU
yarn install
```

### Adicionar nova dependência
```bash
npm install nome-do-pacote
# OU
yarn add nome-do-pacote
```

### Atualizar dependências
```bash
npm update
# OU
yarn upgrade
```

## 🐛 Resolução de Problemas

### Erro: "Cannot find module"
```bash
# 1. Limpar node_modules
rmdir /s /q node_modules

# 2. Reinstalar
yarn install

# 3. Limpar cache e rodar
npx expo start --clear
```

### Erro: "Metro bundler error"
```bash
npx expo start --clear
```

### Erro: "Android build failed"
```bash
# 1. Limpar builds
limpar-builds.bat

# 2. Limpar gradle
cd android
gradlew.bat clean
cd ..

# 3. Tentar novamente
yarn android
```

### Erro: "Port already in use"
```bash
# Matar processo na porta 8081
npx kill-port 8081

# OU especificar outra porta
npx expo start --port 8082
```

## 🔍 Verificação

### Ver versão do Expo
```bash
npx expo --version
```

### Ver versão do Node
```bash
node --version
```

### Ver versão do npm/yarn
```bash
npm --version
yarn --version
```

### Verificar status do Git
```bash
git status
```

## 📱 Comandos Android Específicos

### Listar dispositivos conectados
```bash
adb devices
```

### Instalar APK manualmente
```bash
adb install caminho/para/app.apk
```

### Ver logs do Android
```bash
adb logcat
```

### Limpar dados do app
```bash
adb shell pm clear com.renanduart3.vendamobile
```

## ⚡ Atalhos Rápidos

Quando o servidor Expo estiver rodando, você pode usar:

- **`a`** - Abrir no Android
- **`i`** - Abrir no iOS (apenas macOS)
- **`w`** - Abrir no navegador
- **`r`** - Recarregar app
- **`m`** - Alternar menu
- **`j`** - Abrir debugger
- **`c`** - Limpar cache do Metro

## 🎯 Comandos Mais Usados (Resumo)

```bash
# Desenvolvimento diário
yarn dev                    # Iniciar servidor
yarn android               # Rodar no Android

# Quando algo não funciona
npx expo start --clear     # Limpar cache e rodar
limpar-builds.bat          # Limpar builds Android

# Antes de publicar
preparar-publicacao.bat    # Organizar repositório
gerar-build.bat           # Gerar AAB
```

## ❌ COMANDOS INCORRETOS (NÃO USE)

```bash
# ❌ ERRADO
npx run android -c         # Comando não existe
npm android                # Falta o "run"
expo android               # Falta o "run:"

# ✅ CORRETO
npm run android
yarn android
npx expo run:android
```

---

**Dica**: Salve este arquivo nos favoritos para consulta rápida!
