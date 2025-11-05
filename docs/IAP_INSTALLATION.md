# 📱 Integração do `react-native-iap`

## ✅ Status atual

O módulo `react-native-iap` já está adicionado ao projeto e todas as funções de compra em `lib/iap.ts` utilizam a API real para inicializar a conexão, solicitar assinaturas, restaurar transações e encerrá-las corretamente.

## 🔧 Passos pós-clone

1. **Instalar dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```
2. **Configurar credenciais**
   - Defina `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` no `.env`.
   - Garanta que o usuário de teste possua sessão válida no Supabase antes de iniciar o fluxo de compra.
3. **Provisionar produtos de assinatura**
   - Android: cadastre `premium_monthly_plan` e `premium_yearly_plan` no Google Play Console.
   - iOS: cadastre os mesmos identificadores no App Store Connect (caso aplicável).
4. **Distribuir build de testes**
   - Use a faixa *Internal testing* do Google Play para disponibilizar a build ao time responsável pelos testes de IAP.

## 📘 Uso em tempo de execução

- `initializeIAP()` estabelece a conexão com a loja, registra os listeners de atualização/erro e limpa compras pendentes.
- `getProducts()` busca os SKUs configurados (`premium_monthly_plan`, `premium_yearly_plan`).
- `purchaseSubscription(productId)` solicita a assinatura e aguarda o listener concluir a validação com o Supabase (`validateSubscription`).
- `restorePurchases()` percorre todas as compras disponíveis, finaliza as transações e revalida cada assinatura.
- `endConnection()` remove os listeners e encerra a conexão com a loja para evitar vazamentos.

## 📎 Observações importantes

- Compras na Web continuam desabilitadas por não serem suportadas.
- `validateSubscription` envia o token real da loja para a Edge Function `validate-iap`, garantindo sincronização com o backend.
- Caso o usuário cancele a assinatura pelo Google Play, utilize `restorePurchases()` para atualizar o estado local após a sincronização pelo backend.
- Sempre execute os testes descritos em `docs/IAP_TEST_PLAN.md` antes de uma submissão à loja.
