# ✅ Checklist de Testes Pré-Publicação - Loja Inteligente

## 📋 Status Atual do Aplicativo

### ✅ Itens Já Configurados
- ✅ Aplicativo Expo React Native configurado
- ✅ Package name definido: `com.renanduart3.vendamobile`
- ✅ Versão: 1.0.0 (versionCode: 1)
- ✅ Nome do app: "Loja Inteligente — Vendas & Estoque"
- ✅ Ícone do app presente (512x512)
- ✅ Integração Google Play Billing (react-native-iap)
- ✅ SKUs configurados (premium_monthly_plan, premium_yearly_plan)

---

## 🔴 ITENS CRÍTICOS PENDENTES

### 1. Configuração de Release Build ⚠️ URGENTE
- [ ] **Gerar keystore de produção** (upload-keystore.jks)
  ```bash
  keytool -genkeypair -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 36500
  ```
  - Mover para: `android/app/upload-keystore.jks`
  - ⚠️ **GUARDAR SENHA EM LOCAL SEGURO** (você precisará dela para sempre!)

- [ ] **Configurar signing config no build.gradle**
  - Atualizar `android/app/build.gradle` para usar o keystore de produção
  - Adicionar variáveis de ambiente ou gradle.properties

- [ ] **Testar build de release localmente**
  ```bash
  cd android && ./gradlew bundleRelease
  ```
  - Verificar se `.aab` é gerado em: `android/app/build/outputs/bundle/release/`

### 2. Política de Privacidade ⚠️ OBRIGATÓRIO
- [ ] **Criar página de Política de Privacidade**
  - Hospedar em URL pública acessível
  - Incluir informações sobre:
    - Dados coletados (vendas, estoque, financeiro)
    - Uso de dados locais (SQLite)
    - Integração com Supabase (se aplicável)
    - Google Play Billing (compras in-app)
    - Permissões solicitadas
  - Idioma: Português do Brasil

- [ ] **Adicionar link da Política de Privacidade**
  - No app.json ou nas configurações
  - Documento de referência para o Google Play Console

### 3. Screenshots e Recursos Gráficos ⚠️ OBRIGATÓRIO
- [ ] **Preparar Screenshots** (mínimo 2, máximo 8 por dispositivo)
  - Telefone: 320px - 3840px (largura ou altura)
  - Tablet (se suportado): mesmas dimensões
  - Capturar telas principais:
    - [ ] Dashboard / Tela inicial
    - [ ] Cadastro de vendas
    - [ ] Gestão de estoque
    - [ ] Relatórios financeiros
    - [ ] Tela premium

- [ ] **Feature Graphic** (1024x500px) - OBRIGATÓRIO
  - Banner promocional para a loja
  - Incluir nome do app e descrição visual

- [ ] **Ícone de alta resolução** (512x512px)
  - Já existe em: `assets/images/icon.png`
  - Verificar qualidade e adequação

### 4. Configuração Google Play Console
- [ ] **Criar aplicativo no Google Play Console**
  - Nome, idioma padrão (Português BR)
  - Categoria apropriada (Negócios/Produtividade)
  - Tipo: Aplicativo (não jogo)
  - Gratuito com compras in-app

- [ ] **Ativar Assinatura de Apps pelo Google Play**
  - Fazer upload do keystore como chave de upload

- [ ] **Configurar produtos IAP no Console**
  - Criar assinatura: `premium_monthly_plan` (R$ 9,90/mês)
  - Criar assinatura: `premium_yearly_plan` (R$ 99,90/ano)
  - Configurar descrições e períodos de teste

---

## 🧪 TESTES OBRIGATÓRIOS

### Testes Funcionais Básicos
- [ ] **Instalação e Primeiro Acesso**
  - [ ] App instala sem erros
  - [ ] Splash screen aparece corretamente
  - [ ] Tela inicial carrega sem crashes

- [ ] **Funcionalidades Principais**
  - [ ] Cadastro de produtos funciona
  - [ ] Registro de vendas funciona
  - [ ] Consulta de estoque funciona
  - [ ] Relatórios financeiros são gerados
  - [ ] Navegação entre abas funciona

- [ ] **Gestão de Dados**
  - [ ] Dados são salvos localmente (SQLite)
  - [ ] Dados persistem após fechar o app
  - [ ] Não há perda de dados em segundo plano

