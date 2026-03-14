# 03_GESTAO_LOJAS

# 💎 CONFIGURAÇÃO DOS PRODUTOS IAP
## Google Play Console - In-App Products (Subscriptions)

Este documento contém as configurações **EXATAS** que devem ser usadas no Google Play Console para criar os produtos de assinatura.

> ⚠️ **IMPORTANTE**: Os IDs devem ser IDÊNTICOS aos do código. Qualquer diferença causará erro!

> 🎉 **SISTEMA EARLY ADOPTER**: Primeiros 300 usuários pagam R$ 9,90/mês ou R$ 99,90/ano. Após isso, o preço aumenta 90% automaticamente no Google Play Console.

---

## 📋 VISÃO GERAL DOS PRODUTOS

### Preços Early Adopter (Primeiros 300 usuários)

| Item | Plano Mensal | Plano Anual |
|------|-------------|-------------|
| **Product ID** | `premium_monthly_plan` | `premium_yearly_plan` |
| **Nome** | Premium Mensal | Premium Anual |
| **Preço Lançamento** | R$ 9,90 | R$ 99,90 |
| **Preço Regular** | R$ 19,99 | R$ 199,99 |
| **Aumento** | +90% (após 300) | +90% (após 300) |
| **Período** | 1 mês | 12 meses |
| **Economia** | R$ 10,09/mês | R$ 100,00/ano |
| **Status** | Ativo | Ativo |

> 📚 **Nota:** Os primeiros 300 usuários pagam preço de lançamento. Após isso, o preço aumenta 90% para novos usuários. Early adopters mantêm o preço original para sempre.

---

## 🔧 PRODUTO 1: PREMIUM MENSAL

### 1️⃣ Informações Básicas

```
Product ID: premium_monthly_plan
```
⚠️ **CRÍTICO**: Este ID DEVE ser exatamente como está. Não altere!

**Status:**
```
✅ Active
```

**Product Name (Visível para usuários):**
```
Premium Mensal
```

**Description:**
```
Acesso completo a todos os recursos premium por 1 mês:

✅ Relatórios avançados em PDF
✅ Backup automático na nuvem
✅ Exportação de dados em CSV
✅ Inteligência de negócios
✅ Suporte prioritário

Renovação automática mensal. Cancele quando quiser.
```

---

### 2️⃣ Configuração de Preços

**Subscription Period:**
```
1 month
```

**Base Plan ID:**
```
monthly-standard
```
(Nome sugerido, pode personalizar)

**Billing Period:**
```
Monthly (Every month)
```

**Price:**
```
Country: Brazil (BR)
Currency: BRL (R$)
Amount: 9.90
```

**Free Trial:** (Opcional)
```
❌ Desabilitado (ou habilite se quiser oferecer teste grátis)
```
- Se habilitar: Sugestão de **7 dias** grátis

**Grace Period:**
```
✅ Habilitado (recomendado)
Duration: 3 days
```
(Dá tempo ao usuário resolver problemas de pagamento)

---

### 3️⃣ Configurações Avançadas

**Auto-Renewal:**
```
✅ Enabled
```

**Prorated:**
```
✅ Yes (quando usuário trocar de plano)
```

**Purchase Type:**
```
Subscription
```

**Subscription Type:**
```
Auto-renewing subscription
```

---

## 🔧 PRODUTO 2: PREMIUM ANUAL

### 1️⃣ Informações Básicas

```
Product ID: premium_yearly_plan
```
⚠️ **CRÍTICO**: Este ID DEVE ser exatamente como está. Não altere!

**Status:**
```
✅ Active
```

**Product Name (Visível para usuários):**
```
Premium Anual - Economize 15%
```

**Description:**
```
Acesso completo a todos os recursos premium por 12 meses com desconto:

✅ Relatórios avançados em PDF
✅ Backup automático na nuvem
✅ Exportação de dados em CSV
✅ Inteligência de negócios
✅ Suporte prioritário

💰 Economize R$ 19,10 comparado ao plano mensal!

Renovação automática anual. Cancele quando quiser.
```

---

### 2️⃣ Configuração de Preços

**Subscription Period:**
```
1 year
```

**Base Plan ID:**
```
yearly-standard
```
(Nome sugerido, pode personalizar)

**Billing Period:**
```
Yearly (Every 12 months)
```

