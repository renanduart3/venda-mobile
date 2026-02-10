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
- **React Native IAP** - Compras dentro do aplicativo
- **Lucide Icons** - Biblioteca de ícones

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

## 🐛 Resolução de Problemas

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
npx expo start --clear
```

## 📄 Licença

Este projeto é privado e proprietário.

## 👨‍💻 Desenvolvedor

Desenvolvido por Renan Duarte

---

**Última atualização:** Fevereiro 2026