### Testes de Assinaturas (Internal Testing)
- [ ] **Configurar Internal Testing**
  - [ ] Fazer upload do primeiro `.aab` no track de teste interno
  - [ ] Adicionar conta de teste no Google Play Console
  - [ ] Instalar via link de internal testing

- [ ] **Fluxo de Compra**
  - [ ] Abrir tela Premium
  - [ ] Selecionar plano mensal
  - [ ] Completar compra no Google Play
  - [ ] Verificar status Premium ativo no app
  - [ ] Confirmar features premium desbloqueadas

- [ ] **Restauração de Compras**
  - [ ] Desinstalar app
  - [ ] Reinstalar e fazer login
  - [ ] Clicar em "Restaurar compras"
  - [ ] Verificar status Premium restaurado

- [ ] **Cancelamento**
  - [ ] Cancelar assinatura no Google Play
  - [ ] Verificar sincronização no app
  - [ ] Confirmar desativação de features premium

### Testes de Qualidade
- [ ] **Performance**
  - [ ] App abre em menos de 3 segundos
  - [ ] Transições suaves entre telas
  - [ ] Sem travamentos em operações normais
  - [ ] Testes em dispositivos de baixa performance

- [ ] **Compatibilidade**
  - [ ] Testar em Android 5.0+ (minSdkVersion)
  - [ ] Testar em diferentes tamanhos de tela
  - [ ] Testar em modo retrato e paisagem
  - [ ] Verificar em diferentes versões do Android

- [ ] **Rede e Conectividade**
  - [ ] App funciona offline (funcionalidades locais)
  - [ ] Sincronização funciona quando online
  - [ ] Tratamento de erros de rede
  - [ ] Timeout apropriados

### Testes de Segurança
- [ ] **Remover Console Logs de Produção**
  - [ ] Remover/comentar todos `console.log()` do código
  - [ ] Usar ferramenta de minificação
  - [ ] Verificar que dados sensíveis não são logados

- [ ] **Validação de Dados**
  - [ ] Campos obrigatórios validados
  - [ ] Prevenção de SQL injection (se aplicável)
  - [ ] Dados sensíveis não expostos

- [ ] **Permissões**
  - [ ] Apenas permissões necessárias solicitadas
  - [ ] Remover permissões não utilizadas do AndroidManifest.xml
  - [ ] Justificar permissões sensíveis

---

## 📝 CONTEÚDO DA LOJA

### Ficha da Loja (Store Listing)
- [ ] **Título do App** (máx. 30 caracteres)
  - Atual: "Loja Inteligente — Vendas & Estoque" (41 caracteres) ⚠️ REDUZIR
  - Sugestão: "Loja Inteligente - Vendas"

- [ ] **Descrição Curta** (máx. 80 caracteres)
  - [ ] Criar descrição atrativa e clara
  - Exemplo: "Gerencie vendas, estoque e finanças do seu negócio de forma simples"

- [ ] **Descrição Completa** (máx. 4000 caracteres)
  - [ ] Descrever funcionalidades principais
  - [ ] Destacar benefícios
  - [ ] Mencionar plano premium
  - [ ] Incluir chamada para ação

- [ ] **Informações de Contato**
  - [ ] E-mail de suporte
  - [ ] Website (opcional)
  - [ ] Número de telefone (opcional)

### Classificação de Conteúdo
- [ ] **Preencher Questionário IARC**
  - Responder perguntas sobre conteúdo do app
  - Obter classificação etária

### Segurança de Dados
- [ ] **Declaração de Segurança de Dados**
  - [ ] Especificar dados coletados
  - [ ] Informar uso de dados
  - [ ] Declarar compartilhamento (se houver)
  - [ ] Descrever práticas de segurança

---

## 🔧 CONFIGURAÇÕES TÉCNICAS FINAIS

### Otimizações de Build
- [ ] **Habilitar ProGuard/R8**
  - Minificação de código
  - Ofuscação (se necessário)
  - Remoção de código não utilizado

- [ ] **Reduzir Tamanho do APK/AAB**
  - [ ] App Bundles (AAB) em vez de APK
  - [ ] Habilitar code splitting
  - [ ] Comprimir recursos