**Price:**
```
Country: Brazil (BR)
Currency: BRL (R$)
Amount: 99.90
```

**Free Trial:** (Opcional)
```
❌ Desabilitado (ou habilite se quiser oferecer teste grátis)
```
- Se habilitar: Sugestão de **14 dias** grátis (maior que mensal)

**Grace Period:**
```
✅ Habilitado (recomendado)
Duration: 7 days
```
(Prazo maior para assinatura anual)

---

### 3️⃣ Configurações Avançadas

**Auto-Renewal:**
```
✅ Enabled
```

**Prorated:**
```
✅ Yes (quando usuário trocar de plano)
```

**Purchase Type:**
```
Subscription
```

**Subscription Type:**
```
Auto-renewing subscription
```

---

## 🎯 CONFIGURAÇÕES DE ELEGIBILIDADE

### Para AMBOS os produtos:

**Device Categories:**
```
✅ Phone
✅ Tablet
```

**Eligible Territories:**
```
✅ Brazil (Obrigatório)
🔄 Portugal (Opcional, para expandir)
```

**Target SDK Version:**
```
Minimum: 21 (Android 5.0)
Target: 34 (Android 14)
```

---

## 💳 CONFIGURAÇÃO DE TESTE (License Testing)

Para testar compras SEM ser cobrado de verdade:

### Testers (License Testing)

**Adicione emails de teste:**
```
[seu-email@gmail.com]
[email-amigo@gmail.com]
```

**Tipo de Resposta:**
```
✅ License Test Response: RESPOND_NORMALLY
```

Isso permitirá:
- ✅ Fazer compras de teste sem cobrança real
- ✅ Ver a tela de pagamento do Google Play
- ✅ Testar fluxo completo de compra
- ✅ Testar renovação e cancelamento

---

## 📊 PASSO A PASSO NO CONSOLE

### Criando o Produto Mensal:

1. **Acesse:** Google Play Console → Seu App → Monetize → Subscriptions
2. **Clique:** "Create subscription"
3. **Preencha:**
   - Product ID: `premium_monthly_plan` ⚠️ (não pode mudar depois!)
   - Name: "Premium Mensal"
   - Description: [use texto acima]
4. **Configure:**
   - Base plan → Add base plan
   - Base plan ID: `monthly-standard`
   - Billing period: "1 month"
   - Price: R$ 9,90 (Brazil)
5. **Opções:**
   - ✅ Auto-renewing
   - ✅ Proration enabled
   - Grace period: 3 days
6. **Salve** e **Ative**

### Criando o Produto Anual:

1. **Clique:** "Create subscription" novamente
2. **Preencha:**
   - Product ID: `premium_yearly_plan` ⚠️ (não pode mudar depois!)
   - Name: "Premium Anual - Economize 15%"
   - Description: [use texto acima]
3. **Configure:**
   - Base plan → Add base plan
   - Base plan ID: `yearly-standard`
   - Billing period: "12 months"
   - Price: R$ 99,90 (Brazil)
4. **Opções:**
   - ✅ Auto-renewing
   - ✅ Proration enabled
   - Grace period: 7 days
5. **Salve** e **Ative**

---

## ⚠️ CHECKLIST DE VALIDAÇÃO

Antes de ativar os produtos, verifique:

- [ ] Product IDs são **EXATAMENTE**: `premium_monthly_plan` e `premium_yearly_plan`
- [ ] Preços estão corretos: R$ 9,90 e R$ 99,90
- [ ] Billing periods: 1 month e 12 months
- [ ] Auto-renewal está habilitado em ambos
- [ ] Grace period configurado
- [ ] Descrições preenchidas
- [ ] Status: **Active**
- [ ] Testers adicionados em License Testing
- [ ] Território: Brazil está habilitado

---

## 🔍 VERIFICAÇÃO NO CÓDIGO

Os Product IDs no código estão em:

**lib/iap.ts:**
```typescript
const PRODUCT_IDS = {
   MONTHLY: 'premium_monthly_plan',
   ANNUAL: 'premium_yearly_plan',
};

const SKUS = Platform.select({
   android: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL],
   default: [],
});
```

**lib/subscriptions.ts:**
```typescript
const SUBSCRIPTION_SKUS = {
  MONTHLY: 'premium_monthly_plan',
  YEARLY: 'premium_yearly_plan',
};
```

✅ **Os IDs no Console DEVEM corresponder exatamente aos IDs no código!**

