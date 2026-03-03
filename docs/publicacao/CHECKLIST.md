# ✅ CHECKLIST DE PUBLICAÇÃO - Google Play Store

Use este checklist para acompanhar seu progresso:

---

## 📋 FASE 1: Preparação (HOJE)

### Conta e Console
- [ ] Criar conta Google Play Developer ($25)
- [ ] Aguardar aprovação da conta (24-48h)
- [ ] Acessar Google Play Console pela primeira vez

### Criar Aplicativo
- [ ] Criar novo app no Console
- [ ] Nome: "Loja Inteligente — Vendas & Estoque"
- [ ] Configurar como app gratuito
- [ ] Preencher informações básicas

---

## 📋 FASE 2: Build e Upload (DIA 2)

### Gerar Build
- [ ] Instalar EAS CLI: `npm install -g eas-cli`
- [ ] Login no Expo: `eas login`
- [ ] Configurar: `eas build:configure`
- [ ] Build Android: `eas build --platform android --profile production`
- [ ] Aguardar build (15-30 min)
- [ ] Baixar arquivo AAB

### Upload no Console
- [ ] Ir em: Release → Testing → Internal testing
- [ ] Criar novo release
- [ ] Upload do AAB
- [ ] Preencher release notes
- [ ] Salvar e iniciar rollout
- [ ] **AGUARDAR 2-24H** para processamento ⏳

---

## 📋 FASE 3: Configurar IAP (DIA 3)

### Criar Produtos
⚠️ **Só após app estar em Internal Testing**

#### Produto 1: Mensal
- [ ] Ir em: Monetize → Subscriptions
- [ ] Criar subscription
- [ ] Product ID: `premium_monthly_plan` (⚠️ exato)
- [ ] Nome: Premium Mensal
- [ ] Base plan: monthly-base
- [ ] Preço: R$ 9,90
- [ ] Período: 1 month
- [ ] Salvar e **Ativar**

#### Produto 2: Anual
- [ ] Criar subscription
- [ ] Product ID: `premium_yearly_plan` (⚠️ exato)
- [ ] Nome: Premium Anual
- [ ] Base plan: yearly-base
- [ ] Preço: R$ 99,90
- [ ] Período: 12 months
- [ ] Salvar e **Ativar**

---

## 📋 FASE 4: Configurar Testes (DIA 3)

### License Testing
- [ ] Ir em: Setup → License testing
- [ ] Adicionar emails de teste (Gmail)
- [ ] Selecionar: Respond Normally
- [ ] Salvar

### Internal Testers
- [ ] Voltar em: Internal testing → Testers
- [ ] Criar lista de emails
- [ ] Adicionar os mesmos emails
- [ ] Salvar
- [ ] **Copiar Opt-in URL** 📋

---

## 📋 FASE 5: Testar no Celular (DIA 3)

### Instalação
- [ ] Abrir Opt-in URL no celular Android
- [ ] Clicar em "Become a tester"
- [ ] Baixar app da Google Play Store
- [ ] Instalar e abrir

### Teste de Compra
- [ ] Abrir tela "Planos Premium"
- [ ] Selecionar Plano Mensal
- [ ] Clicar em "Assinar Agora"
- [ ] Verificar: Tela Google Play abre?
- [ ] Verificar: Mostra "ESTA É UMA COMPRA DE TESTE"?
- [ ] Verificar: Preço correto (R$ 9,90)?
- [ ] Completar compra de teste
- [ ] Verificar: Premium ativado no app?

### Teste de Recursos
- [ ] Acessar relatórios avançados
- [ ] Exportar dados em CSV
- [ ] Testar backup de dados
- [ ] Testar "Restaurar Compras"

---

## 📋 FASE 6: Finalizar para Produção (DIA 4-5)

### Conteúdo da Loja
- [ ] Screenshots (mínimo 2, ideal 8):
  - [ ] Tela inicial (Dashboard)
  - [ ] Tela de vendas
  - [ ] Tela de produtos
  - [ ] Tela de relatórios
  - [ ] Tela de planos premium
- [ ] Ícone de alta resolução (512x512px)
- [ ] Feature graphic (1024x500px)
- [ ] Descrição curta (80 chars)
- [ ] Descrição longa (até 4000 chars)
- [ ] Categoria: Business / Productivity
- [ ] Classificação de conteúdo

### Políticas
- [ ] Criar Política de Privacidade
- [ ] Hospedar online (GitHub Pages/Vercel)
- [ ] Adicionar URL no Console
- [ ] Criar Termos de Uso (opcional)

### Configurações Finais
- [ ] Adicionar países de distribuição
- [ ] Configurar preço (Grátis)
- [ ] Revisar todas as informações
- [ ] Aceitar termos do Google Play

---

## 📋 FASE 7: Lançamento (DIA 5-7)

### Closed Testing (opcional)
- [ ] Criar track de Closed Testing
- [ ] Upload de nova build (incrementar versionCode)
- [ ] Adicionar beta testers
- [ ] Testar por 1-2 semanas

### Production Release
- [ ] Ir em: Release → Production
- [ ] Criar novo release
- [ ] Upload do AAB (versão final)
- [ ] Preencher release notes
- [ ] Revisar checklist do Google
- [ ] Enviar para revisão
- [ ] **AGUARDAR 1-7 DIAS** para aprovação 🎉

---

## 🎉 PÓS-LANÇAMENTO

### Monitoramento
- [ ] Acompanhar reviews (responder em 24h)
- [ ] Verificar crashes no Console
- [ ] Monitorar conversões de IAP
- [ ] Analisar métricas de uso

### Atualizações
- [ ] Planejar features para v1.1
- [ ] Corrigir bugs reportados
- [ ] Atualizar regularmente (1x/mês ideal)

---

## 📊 STATUS ATUAL

**Data de início:** _____________

**Fase atual:** [ ] 1  [ ] 2  [ ] 3  [ ] 4  [ ] 5  [ ] 6  [ ] 7

**Bloqueios:**
- _______________________________________________
- _______________________________________________

**Próximo passo:**
- _______________________________________________

---

## 🆘 ATALHOS IMPORTANTES

- **Google Play Console:** https://play.google.com/console
- **EAS Build:** https://expo.dev/accounts/[seu-usuario]/projects/venda-mobile/builds
- **Documentação IAP:** [GOOGLE_PLAY_IAP_SETUP.md](./GOOGLE_PLAY_IAP_SETUP.md)
- **Guia Rápido:** [COMECE_AQUI.md](./COMECE_AQUI.md)

---

**💡 Dica:** Imprima ou mantenha este arquivo aberto para ir marcando conforme avança!

**⏱️ Tempo estimado total:** 3-7 dias (considerando aprovações do Google)
