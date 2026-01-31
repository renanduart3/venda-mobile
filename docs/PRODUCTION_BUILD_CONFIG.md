# 🔧 Configuração de Build de Produção

## Configuração do Keystore

### 1. Gerar Keystore de Upload (Primeira Vez Apenas)

```bash
keytool -genkeypair -v -keystore android/app/upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 36500
```

**Durante a geração, você será solicitado a fornecer:**
- Senha do keystore (anote em local seguro!)
- Nome e sobrenome
- Nome da organização
- Cidade, estado, país

⚠️ **IMPORTANTE**: Guarde essas informações em local seguro! Você precisará delas para sempre.

### 2. Criar arquivo gradle.properties

Crie/edite o arquivo `android/gradle.properties` e adicione (substituindo pelos seus valores):

```properties
# Configuração de assinatura (NÃO COMMITAR NO GIT!)
UPLOAD_STORE_FILE=upload-keystore.jks
UPLOAD_STORE_PASSWORD=sua_senha_aqui
UPLOAD_KEY_ALIAS=upload
UPLOAD_KEY_PASSWORD=sua_senha_aqui
```

### 3. Adicionar ao .gitignore

Certifique-se de que estes arquivos estão no `.gitignore`:

```
# Keystore files
*.jks
*.keystore

# Gradle properties com senhas
android/gradle.properties
```

### 4. Atualizar build.gradle

O arquivo `android/app/build.gradle` precisa ser atualizado para usar o keystore de produção.

Adicione na seção `signingConfigs`:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (project.hasProperty('UPLOAD_STORE_FILE')) {
            storeFile file(UPLOAD_STORE_FILE)
            storePassword UPLOAD_STORE_PASSWORD
            keyAlias UPLOAD_KEY_ALIAS
            keyPassword UPLOAD_KEY_PASSWORD
        }
    }
}
```

E na seção `buildTypes`, atualize `release`:

```gradle
release {
    signingConfig signingConfigs.release
    minifyEnabled enableMinifyInReleaseBuilds
    proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    shrinkResources true
    crunchPngs true
}
```

## 🏗️ Comandos de Build

### Build Local para Testes

```bash
# Limpar builds anteriores
cd android
./gradlew clean

# Gerar AAB de release
./gradlew bundleRelease

# Verificar output
ls -lh app/build/outputs/bundle/release/app-release.aab
```

### Build com NPM Script (Windows)

Antes de executar, configure as variáveis de ambiente:

```cmd
set UPLOAD_STORE_PASSWORD=sua_senha
set UPLOAD_KEY_ALIAS=upload
set UPLOAD_KEY_PASSWORD=sua_senha
npm run build:android:release
```

### Build com NPM Script (Linux/Mac)

```bash
export UPLOAD_STORE_PASSWORD="sua_senha"
export UPLOAD_KEY_ALIAS="upload"
export UPLOAD_KEY_PASSWORD="sua_senha"
npm run build:android:release
```

## 📦 Otimizações de Build

### Habilitar Otimizações

No arquivo `android/gradle.properties`, adicione:

```properties
# Otimizações
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
android.enablePngCrunchInReleaseBuilds=true
android.enableProguardInReleaseBuilds=true
```

### Verificar Tamanho do AAB

```bash
# Ver tamanho do AAB
ls -lh android/app/build/outputs/bundle/release/app-release.aab

# Analisar conteúdo do AAB com bundletool
java -jar bundletool-all.jar build-apks --bundle=app-release.aab --output=app.apks --mode=universal
```

## 🧪 Testar AAB Localmente

### Instalar bundletool

```bash
# Download
wget https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar

# Gerar APKs universais do AAB
java -jar bundletool-all.jar build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=app.apks \
  --mode=universal

# Extrair APK
unzip app.apks -d output

# Instalar no dispositivo
adb install output/universal.apk
```

## 🔍 Verificações Pré-Upload

Antes de fazer upload para o Google Play Console:

- [ ] AAB gerado sem erros
- [ ] Tamanho do AAB < 150 MB
- [ ] Assinado com keystore de produção
- [ ] versionCode incrementado
- [ ] Testado em dispositivo real
- [ ] Sem console.logs no código
- [ ] Lint passou sem erros críticos

## 🚀 Upload para Google Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Selecione seu app
3. Vá para **Teste interno** ou **Produção**
4. Clique em **Criar nova versão**
5. Faça upload do `.aab`
6. Preencha as notas de versão
7. Clique em **Revisar versão** e depois **Iniciar lançamento**

## 🔐 Segurança do Keystore

### Backup do Keystore

⚠️ **CRÍTICO**: Faça backup do keystore em local seguro!

Se perder o keystore, você:
- Não poderá atualizar o app na loja
- Terá que publicar como novo app (perdendo todos os usuários)

**Recomendações:**
1. Fazer backup em cloud criptografado
2. Guardar cópia em HD externo
3. Anotar senhas em gerenciador de senhas
4. Compartilhar com pessoa de confiança (backup)

### Rotação de Chaves

Para migrar para assinatura pelo Google Play:
1. Vá para Google Play Console > Configuração do app > Integridade do app
2. Siga o processo de ativação de Assinatura de apps pelo Google Play
3. Faça upload do seu keystore como chave de upload

## 📊 Versionamento

### Regras de Versionamento

Sempre incrementar antes de novo upload:

```gradle
// android/app/build.gradle
defaultConfig {
    versionCode 1    // Incrementar a cada upload (1, 2, 3, ...)
    versionName "1.0.0"  // Versão semântica (MAJOR.MINOR.PATCH)
}
```

**Exemplo de sequência:**
- v1.0.0 (versionCode 1) - Lançamento inicial
- v1.0.1 (versionCode 2) - Correção de bugs
- v1.1.0 (versionCode 3) - Nova funcionalidade
- v2.0.0 (versionCode 4) - Breaking changes

## 🐛 Troubleshooting

### Erro: "No signing configs found"

**Solução:** Verifique se `gradle.properties` tem as variáveis corretas e se o keystore existe.

### Erro: "Keystore was tampered with"

**Solução:** Senha do keystore está incorreta. Verifique `UPLOAD_STORE_PASSWORD`.

### Erro: "Cannot find key with alias"

**Solução:** Alias incorreto. Verifique `UPLOAD_KEY_ALIAS`.

### Build muito grande (> 100 MB)

**Soluções:**
1. Habilitar shrinkResources
2. Remover assets não utilizados
3. Comprimir imagens
4. Usar formato WebP para imagens
5. Habilitar split APKs por arquitetura

## 📝 Checklist Rápido

Antes de cada build de produção:

```bash
# 1. Limpar
cd android && ./gradlew clean

# 2. Incrementar versionCode
# Editar android/app/build.gradle

# 3. Remover logs
# Verificar e remover console.log

# 4. Lint
cd .. && npm run lint

# 5. Build
cd android && ./gradlew bundleRelease

# 6. Verificar
ls -lh app/build/outputs/bundle/release/app-release.aab

# 7. Testar (opcional, mas recomendado)
# Usar bundletool para gerar APK e instalar
```

---

**Última Atualização**: 31 de Janeiro de 2026
