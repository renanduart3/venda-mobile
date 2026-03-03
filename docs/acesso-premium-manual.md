# Concessão de Acesso Premium Vitalício

Este guia explica como conceder acesso Premium de forma vitalícia para usuários específicos diretamente pelo banco de dados Supabase, sem necessidade de código de ativação ou pagamento.

## Passos para habilitar o acesso

### 1. Obter o ID do Usuário

1. Acesse o dashboard do [Supabase](https://app.supabase.com/).
2. Vá na seção **Authentication** -> **Users**.
3. Procure pelo e-mail informado pelo usuário.
4. Clique no ícone de copiar ao lado do **User ID** (um código longo como `550e8400-e29b-41d4-a716-446655440000`).

### 2. Ativar no Banco de Dados

1. No dashboard do Supabase, vá em **SQL Editor**.
2. Clique em **New Query**.
3. Cole e execute o seguinte comando SQL, substituindo `'ID_DO_USUARIO_AQUI'` pelo ID que você copiou:

```sql
-- Verificar se o usuário já tem uma entrada na tabela iap_status
-- Se já tiver, atualizamos. Se não tiver, inserimos uma nova.
INSERT INTO iap_status (user_id, platform, product_id, purchase_token, is_premium, has_lifetime_access)
VALUES (
  'ID_DO_USUARIO_AQUI',
  'admin',
  'lifetime_grant',
  'manual_grant_' || now()::text,
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_premium = true,
  has_lifetime_access = true,
  updated_at = now();

-- NOTA: Se o usuário já tiver uma linha mas você não sabe o ID da linha,
-- use esta alternativa baseada no user_id:
UPDATE iap_status
SET is_premium = true, has_lifetime_access = true, updated_at = now()
WHERE user_id = 'ID_DO_USUARIO_AQUI';

-- Se o UPDATE acima não alterar nenhuma linha (0 rows affected),
-- rode apenas o INSERT acima sem o ON CONFLICT.
```

## Como funciona no App

- Quando o usuário abrir o app ou clicar em "Restaurar Compras", o sistema verificará o campo `has_lifetime_access` no banco de dados.
- Se estiver marcado como `true`:
  1. O plano Premium será ativado localmente.
  2. Na tela de Planos, aparecerá o status **Acesso Vitalício**.
  3. A data de expiração será ignorada.
  4. Os botões de pagamento ficarão desabilitados, impedindo que o usuário pague por engano.

## Como remover o acesso

Para remover o acesso vitalício, execute:

```sql
UPDATE iap_status
SET is_premium = false, has_lifetime_access = false, updated_at = now()
WHERE user_id = 'ID_DO_USUARIO_AQUI';
```
