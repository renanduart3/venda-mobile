# 📚 ÍNDICE DE DOCUMENTAÇÃO

Este arquivo serve como índice para toda a documentação do projeto.

---

## 🚀 COMEÇAR AQUI

### Para Organizar o Repositório AGORA:
1. **Leia primeiro**: `GUIA_RAPIDO.md`
2. **Execute**: `preparar-publicacao.bat`
3. **Consulte**: `CHECKLIST_PUBLICACAO.md`

---

## 📖 DOCUMENTAÇÃO PRINCIPAL

### 1. Guias de Uso Rápido

#### `GUIA_RAPIDO.md` ⭐ **LEIA PRIMEIRO**
- Status atual do projeto
- Instruções imediatas
- Próximos passos
- Resolução de problemas

#### `RESUMO_ALTERACOES.md`
- Todas as alterações realizadas
- Análise do repositório Git
- Estado atual completo
- Próximos passos detalhados

#### `CHECKLIST_PUBLICACAO.md`
- Checklist completo para publicação
- Funcionalidades implementadas
- Configurações necessárias
- Verificações finais

---

### 2. Documentação Técnica

#### `README.md`
- Visão geral do projeto
- Pré-requisitos
- Como rodar o projeto
- Estrutura do projeto
- Tecnologias utilizadas
- Scripts disponíveis

#### `docs/IAP_INSTALLATION.md`
- Integração do react-native-iap
- Configuração de produtos
- Uso em tempo de execução
- Observações importantes

#### `docs/IAP_TEST_PLAN.md`
- Plano de testes do IAP
- Casos de teste
- Procedimentos de validação

---

## 🛠️ SCRIPTS DISPONÍVEIS

### Scripts de Preparação

#### `preparar-publicacao.bat` ⭐ **PRINCIPAL**
**O que faz**:
1. Limpa builds antigos
2. Organiza repositório Git
3. Sincroniza com remoto

**Quando usar**: Antes de gerar o build de produção

---

#### `organizar-repositorio.bat`
**O que faz**:
- Busca atualizações do remoto
- Mostra diferenças
- Oferece opções de sincronização (merge/force/reset)
- Executa git add, commit e push

**Quando usar**: Para sincronizar o repositório manualmente

---

#### `limpar-builds.bat`
**O que faz**:
- Remove `android/app/build/`
- Remove `android/build/`
- Remove `android/.gradle/`
- Remove `*.apk` e `*.aab`
- Remove cache do Metro

**Quando usar**: Antes de fazer commit ou quando houver problemas de build

---

### Scripts de Build

#### `gerar-build.bat`
**O que faz**:
- Limpa builds anteriores
- Gera AAB para Play Store
- Arquivo gerado em: `android/app/build/outputs/bundle/release/app-release.aab`

**Quando usar**: Para gerar build de produção

---

#### `criar-keystore.bat`
**O que faz**:
- Cria keystore para assinar o app
- Solicita informações necessárias
- Gera arquivo `my-upload-key.keystore`

**Quando usar**: Apenas uma vez, antes do primeiro build de produção

---

### Scripts Auxiliares

#### `cleanup.bat`
**O que faz**: Limpeza geral do projeto

#### Scripts Temporários (não commitar)
- `temp-git-check.bat`
- `git-analysis.bat`

---

## 📂 ESTRUTURA DE ARQUIVOS

```
venda-mobile/
│
├── 📚 DOCUMENTAÇÃO
│   ├── INDICE.md                    ← Você está aqui
│   ├── GUIA_RAPIDO.md              ← Comece aqui
│   ├── RESUMO_ALTERACOES.md        ← O que foi feito
│   ├── CHECKLIST_PUBLICACAO.md     ← Checklist de publicação
│   ├── README.md                    ← Documentação técnica
│   └── docs/
│       ├── IAP_INSTALLATION.md
│       └── IAP_TEST_PLAN.md
│
├── 🛠️ SCRIPTS
│   ├── preparar-publicacao.bat     ← Script principal
│   ├── organizar-repositorio.bat   ← Sincronizar git
│   ├── limpar-builds.bat           ← Limpar builds
│   ├── gerar-build.bat             ← Gerar AAB
│   └── criar-keystore.bat          ← Criar keystore
│
├── ⚙️ CONFIGURAÇÃO
│   ├── .gitignore                  ← Arquivos ignorados
│   ├── .env.example                ← Template de variáveis
│   ├── app.json                    ← Config do Expo
│   ├── package.json                ← Dependências
│   └── tsconfig.json               ← Config TypeScript
│
├── 📱 CÓDIGO FONTE
│   ├── app/                        ← Telas (Expo Router)
│   ├── components/                 ← Componentes
│   ├── contexts/                   ← Contextos React
│   ├── hooks/                      ← Custom hooks
│   ├── lib/                        ← Bibliotecas
│   │   ├── iap.ts                 ← Sistema de IAP
│   │   ├── advanced-reports.ts    ← Relatórios
│   │   └── ...
│   └── assets/                     ← Recursos
│
└── 🤖 ANDROID
    └── android/                    ← Código nativo
```

---

## 🎯 FLUXO DE TRABALHO RECOMENDADO

### Para Publicar o App:

```
1. GUIA_RAPIDO.md
   ↓
2. preparar-publicacao.bat
   ↓
3. gerar-build.bat
   ↓
4. CHECKLIST_PUBLICACAO.md
   ↓
5. Google Play Console
```

---

### Para Desenvolver:

```
1. README.md (como rodar)
   ↓
2. Desenvolvimento
   ↓
3. limpar-builds.bat (antes de commit)
   ↓
4. organizar-repositorio.bat (commit/push)
```

---

### Para Configurar IAP:

```
1. docs/IAP_INSTALLATION.md
   ↓
2. Google Play Console (criar produtos)
   ↓
3. docs/IAP_TEST_PLAN.md (testar)
```

---

## 🔍 BUSCA RÁPIDA

### "Como faço para..."

#### ...organizar o repositório?
→ Execute: `preparar-publicacao.bat`
→ Ou leia: `GUIA_RAPIDO.md`

#### ...gerar build de produção?
→ Execute: `gerar-build.bat`
→ Ou leia: `README.md` seção "Gerar Build de Produção"

#### ...publicar na Play Store?
→ Leia: `CHECKLIST_PUBLICACAO.md`

#### ...configurar IAP?
→ Leia: `docs/IAP_INSTALLATION.md`

#### ...testar IAP?
→ Leia: `docs/IAP_TEST_PLAN.md`

#### ...rodar o projeto localmente?
→ Leia: `README.md` seção "Como Rodar o Projeto"

#### ...resolver problemas de build?
→ Leia: `README.md` seção "Resolução de Problemas"
→ Execute: `limpar-builds.bat`

#### ...ver o que foi alterado?
→ Leia: `RESUMO_ALTERACOES.md`

---

## ✨ RESUMO

**Status do Projeto**: ✅ PRONTO PARA PUBLICAÇÃO

**Próxima Ação**: Execute `preparar-publicacao.bat`

**Documentação Completa**: ✅ Disponível

**Scripts de Automação**: ✅ Criados

---

**Última Atualização**: 09/02/2026
**Versão**: 1.0.0
