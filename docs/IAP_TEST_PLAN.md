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

### 2. Restauração de assinatura ativa
- Em um dispositivo recém-instalado (sem cache), fazer login na mesma conta.
- Acessar **Premium** › `Restaurar compras`.
- Verificar alerta de sucesso e status Premium atualizado.
- Confirmar no Supabase que o registro permanece ativo.

### 3. Cancelamento e sincronização
- No Google Play, cancelar a assinatura da conta de teste.
- Aguardar sincronização do backend (até 15 minutos) ou disparar manualmente a validação via edge function.
- No app, tocar em `Restaurar compras` para sincronizar o estado.
- Verificar que o status Premium foi desativado e que o alerta informa ausência de assinatura ativa.

## ✅ Critérios de aprovação
- Todos os casos retornam a mensagem esperada para o usuário.
- `checkSubscriptionFromDatabase()` reflete o estado atualizado após cada fluxo.
- Não existem transações pendentes em `getAvailablePurchases()` depois da finalização (confirmar via logs).

## 📝 Registro de evidências
- Capturar screenshots ou gravações das telas de confirmação do Google Play e do app.
- Exportar os logs da sessão (`adb logcat` ou Xcode console) contendo eventos de `initializeIAP`, `purchase`, `restore` e `validateSubscription`.
- Anexar as evidências no relatório de QA antes da submissão à loja.
