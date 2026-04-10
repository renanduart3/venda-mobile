# 🛍️ Venda Mobile — Loja Inteligente

Aplicativo mobile de gestão de vendas desenvolvido com React Native e Expo.

Plataforma suportada atualmente: **Android**.

---

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)
- [Android Studio](https://developer.android.com/studio)
- [Java JDK](https://www.oracle.com/java/technologies/downloads/) 17+
- [Ruby](https://www.ruby-lang.org/) + [Bundler](https://bundler.io/) — para Fastlane
- [Fastlane](https://fastlane.tools/) — para builds e publicação

---

## 🚀 Desenvolvimento

### 1. Instale as dependências

```bash
yarn install
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=seu_web_client_id.apps.googleusercontent.com
```

Onde encontrar:
- **Supabase URL/Key:** Dashboard → Settings → API
- **Google Web Client ID:** [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Web Client

### 3. Inicie o servidor de desenvolvimento

```bash
yarn dev
```

### 4. Rode no dispositivo (debug)

```bash
yarn android
```

> **Dica:** use um dispositivo físico com USB Debugging ativado para testar recursos nativos (Google Sign-In, IAP).

---

## 🔨 Builds de Produção com Fastlane

O projeto usa **Fastlane** para automatizar builds e publicação na Google Play. Todas as lanes ficam em `fastlane/Fastfile`.

### Pré-requisitos do Fastlane

```bash
# Instale as gems necessárias (uma vez)
bundle install
```

Certifique-se de ter o arquivo `fastlane/Appfile` configurado com:
- `package_name` — ID do pacote (`com.renanduart3.vendamobile`)
- `json_key_file` — caminho para a service account do Google Play

---

### Lanes disponíveis

#### `internal_test` — Build + Internal Testing (Play Store)

Incrementa versão, gera o AAB release e sobe para a faixa **Internal Testing** como rascunho.

```bash
bundle exec fastlane internal_test
```

O que acontece internamente:
1. Incrementa `versionCode` e `versionName` em `app.json` e `build.gradle`
2. Limpa cache CMake (`android/app/.cxx`)
3. Roda `./gradlew bundleRelease`
4. Faz upload para o Play Store como Internal Testing (draft)

---

#### `deploy_production` — Build + Produção (Play Store)

Igual ao `internal_test`, mas sobe para a faixa de **produção**.

```bash
bundle exec fastlane deploy_production
```

> ⚠️ Use somente após validar a build na Internal Testing.

---

### Build local apenas (sem upload)

Se quiser gerar o AAB sem fazer upload:

```bash
cd android
./gradlew bundleRelease
cd ..
```

O arquivo gerado fica em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### APK de debug (instalação direta)

```bash
cd android
./gradlew assembleDebug
cd ..
# Instala no dispositivo conectado:
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔑 Configuração da Keystore

A keystore de release deve estar configurada em `android/app/build.gradle` e `android/gradle.properties`.

Para criar uma nova keystore:

```bash
keytool -genkey -v -keystore android/app/release.keystore \
  -alias release -keyalg RSA -keysize 2048 -validity 10000
```

Para obter o SHA-1 da keystore de debug (necessário para Google Sign-In):

```bash
keytool -list -v -keystore android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
```

---

## 🗄️ Configuração do Banco de Dados (Supabase)

O Supabase é usado **somente para autenticação e controle de assinaturas**. Todos os dados de negócio (vendas, produtos, clientes) ficam no SQLite local.

### Setup:

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Acesse **SQL Editor → New Query**
3. Execute `supabase/setup-database.sql`

O script cria:
- Tabelas: `iap_status`, `early_adopter_config`
- Functions: `get_early_adopter_status()`, `claim_early_adopter_slot()`, `check_early_adopter_available()`
- Policies RLS, índices e triggers

### Verificar setup:

```sql
SELECT * FROM get_early_adopter_status();
SELECT check_early_adopter_available();
SELECT * FROM early_adopter_config;
```

---

## 📱 Funcionalidades

### Gratuito

| Recurso | Descrição |
|---|---|
| Cadastro de produtos | Produtos e serviços com custo, preço, estoque e código de barras |
| Cadastro de clientes | Nome, telefone, WhatsApp, e-mail |
| Vendas | Modo carrinho e venda avulsa |
| Histórico de vendas | Vendas do dia com totais |
| Fiado / débito | Controle de dívidas por cliente |
| Financeiro | Controle de despesas e receitas |
| Tema claro/escuro | Personalização de interface |
| **Calculadora de Markup** | Calcula preço de venda, margem, markup e ponto de equilíbrio |

### Premium

| Recurso | Descrição |
|---|---|
| Backup de dados | Exportação manual dos dados |
| Restauração | Importação de backup |
| Relatórios PDF | Relatórios detalhados exportáveis |
| Inteligência de negócio | Análises avançadas de vendas e margem |
| Edição de vendas | Editar vendas já realizadas |
| Recibo via WhatsApp | Envio de comprovante direto para o cliente |
| Cobrança via WhatsApp | Mensagem de cobrança para clientes com dívida |
| **PIX QR Code em vendas** | Gera QR Code PIX no momento da venda (Avulsa e Carrinho) |
| **PIX QR Code em cobranças** | Gera QR Code PIX para cobrar dívidas de clientes |

---

## 💳 Sistema de Assinaturas (IAP)

O sistema de pagamentos usa **Google Play Billing** via `react-native-iap`.

### Product IDs (Google Play Console)

| SKU | Preço EA | Preço Regular |
|---|---|---|
| `premium_monthly_plan` | R$ 9,90/mês | R$ 25,00/mês |
| `premium_yearly_plan` | R$ 99,00/ano | R$ 199,00/ano |

> IAP **só funciona em builds de produção** via Internal Testing. Nunca funciona em desenvolvimento local.

### Arquivos relevantes

- `lib/iap.ts` — Lógica de compra e validação
- `lib/subscriptions.ts` — Definição dos planos e features
- `lib/premium.ts` — Cache e verificação de status premium (TTL 24h)
- `app/planos.tsx` — Tela de planos com Early Adopter banner

### Sistema Early Adopter

Os primeiros **1.000 usuários** pagam o preço de lançamento para sempre (enquanto mantiverem a assinatura ativa).

- Contador inicia em seed definido em `PRICING.INITIAL_FAKE_COUNT`
- Rastreado em `early_adopter_config` no Supabase com Realtime
- Cache local de 1h para minimizar requisições ao banco

---

## 🔐 Google Sign-In (Nativo)

O app usa `@react-native-google-signin/google-signin` com `supabase.auth.signInWithIdToken` — **sem WebView, sem URL estranha**.

### Configuração necessária:

1. [Google Cloud Console](https://console.cloud.google.com) → criar projeto ou usar existente
2. Criar **Android OAuth Client** com SHA-1 do keystore de debug/release
3. Criar **Web OAuth Client** (usado pelo Supabase)
4. Baixar/criar `android/app/google-services.json` com os IDs do projeto
5. Definir `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` no `.env`
6. Habilitar Google Provider no Supabase Dashboard → Authentication

---

## 🧮 Calculadora de Markup

Tela dedicada acessível pela tela de Produtos (botão 🧮 na barra de controles ou em cada produto).

**Recursos:**
- Dois modos: calcular preço a partir da margem, ou calcular margem a partir do preço
- Pré-preenchimento automático ao abrir de um produto específico
- Ponto de equilíbrio: quantas unidades vender por mês para cobrir custos fixos
- Dicas contextuais sobre qualidade da margem

---

## 📂 Estrutura do Projeto

```
venda-mobile/
├── app/
│   ├── (tabs)/           # Telas principais (Vendas, Produtos, Clientes, Finanças, Dashboard)
│   ├── calculadora-markup.tsx
│   ├── cliente-detalhe.tsx
│   ├── planos.tsx
│   ├── login.tsx
│   └── settings.tsx
├── components/           # Componentes reutilizáveis (UI, Header, Card, etc.)
├── contexts/             # AuthContext, ThemeContext, NotificationContext
├── lib/
│   ├── db.ts             # SQLite (dados locais)
│   ├── data-loader.ts    # Carregamento de dados do SQLite
│   ├── pix.ts            # Geração de payload PIX (EMV / Banco Central)
│   ├── premium.ts        # Verificação e cache de status premium
│   ├── iap.ts            # Compras in-app (Google Play Billing)
│   ├── subscriptions.ts  # Definição de planos e features
│   ├── early-adopters.ts # Sistema de vagas e preços de lançamento
│   └── export.ts         # Exportação de dados e relatórios PDF
├── fastlane/
│   ├── Fastfile          # Lanes de build e publicação
│   └── Appfile           # Configuração do pacote e credenciais
├── android/              # Código nativo Android
├── supabase/             # Functions e setup do banco
└── assets/               # Imagens e fontes
```

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| React Native + Expo | Framework mobile |
| TypeScript | Tipagem estática |
| Expo Router | Navegação baseada em arquivos |
| SQLite (expo-sqlite) | Banco de dados local (todos os dados de negócio) |
| Supabase | Autenticação + controle de assinaturas |
| React Native IAP | Google Play Billing |
| `@react-native-google-signin` | Login nativo com Google |
| `react-native-qrcode-svg` | Geração de QR Code PIX |
| Lucide Icons | Ícones |
| Fastlane | Automação de builds e publicação |

---

## 🐛 Resolução de Problemas

### Limpeza geral

```bash
yarn cache clean
rm -rf node_modules
yarn install
```

### Erro no build Android

```bash
cd android
./gradlew clean
cd ..
yarn android
```

### Cache CMake (erro de compilação nativa)

```bash
rm -rf android/app/.cxx
```

### Metro bundler

```bash
yarn start --clear
```

### DEVELOPER_ERROR no Google Sign-In

O SHA-1 cadastrado no Google Cloud Console não corresponde ao keystore usado. Obtenha o SHA-1 correto:

```bash
keytool -list -v -keystore android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
```

E atualize o Android OAuth Client no Google Cloud Console.

---

## 📄 Licença

Projeto privado e proprietário.

## 👨‍💻 Desenvolvedor

Desenvolvido por Renan Duarte

---

**Última atualização:** Abril 2026
