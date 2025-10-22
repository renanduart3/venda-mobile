# 📱 Instalação do react-native-iap

## ⚠️ **Status Atual**

O arquivo `lib/iap.ts` está temporariamente desabilitado para permitir que o app compile sem a dependência `react-native-iap`.

## 🔧 **Para Ativar IAP Real:**

### **1. Instalar Dependência:**
```bash
# Usando yarn
yarn add react-native-iap

# Ou usando npm
npm install react-native-iap
```

### **2. Descomentar Código:**
No arquivo `lib/iap.ts`, descomente as linhas:

```typescript
// Descomentar estas linhas:
import RNIap, {
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Product,
  type Purchase,
  type SubscriptionPurchase,
  finishTransaction,
  getProducts as getIAPProducts,
  getSubscriptions,
  requestPurchase,
  requestSubscription,
  initConnection,
  endConnection as endIAPConnection,
  getAvailablePurchases,
} from 'react-native-iap';
```

### **3. Implementar Funções Reais:**
Substituir as implementações temporárias pelas reais:

```typescript
// Substituir implementações temporárias por:
export async function initializeIAP(): Promise<boolean> {
  // Implementação real com react-native-iap
}

export async function getProducts(): Promise<Product[]> {
  // Implementação real com react-native-iap
}

export async function purchaseSubscription(productId: string) {
  // Implementação real com react-native-iap
}

export async function restorePurchases() {
  // Implementação real com react-native-iap
}

export async function endConnection(): Promise<void> {
  // Implementação real com react-native-iap
}
```

## 📋 **Configuração Necessária:**

### **Android:**
1. Adicionar permissões no `android/app/src/main/AndroidManifest.xml`
2. Configurar Google Play Console
3. Criar produtos de assinatura

### **iOS:**
1. Configurar App Store Connect
2. Criar produtos de assinatura
3. Configurar certificados

## 🎯 **Status das Funções:**

### **✅ Temporariamente Desabilitadas:**
- `initializeIAP()` - Retorna `false`
- `getProducts()` - Retorna array vazio
- `purchaseSubscription()` - Retorna erro
- `restorePurchases()` - Retorna erro
- `endConnection()` - Log de desabilitado

### **📱 Comportamento Atual:**
- App compila sem erros
- IAP não funciona (temporariamente)
- Mensagens de log indicam desabilitação
- Interface funciona normalmente

## 🚀 **Para Produção:**

1. **Instalar dependência:**
   ```bash
   yarn add react-native-iap
   ```

2. **Descomentar código em `lib/iap.ts`**

3. **Implementar funções reais**

4. **Configurar Google Play Console**

5. **Testar com contas reais**

## ⚠️ **Importante:**

- App funciona normalmente sem IAP
- Todas as outras funcionalidades funcionam
- IAP pode ser ativado quando necessário
- Sistema de mocks continua funcionando

## 📊 **Benefícios da Implementação Atual:**

- ✅ App compila sem erros
- ✅ Todas as funcionalidades funcionam
- ✅ Sistema de mocks ativo
- ✅ IAP pode ser ativado facilmente
- ✅ Código preparado para produção
