# 🚀 GUIA RÁPIDO - Ativar IAP Google Play

## ✅ O QUE JÁ ESTÁ PRONTO

### 1. Código
- ✅ Sistema de IAP implementado (`lib/iap.ts`)
- ✅ Gerenciador de assinaturas (`lib/subscriptions.ts`)
- ✅ Tela de planos premium (`app/planos.tsx`)
- ✅ Integração com `react-native-iap`
- ✅ Validação de compras configurada

### 2. Configuração
- ✅ `app.json` configurado com permissões BILLING
- ✅ Splash screen e ícones prontos
- ✅ Package name definido: `com.renanduart3.vendamobile`
- ✅ Product IDs definidos:
  - `premium_monthly_plan` (Mensal - R$ 9,90)
  - `premium_yearly_plan` (Anual - R$ 99,90)

---

## 🎯 PRÓXIMOS PASSOS (Ordem de Execução)

### **PASSO 1: Criar Conta Google Play Console** ⏱️ 15 minutos

1. Acesse: https://play.google.com/console/signup
2. Pague taxa única de **$25** (cartão internacional)
3. Aguarde aprovação (geralmente 24-48h)

---

### **PASSO 2: Criar App no Console** ⏱️ 10 minutos

1. Entre em: https://play.google.com/console
2. Clique em **"Create app"**
3. Preencha:
   - **App name:** Loja Inteligente — Vendas & Estoque
   - **Default language:** Portuguese (Brazil)
   - **App or game:** App
   - **Free or paid:** Free
4. Aceite declarações e clique **Create app**

---

### **PASSO 3: Gerar Build para Upload** ⏱️ 20-30 minutos

```bash
# 1. Instalar EAS CLI (se não tiver)
npm install -g eas-cli

# 2. Login no Expo
eas login

# 3. Configurar projeto (primeira vez)
eas build:configure

# 4. Gerar build Android (AAB)
eas build --platform android --profile production
```

**Aguarde:** O build leva ~15-30 minutos. Você receberá um link para download.

---

### **PASSO 4: Upload do APK no Console** ⏱️ 15 minutos

1. No Google Play Console, vá em: **Release → Testing → Internal testing**
2. Clique em **Create new release**
3. Faça upload do arquivo AAB baixado do EAS
4. Preencha:
   - **Release name:** 1.0.0
   - **Release notes:** Primeira versão - Sistema de vendas e estoque
5. Clique em **Save** e depois **Review release**
6. Clique em **Start rollout to Internal testing**

⚠️ **Aguarde 2-24h** para o Google processar o app.

---

### **PASSO 5: Criar Produtos de Assinatura** ⏱️ 15 minutos

❗ **IMPORTANTE:** Só pode fazer isso APÓS o app estar em Internal Testing.

1. No menu: **Monetize → Subscriptions**
2. Clique em **Create subscription**

#### **Produto 1: Premium Mensal**
```
Product ID: premium_monthly_plan  (⚠️ EXATAMENTE como está no código)
Name: Premium Mensal
Description: Acesso completo a relatórios avançados e recursos premium

Base Plan:
  - Plan ID: monthly-base
  - Billing period: 1 month (Monthly)
  - Price: R$ 9,90
  - Renewal: Automatically renews
  - Grace period: 3 days
```

3. Clique em **Save** e depois **Activate**

#### **Produto 2: Premium Anual**
```
Product ID: premium_yearly_plan  (⚠️ EXATAMENTE como está no código)
Name: Premium Anual
Description: Plano anual com desconto - todos os recursos premium

Base Plan:
  - Plan ID: yearly-base
  - Billing period: 12 months (Yearly)
  - Price: R$ 99,90
  - Renewal: Automatically renews
  - Grace period: 3 days
```

4. Clique em **Save** e depois **Activate**

---

### **PASSO 6: Configurar Testadores** ⏱️ 5 minutos

1. No menu: **Setup → License testing**
2. Adicione emails de teste (Gmail)
3. Selecione: **License Test Response → Respond Normally**
4. Salve

**Observação:** Use um email DIFERENTE do que cadastrou o app.

---

### **PASSO 7: Adicionar Testers ao Internal Testing** ⏱️ 5 minutos

1. Volte em: **Release → Testing → Internal testing**
2. Aba **Testers**
3. Clique em **Create email list**
4. Nome: "Testers Internos"
5. Adicione os mesmos emails do License testing
6. Salve
7. **Copie o Opt-in URL** que aparece

---

### **PASSO 8: Testar no Dispositivo** ⏱️ 10 minutos

1. No celular Android (conta de teste):
   - Acesse o **Opt-in URL** copiado
   - Clique em **"Become a tester"**
   - Clique em **"Download it on Google Play"**
   - Instale o app

2. No app:
   - Abra a tela de **Planos Premium**
   - Selecione o Plano Mensal
   - Clique em **"Assinar Agora"**
   - A tela do Google Play deve abrir
   - Verá "ESTA É UMA COMPRA DE TESTE" no topo
   - Complete a compra (não será cobrado)

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após testar, verifique:

- [ ] A tela do Google Play abre ao clicar em "Assinar"
- [ ] Mostra os preços corretos (R$ 9,90 ou R$ 99,90)
- [ ] Mostra "ESTA É UMA COMPRA DE TESTE"
- [ ] Consegue completar a compra sem erro
- [ ] App recebe confirmação da compra
- [ ] Recursos premium são desbloqueados
- [ ] Botão "Restaurar Compras" funciona

---

## 🐛 PROBLEMAS COMUNS

### "Item not available for purchase"
- ✅ Produtos não estão ativos no Console → Ative-os
- ✅ Aguarde 2-24h após criar os produtos
- ✅ Build não está em Internal Testing → Upload e aguarde

### "IAP not available"
- ✅ Está usando Expo Go → Use build standalone
- ✅ Rebuild o app após mudanças

### "Product IDs don't match"
- ✅ IDs no código devem ser EXATAMENTE iguais aos do Console
- ✅ No código: `premium_monthly_plan` e `premium_yearly_plan`

### Compra não finaliza
- ✅ Verifique internet
- ✅ Conta de teste configurada? (License testing)
- ✅ App instalado via Opt-in URL?

---

## 📞 COMANDOS ÚTEIS

```bash
# Ver logs do dispositivo Android conectado
adb logcat | grep -i "billing\|iap\|purchase"

# Limpar cache do Expo
npx expo start --clear

# Rebuild completo
rm -rf node_modules && npm install
eas build --platform android --profile production --clear-cache
```

---

## 🎉 PRONTO PARA PRODUÇÃO?

Após tudo funcionar em Internal Testing:

1. **Closed Testing** (grupo maior de beta testers)
2. **Open Testing** (público, opcional)
3. **Production** (lançamento oficial)

Para cada etapa:
- Incremente `versionCode` em `app.json`
- Gere novo build com `eas build`
- Upload no Console na respectiva aba

---

**💡 Dica:** Mantenha este guia aberto enquanto configura. O processo total leva ~2-3 horas na primeira vez.

**🆘 Problemas?** Leia o arquivo `GOOGLE_PLAY_IAP_SETUP.md` para detalhes técnicos completos.
