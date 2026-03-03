# 🛒 Configuração do Google Play In-App Purchases (IAP)

## 📋 Pré-requisitos

### 1. Conta Google Play Console
- ✅ Conta de desenvolvedor ativa ($25 taxa única)
- ✅ Acesso ao [Google Play Console](https://play.google.com/console)

### 2. App Publicado (pelo menos em Internal Testing)
- O app precisa estar publicado em **Internal Testing** no mínimo para testar IAP
- Não funciona em modo debug local

---

## 🔧 Passo a Passo - Configuração no Google Play Console

### **PASSO 1: Criar os Produtos de Assinatura**

1. Acesse [Google Play Console](https://play.google.com/console)
2. Selecione seu app
3. No menu lateral: **Monetize** → **Subscriptions**
4. Clique em **Create subscription**

#### **Produto 1: Premium Mensal**
```
Product ID: premium_monthly_plan
Name: Premium Mensal
Description: Acesso completo a relatórios avançados, exportação de dados e recursos premium
Base plans:
  - Plan ID: base-monthly
  - Billing period: Monthly (1 month)
  - Price: R$ 9,90 (ou seu preço)
  - Grace period: 3 days
  - Account hold: Enabled
```

#### **Produto 2: Premium Anual**
```
Product ID: premium_yearly_plan
Name: Premium Anual
Description: Acesso completo anual com desconto - todos os recursos premium
Base plans:
  - Plan ID: base-yearly
  - Billing period: Yearly (12 months)
  - Price: R$ 99,00 (ou seu preço)
  - Grace period: 3 days
  - Account hold: Enabled
```

5. Clique em **Activate** para cada produto após criar

---

### **PASSO 2: Configurar Testers de Licença**

Para testar sem cobrar de verdade:

1. No menu lateral: **Setup** → **License testing**
2. Adicione emails de teste (contas Gmail)
3. Selecione tipo de resposta: **RESPOND_NORMALLY** (para teste real da Google Play)

**Importante:** Use uma conta Gmail DIFERENTE da conta de desenvolvedor para testar

---

### **PASSO 3: Publicar em Internal Testing**

1. No menu lateral: **Release** → **Testing** → **Internal testing**
2. Clique em **Create new release**
3. Upload do APK/AAB:

```bash
# Gerar o build para Android
eas build --platform android --profile production
```

4. Liste as mudanças (changelog)
5. **Add testers**: Adicione emails dos testadores
6. Clique em **Review release** → **Start rollout to Internal testing**

---

### **PASSO 4: Adicionar Testers ao Internal Testing**

1. Ainda em **Internal testing**
2. Aba **Testers**
3. Clique em **Create email list**
4. Adicione os emails das pessoas que vão testar
5. Copie o **opt-in URL** e envie para os testadores
6. Os testadores devem:
   - Acessar o link
   - Clicar em "Become a tester"
   - Baixar o app da Google Play Store

---

### **PASSO 5: Aguardar Processamento**

⏱️ **Tempo de processamento:** 2-24 horas

- Os produtos de assinatura podem demorar para aparecer
- A build precisa ser processada primeiro
- Os IAP só funcionam após aprovação inicial

---

## 🧪 Como Testar IAP

### **Teste com Conta de Teste (Sem Cobrança Real)**

1. Configure uma conta de teste em **License testing** (Gmail diferente)
2. Essa conta baixa o app pelo link de opt-in
3. Ao fazer a compra:
   - A tela do Google Play aparece normalmente
   - Mostra "Esta é uma compra de teste" no topo
   - **NÃO COBRA** o cartão de crédito
   - Mas funciona igual ao processo real

### **Teste com Conta Real (Cobrança Real)**

- Use uma conta Gmail que NÃO está em License testing
- Será cobrado o valor real
- Recomendado apenas para teste final antes do lançamento

---

## 📱 Comandos para Build

### **Build de Produção (Release)**
```bash
# Instalar EAS CLI (se ainda não tem)
npm install -g eas-cli

# Login no Expo
eas login

# Configurar o projeto (primeira vez)
eas build:configure

# Gerar build Android (AAB para Google Play)
eas build --platform android --profile production
```

### **Build de Preview (para testar localmente)**
```bash
# Gerar APK para instalação direta
eas build --platform android --profile preview
```

---

## 🔍 Verificações Importantes

### **1. Product IDs Devem Corresponder**

No arquivo `lib/iap.ts`, os IDs estão definidos:
```typescript
export const PRODUCT_IDS = {
  MONTHLY: 'premium_monthly_plan',
  ANNUAL: 'premium_yearly_plan',
};
```

**⚠️ IMPORTANTE:** Esses IDs devem ser EXATAMENTE iguais aos criados no Google Play Console!

### **2. Permissões no AndroidManifest**

Já configurado no `app.json`:
```json
"android": {
  "permissions": [
    "INTERNET",
    "ACCESS_NETWORK_STATE",
    "BILLING"
  ]
}
```

### **3. Plugin IAP Configurado**

Já está em `app.json`:
```json
"plugins": [
  "react-native-iap"
]
```

---

## 🐛 Troubleshooting (Problemas Comuns)

### **Erro: "Item not available"**
- ✅ Verifique se os produtos estão **ATIVOS** no Google Play Console
- ✅ Aguarde 2-24h após ativação
- ✅ Confirme que está usando a build do Internal Testing
- ✅ Product IDs devem corresponder exatamente

### **Erro: "IAP not available"**
- ✅ Não funciona no Expo Go (só em build standalone)
- ✅ Verifique se `react-native-iap` está instalado
- ✅ Rebuild do app após mudanças

### **Compra não finaliza**
- ✅ Verifique conexão com internet
- ✅ Confirme que a conta de teste está configurada
- ✅ Veja logs no `adb logcat` para detalhes

### **Produtos não aparecem**
- ✅ App precisa estar em Internal Testing no mínimo
- ✅ Build precisa ser a mesma versão do Google Play
- ✅ Package name deve corresponder (`com.renanduart3.vendamobile`)

---

## 📊 Fluxo Completo do Usuário

1. **Usuário abre o app** → Vê opção "Premium"
2. **Clica em "Assinar Premium"** → Chama `purchaseSubscription(productId)`
3. **Google Play abre** → Tela nativa do Google mostrando:
   - Preço
   - Período (mensal/anual)
   - Botão "Assinar"
4. **Usuário confirma** → Google processa pagamento
5. **App recebe callback** → `purchaseUpdatedListener`
6. **App valida compra** → `validateSubscription()`
7. **App ativa premium** → Salva no AsyncStorage
8. **Usuário tem acesso** → Recursos premium liberados

---

## 📝 Checklist Final

Antes de publicar para produção:

- [ ] Produtos de assinatura criados e ATIVOS
- [ ] Testado com conta de teste (License testing)
- [ ] Testado fluxo completo de compra
- [ ] Testado restauração de compra
- [ ] Testado cancelamento (via Google Play)
- [ ] Build de produção gerada com `eas build`
- [ ] App em Internal Testing funcionando
- [ ] Todos os recursos premium funcionando após compra

---

## 🚀 Próximos Passos

Após tudo funcionar em Internal Testing:

1. **Closed Testing** (beta privado)
2. **Open Testing** (beta público opcional)
3. **Production** (lançamento oficial)

---

## 📞 Suporte

Se encontrar problemas:
- [Documentação react-native-iap](https://react-native-iap.dooboolab.com/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- Logs em: Console do Expo / `adb logcat` / Google Play Console → **Order management**

---

**✨ Boa sorte com o lançamento!**