---

## 🧪 TESTANDO DEPOIS DE CRIAR

Após criar os produtos no Console:

1. **Aguarde 2-4 horas** para produtos serem propagados
2. **Instale o app** do Internal Testing
3. **Faça login** com conta de teste (adicionada em License Testing)
4. **Abra a tela** de Planos no app
5. **Clique** em um plano
6. **Deve aparecer:** Tela de pagamento nativa do Google Play
7. **Complete** a compra (não será cobrado)
8. **Verifique:** Premium ativado no app

---

## 🚨 ERROS COMUNS

### ❌ "Item not found" ou "Product not available"

**Causas:**
- Product ID diferente do código
- Produto não está Active no Console
- Aguardar propagação (2-4h)
- App não foi baixado do Internal Testing

**Solução:**
1. Verifique os Product IDs (devem ser idênticos)
2. Confirme status "Active" no Console
3. Aguarde algumas horas
4. Desinstale e reinstale o app do Internal Testing

---

### ❌ "This version of the app is not configured for billing"

**Causas:**
- App instalado via `npx expo start` ou desenvolvimento local
- BILLING permission não está no AndroidManifest.xml

**Solução:**
- SEMPRE teste via Internal Testing (build production)
- Nunca teste IAP em desenvolvimento local

---

### ❌ Compra acontece mas não desbloqueia Premium

**Causas:**
- Problema na verificação de compra (código)
- AsyncStorage não está salvando

**Solução:**
1. Verifique logs do app
2. Reabra o app e aguarde a sincronização automática de assinatura
3. Verifique AsyncStorage key: `@isPremium`

---

## 📞 SUPORTE

Se tiver problemas:

1. **Verifique logs** do React Native
2. **Console do Google Play:** Veja se há erros reportados
3. **License Testing:** Confirme que email está adicionado
4. **Aguarde propagação:** Mínimo 2-4 horas após criar produto

---

## 📚 REFERÊNCIAS

- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [react-native-iap Documentation](https://github.com/dooboolab/react-native-iap)
- [Subscription Testing Guide](https://developer.android.com/google/play/billing/test)

---

**✅ Com estas configurações, o IAP funcionará corretamente!**

**📝 Última atualização:** Fevereiro 2026


# 📝 TEXTOS PRONTOS PARA GOOGLE PLAY CONSOLE

Use estes textos prontos para preencher o Google Play Console de forma rápida e profissional.

---

## 📱 INFORMAÇÕES BÁSICAS DO APP

### Nome do App
```
Vendas, Estoque e Fiado (PDV)
```

### Nome Curto (30 caracteres)
```
Vendas, Estoque e Fiado (PDV)
```

---

## 📝 DESCRIÇÕES

### Descrição Curta (80 caracteres)
```
Gestão completa de vendas, estoque e finanças para sua loja
```

### Descrição Longa (até 4000 caracteres)

```
📊 LOJA INTELIGENTE - GESTÃO COMPLETA PARA SEU NEGÓCIO

Transforme a gestão da sua loja com o Vendas, Estoque e Fiado (PDV)! Sistema completo de vendas, controle de estoque e gestão financeira, desenvolvido pensando na facilidade e praticidade para pequenos e médios negócios.

✨ PRINCIPAIS FUNCIONALIDADES

📈 DASHBOARD INTELIGENTE
• Visão geral do seu negócio em tempo real
• Acompanhe vendas diárias, receitas e despesas
• Identifique produtos com baixo estoque
• Analise os horários de pico de vendas

🛒 GESTÃO DE VENDAS
• Registre vendas rapidamente com interface intuitiva
• Associe vendas a clientes cadastrados
• Histórico completo de todas as transações
• Cálculo automático de totais e impostos

📦 CONTROLE DE ESTOQUE
• Cadastre produtos e serviços ilimitados
• Alertas de estoque mínimo
• Acompanhe movimentações de entrada e saída
• Preços e categorias personalizáveis

👥 GESTÃO DE CLIENTES
• Cadastro completo de clientes
• Histórico de compras por cliente
• Contatos e informações organizadas
• Identificação de melhores clientes

💰 CONTROLE FINANCEIRO
• Registre despesas e receitas
• Acompanhe contas a pagar e receber
• Despesas vinculadas a clientes
• Alertas de vencimento
• Relatórios financeiros mensais

📊 RELATÓRIOS DETALHADOS
• Dashboard com métricas importantes
• Gráficos de vendas e receitas
• Análise de produtos mais vendidos
• Relatórios financeiros completos
• Exportação em CSV e PDF (Premium)

💎 RECURSOS PREMIUM

Com a assinatura Premium, você desbloqueia recursos avançados:

✅ Relatórios Avançados em PDF
• Relatórios profissionais de vendas
• Análises financeiras detalhadas
• Gráficos e métricas avançadas

✅ Backup Automático
• Proteção completa dos seus dados
• Backup na nuvem automático
• Restauração fácil a qualquer momento

✅ Exportação de Dados
• Exporte relatórios em CSV
• Compartilhe dados com contador
• Integração com planilhas

✅ Inteligência de Negócios
• Insights sobre seu negócio
• Previsões de vendas
• Análise de tendências

🎯 IDEAL PARA

• Lojas de varejo
• Prestadores de serviços
• Pequenos comércios
• Microempreendedores
• Profissionais autônomos
• Negócios online
• Comércio local

🔒 SEGURANÇA E PRIVACIDADE

• Todos os dados armazenados localmente no seu dispositivo
• Opção de backup na nuvem (Premium)
• Sem compartilhamento de dados com terceiros
• Total controle sobre suas informações

📱 INTERFACE MODERNA

• Design intuitivo e fácil de usar
• Tema claro e escuro
• Totalmente em português
• Funcionamento offline

🆓 GRÁTIS COM RECURSOS ESSENCIAIS

Baixe agora e comece a usar gratuitamente! Todas as funcionalidades principais estão disponíveis sem custo. Upgrade para Premium quando precisar de recursos avançados.

🎉 PREÇO DE LANÇAMENTO - PRIMEIROS 300 USUÁRIOS

Seja um dos primeiros 300 usuários e garanta o PREÇO DE LANÇAMENTO VITALÍCIO! Pague R$ 9,90/mês ou R$ 99,90/ano e mantenha esse preço para sempre enquanto sua assinatura estiver ativa.

Após os 300 primeiros, o preço aumenta 90% (R$ 19,99/mês ou R$ 199,99/ano). Não perca!

💬 SUPORTE

Dúvidas ou sugestões? Entre em contato conosco através do app.

⭐ AVALIE O APP

Gostou? Deixe sua avaliação e ajude outros empreendedores a descobrir o Vendas, Estoque e Fiado (PDV)!

---

Desenvolvido com ♥ para pequenos e médios negócios brasileiros.
```

---

## 🏷️ CATEGORIZAÇÃO

### Categoria Principal
```
Business
```

### Categoria Secundária (se disponível)
```
Productivity
```

### Tags (palavras-chave)
```
vendas, estoque, ponto de venda, PDV, gestão, loja, comércio, financeiro, controle, negócios, MEI, empreendedor, varejo, inventário, caixa
```

---

## 📸 TEXTOS PARA SCREENSHOTS

Use estes textos como overlay nas capturas de tela:

### Screenshot 1 - Dashboard
```
Dashboard Completo
Visualize métricas importantes em tempo real
```

### Screenshot 2 - Vendas
```
Registre Vendas Rapidamente
Interface intuitiva e prática
```

### Screenshot 3 - Produtos
```
Controle Total do Estoque
Alertas de produtos em baixo estoque
```

### Screenshot 4 - Clientes
```
Gestão de Clientes
Histórico completo de compras
```

### Screenshot 5 - Finanças
```
Controle Financeiro
Despesas, receitas e relatórios
```

### Screenshot 6 - Relatórios
```
Relatórios Detalhados
Gráficos e análises do negócio
```

### Screenshot 7 - Premium
```
Recursos Premium
Backup, exportação e muito mais
```

---

## 💎 DESCRIÇÃO DOS PRODUTOS DE ASSINATURA

> 🎉 **NOTA**: Durante o lançamento (primeiros 300 usuários), use as descrições "Fase 1". Após 300 usuários, atualize os preços no Google Play Console para os valores da "Fase 2".

### Premium Mensal (FASE 1 - Primeiros 300 Usuários)

**Nome:**
```
Premium Mensal - Preço de Lançamento 🎉
```

**Descrição:**
```
🎉 PREÇO DE LANÇAMENTO - PRIMEIROS 300 USUÁRIOS!

Seja um dos primeiros 300 e garanta preço de lançamento VITALÍCIO!

✅ Relatórios avançados em PDF
✅ Backup automático na nuvem
✅ Exportação de dados em CSV
✅ Inteligência de negócios
✅ Suporte prioritário

R$ 9,90/mês - Mantenha esse preço para sempre!

Após 300 usuários, o preço aumenta para R$ 19,99/mês.

Renovação automática mensal. Cancele quando quiser.
```

**Benefícios principais:**
```
• Preço de lançamento vitalício (primeiros 300)
• Backup automático dos dados
• Relatórios profissionais em PDF
• Exportação ilimitada em CSV
• Insights de negócios avançados
```

---

### Premium Mensal (FASE 2 - Após 300 usuários)

**Nome:**
```
Premium Mensal
```

**Descrição:**
```
Acesso completo a todos os recursos premium por 1 mês:

✅ Relatórios avançados em PDF
✅ Backup automático na nuvem
✅ Exportação de dados em CSV
✅ Inteligência de negócios
✅ Suporte prioritário

Renovação automática mensal. Cancele quando quiser.
```

**Benefícios principais:**
```
• Backup automático dos dados
• Relatórios profissionais em PDF
• Exportação ilimitada em CSV
• Insights de negócios avançados
```

---

### Premium Anual (FASE 1 - Primeiros 300 Usuários)

**Nome:**
```
Premium Anual - Preço de Lançamento 🔥
```

**Descrição:**
```
🔥 PREÇO DE LANÇAMENTO - PRIMEIROS 300 USUÁRIOS!

Seja um dos primeiros 300 e garanta preço de lançamento VITALÍCIO + melhor valor!

✅ Relatórios avançados em PDF
✅ Backup automático na nuvem
✅ Exportação de dados em CSV
✅ Inteligência de negócios
✅ Suporte prioritário

R$ 99,90/ano - Mantenha esse preço para sempre!

💰 O melhor negócio: R$ 8,33/mês (vs R$ 9,90 mensal)

Após 300 usuários, o preço aumenta para R$ 199,99/ano.

Renovação automática anual. Cancele quando quiser.
```

**Benefícios principais:**
```
• Preço de lançamento vitalício (primeiros 300)
• Melhor custo-benefício
• Backup automático dos dados
• Relatórios profissionais em PDF
• Exportação ilimitada em CSV
• Insights de negócios avançados
```

---

### Premium Anual (FASE 2 - Após 300 usuários)

**Nome:**
```
Premium Anual
```

**Descrição:**
```
Acesso completo a todos os recursos premium por 12 meses:

✅ Relatórios avançados em PDF
✅ Backup automático na nuvem
✅ Exportação de dados em CSV
✅ Inteligência de negócios
✅ Suporte prioritário

💰 Economize comparado ao plano mensal!

Renovação automática anual. Cancele quando quiser.
```

**Benefícios principais:**
```
• Melhor custo-benefício
• Backup automático dos dados
• Relatórios profissionais em PDF
• Exportação ilimitada em CSV
• Insights de negócios avançados
```

---

## 🎯 NOVIDADES (Release Notes)

### Versão 1.0.0 - Lançamento Inicial
```
🎉 Primeira versão do Vendas, Estoque e Fiado (PDV)!

✨ Novidades:
• Dashboard com métricas do negócio
• Registro rápido de vendas
• Controle completo de estoque
• Gestão de clientes
• Controle financeiro (despesas e receitas)
• Relatórios com gráficos
• Tema claro e escuro
• Assinatura Premium com recursos avançados

💎 Premium:
• Backup automático na nuvem
• Relatórios em PDF
• Exportação em CSV
• Inteligência de negócios

📱 Funciona offline
🔒 Dados seguros no seu dispositivo

Obrigado por escolher o Vendas, Estoque e Fiado (PDV)!
```

---

## 📧 RESPOSTA PADRÃO PARA REVIEWS

### Resposta para Review Positivo
```
Olá! 😊

Muito obrigado pela avaliação! Ficamos muito felizes em saber que o app está ajudando na gestão do seu negócio.

Continuaremos trabalhando para melhorar ainda mais!

Equipe Vendas, Estoque e Fiado (PDV) ❤️
```

### Resposta para Review Negativo/Problema
```
Olá!

Pedimos desculpas pelo inconveniente. 😔

Sua opinião é muito importante para nós. Poderia nos enviar mais detalhes pelo [email de suporte] para que possamos resolver o problema?

Queremos garantir a melhor experiência para você!

Equipe Vendas, Estoque e Fiado (PDV)
```

### Resposta para Sugestão
```
Olá!

Obrigado pela sugestão! 💡

Sua ideia será avaliada pela nossa equipe. Adoramos receber feedback dos usuários para melhorar o app.

Continue acompanhando as atualizações!

Equipe Vendas, Estoque e Fiado (PDV) ✨
```

---

## 🌍 PAÍSES/REGIÕES

### Sugestão de distribuição inicial:
```
✅ Brasil (obrigatório)
✅ Portugal (se quiser expandir para mercado português)
```

---

## 🎨 DESCRIÇÃO DO ÍCONE

Para o designer ou se for criar você mesmo:

```
Ícone principal:
- Símbolo de carrinho de compras estilizado
- Cores: Azul (#4A90E2) e branco
- Fundo: Gradiente azul
- Estilo: Moderno, clean, profissional

Adaptive Icon Android:
- Foreground: Ícone do carrinho
- Background: Azul sólido (#4A90E2)
```

---

## 📞 INFORMAÇÕES DE CONTATO

Preencha estas informações no Console:

```
Email de contato: [seu-email@dominio.com]
Website: [seu-site ou GitHub Pages]
Política de Privacidade: [URL da política hospedada]
```

---

## 💡 DICAS DE USO

**Como usar estes textos:**

1. **Copie e cole** diretamente no Google Play Console
2. **Personalize** com suas informações específicas
3. **Adapte os preços** se necessário (R$ 9,90 e R$ 99,90)
4. **Revise** antes de publicar
5. **Mantenha atualizado** com novas versões

**Atenção:**
- Limite de caracteres no Console deve ser respeitado
- Revise português antes de publicar
- Teste em diferentes tamanhos de tela

---

**📝 Arquivo atualizado em:** Fevereiro 2026
**✅ Pronto para uso imediato**


# 📋 Roteiro de testes de Assinaturas (Google Play Internal Testing)

> **Importante:** os testes devem ser executados em um dispositivo físico ou emulador autorizado pelo Google Play Internal Testing. Mantenha uma conta de testes (`license tester`) conectada na Play Store antes de iniciar.

## 🔄 Preparação

1. Publicar uma build `internal testing` atualizada no Google Play.
2. Adicionar a conta de testes ao grupo de testers e aceitar o convite.
3. Instalar a build pelo link de internal testing no dispositivo alvo.
4. Entrar no app, autenticar-se e garantir conexão estável com a internet.

## 🧪 Casos de teste

### 1. Compra de nova assinatura
- Abrir **Premium** › escolher plano mensal (`premium_monthly_plan`).
- Confirmar a compra no Google Play.
- Verificar feedback de sucesso no app e atualização do status Premium (expiração e plano).
- Conferir no Supabase tabela `iap_status` se o registro foi criado/atualizado.

### 2. Sincronização de assinatura ativa
- Em um dispositivo recém-instalado (sem cache), fazer login na mesma conta.
- Aguardar sincronização automática do status premium no bootstrap.
- Entrar na tela de Planos/Premium e validar estado ativo.
- Confirmar no Supabase que o registro permanece ativo.

### 3. Cancelamento e sincronização
- No Google Play, cancelar a assinatura da conta de teste.
- Aguardar sincronização do backend (até 15 minutos) ou disparar manualmente a validação via edge function.
- No app, fechar e abrir novamente para sincronizar o estado automaticamente.
- Verificar que o status Premium foi desativado e que o alerta informa ausência de assinatura ativa.

## ✅ Critérios de aprovação
- Todos os casos retornam a mensagem esperada para o usuário.
- `checkSubscriptionFromDatabase()` reflete o estado atualizado após cada fluxo.
- Não existem transações pendentes em `getAvailablePurchases()` depois da finalização (confirmar via logs).

## 📝 Registro de evidências
- Capturar screenshots ou gravações das telas de confirmação do Google Play e do app.
- Exportar os logs da sessão (`adb logcat`) contendo eventos de `initializeIAP`, `purchase`, `checkSubscriptionFromDatabase` e `validateSubscription`.
- Anexar as evidências no relatório de QA antes da submissão à loja.