- [ ] **Configurar Versionamento**
  - [ ] `versionCode`: 1 (incrementar a cada upload)
  - [ ] `versionName`: "1.0.0"

### AndroidManifest.xml
- [ ] **Revisar Permissões**
  - Atualmente declaradas:
    - `INTERNET` ✅ (necessário)
    - `READ_EXTERNAL_STORAGE` ⚠️ (verificar se necessário)
    - `WRITE_EXTERNAL_STORAGE` ⚠️ (verificar se necessário)
    - `SYSTEM_ALERT_WINDOW` ⚠️ (verificar se necessário)
    - `VIBRATE` ✅ (para feedback)

- [ ] **Remover Permissões Desnecessárias**
  - Remover permissões não utilizadas
  - Justificar permissões sensíveis no Console

---

## 📦 PROCESSO DE BUILD E UPLOAD

### 1. Build Local de Teste
```bash
# Limpar builds anteriores
cd android && ./gradlew clean

# Gerar AAB de release
./gradlew bundleRelease

# Verificar output
ls -lh app/build/outputs/bundle/release/
```

### 2. Validações Antes do Upload
- [ ] **Testar AAB Localmente**
  - Usar bundletool do Android
  - Gerar APKs do AAB
  - Instalar e testar em dispositivo real

- [ ] **Verificar Tamanho**
  - AAB deve ser < 150 MB
  - Download size otimizado

- [ ] **Análise Estática**
  - [ ] Rodar lint: `npm run lint`
  - [ ] Corrigir warnings críticos
  - [ ] Verificar código duplicado

### 3. Upload para Internal Testing
- [ ] Fazer upload do `.aab` no Google Play Console
- [ ] Adicionar release notes em português
- [ ] Configurar testadores internos
- [ ] Testar instalação via link

---

## 🎯 CHECKLIST FINAL PRÉ-PRODUÇÃO

### Antes de Promover para Produção
- [ ] Todos os testes de funcionalidade passaram
- [ ] Testes de IAP completados com sucesso
- [ ] Sem crashes ou ANRs no Internal Testing
- [ ] Feedback de testadores coletado e implementado
- [ ] Screenshots e recursos gráficos aprovados
- [ ] Descrição da loja revisada e otimizada
- [ ] Política de privacidade publicada e linkada
- [ ] Classificação de conteúdo completada
- [ ] Declaração de segurança de dados preenchida
- [ ] Build final testado em múltiplos dispositivos

### Monitoramento Pós-Lançamento
- [ ] Configurar alertas de crash no Play Console
- [ ] Monitorar reviews e responder
- [ ] Acompanhar métricas de instalação
- [ ] Verificar taxa de conversão de IAP
- [ ] Coletar feedback de usuários

---

## 📞 RECURSOS E REFERÊNCIAS

### Documentação
- [Guia de Publicação Google Play](https://developer.android.com/distribute/best-practices/launch)
- [Política de Privacidade - Requisitos](https://support.google.com/googleplay/android-developer/answer/9859455)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [React Native IAP Docs](https://react-native-iap.dooboolab.com/)

### Ferramentas
- [Google Play Console](https://play.google.com/console)
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)
- [Screenshot Generator](https://screenshots.pro/)
- [Bundletool](https://developer.android.com/studio/command-line/bundletool)

---

## ⏱️ ESTIMATIVA DE TEMPO

- **Configuração técnica (keystore, build)**: 2-3 horas
- **Criação de assets gráficos**: 4-6 horas
- **Política de privacidade**: 2-3 horas
- **Testes funcionais completos**: 8-12 horas
- **Testes de IAP no Internal Testing**: 4-6 horas
- **Configuração Google Play Console**: 3-4 horas
- **Correções pós-teste**: 4-8 horas

**Total estimado**: 27-42 horas de trabalho

---

## 🚨 BLOQUEADORES CRÍTICOS

Não é possível publicar sem:
1. ✋ Keystore de produção configurado
2. ✋ Política de privacidade pública
3. ✋ Screenshots mínimos (2 por tipo de dispositivo)
4. ✋ Feature graphic (1024x500)
5. ✋ Classificação de conteúdo
6. ✋ Declaração de segurança de dados
7. ✋ Testes de IAP completados

---

**Última Atualização**: 31 de Janeiro de 2026
**Versão do Documento**: 1.0.0
