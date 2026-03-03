# 🛍️ Loja Inteligente Mobile

Aplicativo mobile de gestão de vendas desenvolvido com React Native e Expo.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Yarn](https://yarnpkg.com/) (gerenciador de pacotes)
- [Git](https://git-scm.com/)
- [Android Studio](https://developer.android.com/studio) (para desenvolvimento Android)
- [Java JDK](https://www.oracle.com/java/technologies/downloads/) (versão 17 ou superior)

## 🚀 Como Rodar o Projeto

### 1. Clone o repositório (se ainda não tiver)

```bash
git clone <url-do-repositorio>
cd venda-mobile
```

### 2. Instale as dependências

```bash
yarn install
```

ou

```bash
npm install
```

### 3. Inicie o servidor de desenvolvimento

```bash
yarn dev
```

ou

```bash
npm run dev
```

### 4. Execute no dispositivo/emulador

Após iniciar o servidor de desenvolvimento, você pode:

- **Escanear o QR Code** com o aplicativo Expo Go no seu celular
- **Pressionar 'a'** no terminal para abrir no emulador Android
- **Pressionar 'i'** no terminal para abrir no simulador iOS (apenas macOS)

## 📱 Executar no Android (Modo Desenvolvimento)

Para executar diretamente no Android sem o Expo Go:

```bash
yarn android
```

ou

```bash
npm run android
```

## 🔨 Gerar Build de Produção (Android)

### Opção 1: Usando o script automatizado

Execute o arquivo batch na raiz do projeto:

```bash
gerar-build.bat
```

Este script irá:
- Limpar builds anteriores
- Gerar o arquivo AAB (Android App Bundle) para publicação na Play Store
- O arquivo será gerado em: `android/app/build/outputs/bundle/release/app-release.aab`

### Opção 2: Comando manual

```bash
cd android
gradlew.bat clean bundleRelease
cd ..
```

## 🔑 Configuração da Keystore

Se você ainda não possui uma keystore para assinar o aplicativo:

```bash
criar-keystore.bat
```

Siga as instruções no terminal para criar sua keystore. **Importante:** Guarde as senhas em local seguro!

## 📂 Estrutura do Projeto

```
venda-mobile/
├── app/              # Telas do aplicativo (Expo Router)
├── components/       # Componentes reutilizáveis
├── contexts/         # Contextos React (tema, autenticação, etc)
├── hooks/            # Custom hooks
├── lib/              # Bibliotecas e utilitários
├── assets/           # Imagens, fontes e outros recursos
├── android/          # Código nativo Android
└── supabase/         # Configurações do Supabase
```

## 🛠️ Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma para desenvolvimento React Native
- **TypeScript** - Superset JavaScript com tipagem estática
- **Expo Router** - Navegação baseada em arquivos
- **SQLite** - Banco de dados local
- **Supabase** - Backend, autenticação e banco PostgreSQL
- **React Native IAP** - Compras dentro do aplicativo
- **Lucide Icons** - Biblioteca de ícones

## 🗄️ Configuração do Banco de Dados (Supabase)

O app usa Supabase para armazenar dados de assinaturas e controle de early adopters.

### Setup Rápido:

1. **Crie uma conta no Supabase:** https://supabase.com
2. **Crie um novo projeto**
3. **Execute o script de setup:**
   - Acesse: Dashboard → SQL Editor → New Query
   - Copie todo o conteúdo de `supabase/setup-database.sql`
   - Cole no editor e clique em "Run"
4. **Configure as variáveis de ambiente** (veja seção abaixo)

O script `setup-database.sql` cria:
- Tabelas: `iap_status`, `early_adopter_config`
- Functions: `get_early_adopter_status()`, `claim_early_adopter_slot()`, `check_early_adopter_available()`
- Policies de segurança (RLS)
- Índices e triggers
- Views para consultas

### Testar o Setup:

```sql
-- Verificar status do programa early adopter
SELECT * FROM get_early_adopter_status();

-- Verificar se há vagas
SELECT check_early_adopter_available();

-- Ver configuração atual
SELECT * FROM early_adopter_config;
```

## 📝 Scripts Disponíveis

- `yarn dev` - Inicia o servidor de desenvolvimento
- `yarn android` - Executa no Android
- `yarn ios` - Executa no iOS (apenas macOS)
- `yarn build:android:release` - Gera build de produção Android
- `yarn lint` - Executa o linter

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

**Onde encontrar essas informações:**
- Acesse seu projeto no Supabase Dashboard
- Clique em ⚙️ Settings → API
- Copie o **Project URL** → EXPO_PUBLIC_SUPABASE_URL
- Copie o **anon/public key** → EXPO_PUBLIC_SUPABASE_ANON_KEY

## 📱 Funcionalidades

- ✅ Gestão de vendas
- ✅ Controle de estoque
- ✅ Cadastro de produtos
- ✅ Cadastro de clientes
- ✅ Relatórios avançados (Premium)
- ✅ Múltiplos meios de pagamento
- ✅ Tema claro/escuro
- ✅ Backup e sincronização
- ✅ Compras in-app (remoção de anúncios)

## � Publicação na Google Play Store

### 📚 Documentação Completa

Documentação completa para publicação está em: **[docs/publicacao/](docs/publicacao/)**

**👉 Comece aqui:** [docs/publicacao/COMECE_AQUI.md](docs/publicacao/COMECE_AQUI.md)

Outros guias:
- ✅ [CHECKLIST.md](docs/publicacao/CHECKLIST.md) - Acompanhe seu progresso
- 💎 [CONFIGURACAO_PRODUTOS_IAP.md](docs/publicacao/CONFIGURACAO_PRODUTOS_IAP.md) - Config Google Play
- 📝 [TEXTOS_GOOGLE_PLAY.md](docs/publicacao/TEXTOS_GOOGLE_PLAY.md) - Textos prontos

### 💳 In-App Purchases (IAP)

O sistema de pagamentos está **100% implementado** e pronto para uso:

- ✅ Código IAP completo ([lib/iap.ts](lib/iap.ts))
- ✅ Gerenciamento de assinaturas ([lib/subscriptions.ts](lib/subscriptions.ts))
- ✅ **Sistema Early Adopter** ([lib/early-adopters.ts](lib/early-adopters.ts))
- ✅ UI de planos premium ([app/planos.tsx](app/planos.tsx))
- ✅ Product IDs configurados:
  - `premium_monthly_plan` - R$ 9,90/mês (primeiros 300) → R$ 19,99/mês (após)
  - `premium_yearly_plan` - R$ 99,90/ano (primeiros 300) → R$ 199,99/ano (após)

#### 🎯 Sistema Early Adopter

O app implementa um sistema de preços escalonado:

- **Primeiros 300 usuários:** Pagam preço de lançamento (R$ 9,90/mês ou R$ 99,90/ano)
- **Após 300 usuários:** Preço aumenta 90% (R$ 19,99/mês ou R$ 199,99/ano)
- **Garantia vitalícia:** Early adopters mantêm o preço de lançamento para sempre
- **Contador:** Inicia em 20 (seed) e incrementa até 320 (300 vagas reais)
- **Rastreamento:** Sistema Supabase com tabela `early_adopter_config` e funções SQL

Implementação completa em:
- `lib/early-adopters.ts` - Lógica de negócio e verificação de vagas
- `supabase/setup-database.sql` - Script de setup completo do banco
- `app/planos.tsx` - UI com contador e badges de preço

**Atenção:** IAP só funciona em builds de produção via Internal Testing. Nunca funciona em desenvolvimento local!
- Anual: R$ 99,90 → **R$ 9,99/ano**
- Desconto mantido enquanto assinatura ativa
- Sistema completo de rastreamento no Supabase

📖 Documentação completa: [EARLY_ADOPTER_SYSTEM.md](docs/publicacao/EARLY_ADOPTER_SYSTEM.md)

**Atenção:** IAP só funciona em builds de produção via Internal Testing. Nunca funciona em desenvolvimento local!

## �🐛 Resolução de Problemas

### Erro ao instalar dependências

```bash
# Limpe o cache do yarn
yarn cache clean

# Ou do npm
npm cache clean --force

# Reinstale as dependências
rm -rf node_modules
yarn install
```

### Erro no build Android

```bash
# Limpe o projeto Android
cd android
gradlew.bat clean
cd ..

# Reconstrua
yarn android
```

### Erro "Metro bundler"

```bash
# Limpe o cache do Metro
expo start --clear
```

## 📄 Licença

Este projeto é privado e proprietário.

## 👨‍💻 Desenvolvedor

Desenvolvido por Renan Duarte

---

**Última atualização:** Fevereiro 2026
