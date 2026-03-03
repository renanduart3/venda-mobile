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
const SUBSCRIPTION_SKUS = Platform.select({
  android: ['premium_monthly_plan', 'premium_yearly_plan'],
  ios: ['premium_monthly_plan', 'premium_yearly_plan'],
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
2. Teste `restorePurchases()` após comprar
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
