-- ============================================
-- LOJA INTELIGENTE - DATABASE SETUP COMPLETO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Dashboard → SQL Editor → New Query → Cole e Execute
-- 
-- IMPORTANTE: Este script é idempotente (pode ser executado múltiplas vezes)
-- Usa CREATE IF NOT EXISTS e DROP POLICY IF EXISTS
-- 
-- Para resetar o contador de early adopters:
-- UPDATE early_adopter_config SET current_count = 20 WHERE is_active = true;
-- ============================================

-- ============================================
-- 1. TABELA IAP_STATUS
-- ============================================
-- Armazena status de assinaturas dos usuários

CREATE TABLE IF NOT EXISTS iap_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('android', 'ios')),
  product_id text NOT NULL,
  purchase_token text NOT NULL,
  expiry_date timestamptz,
  is_premium boolean DEFAULT false,
  has_lifetime_access boolean DEFAULT false,
  is_early_adopter boolean DEFAULT false,
  discount_percentage integer DEFAULT 0,
  original_price numeric(10,2),
  discounted_price numeric(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_iap_status_user_id ON iap_status(user_id);
CREATE INDEX IF NOT EXISTS idx_iap_status_expiry_date ON iap_status(expiry_date);
CREATE INDEX IF NOT EXISTS idx_iap_status_platform ON iap_status(platform);
CREATE INDEX IF NOT EXISTS idx_iap_status_early_adopter ON iap_status(is_early_adopter);
CREATE INDEX IF NOT EXISTS idx_iap_status_lifetime ON iap_status(has_lifetime_access);

COMMENT ON TABLE iap_status IS 'Status de assinaturas IAP validadas do Google Play e App Store';
COMMENT ON COLUMN iap_status.is_early_adopter IS 'Se o usuário é um early adopter (primeiros 300) com preço de lançamento vitalicio';
COMMENT ON COLUMN iap_status.has_lifetime_access IS 'Acesso premium vitalício concedido manualmente via banco de dados';
COMMENT ON COLUMN iap_status.discount_percentage IS 'Percentual de desconto aplicado (0 para early adopters, pagam preço normal de lançamento)';
COMMENT ON COLUMN iap_status.original_price IS 'Preço de lançamento pago pelo early adopter (R$ 9,90 ou R$ 99,90)';
COMMENT ON COLUMN iap_status.discounted_price IS 'Preço regular após aumento de 90% (R$ 19,99 ou R$ 199,99)';

-- ============================================
-- 2. TABELA EARLY_ADOPTER_CONFIG
-- ============================================
-- Configuração do programa early adopter

CREATE TABLE IF NOT EXISTS early_adopter_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_slots integer NOT NULL DEFAULT 300,
  current_count integer NOT NULL DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE early_adopter_config IS 'Configuração do programa de early adopters - primeiros 300 usuários com preço de lançamento (R$ 9,90/R$ 99,90). Após isso o preço aumenta 90% (R$ 19,99/R$ 199,99)';

-- Inserir configuração inicial (contador começa em 20 fake)
INSERT INTO early_adopter_config (total_slots, current_count, is_active)
VALUES (300, 20, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE iap_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_adopter_config ENABLE ROW LEVEL SECURITY;

-- Políticas para iap_status
DROP POLICY IF EXISTS "Users can view own subscription status" ON iap_status;
CREATE POLICY "Users can view own subscription status"
  ON iap_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert subscriptions" ON iap_status;
CREATE POLICY "Service role can insert subscriptions"
  ON iap_status
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update subscriptions" ON iap_status;
CREATE POLICY "Service role can update subscriptions"
  ON iap_status
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Políticas para early_adopter_config
DROP POLICY IF EXISTS "Anyone can read early adopter status" ON early_adopter_config;
CREATE POLICY "Anyone can read early adopter status"
  ON early_adopter_config
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can update early adopter config" ON early_adopter_config;
CREATE POLICY "Service role can update early adopter config"
  ON early_adopter_config
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_iap_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se há vagas de early adopter disponíveis
CREATE OR REPLACE FUNCTION check_early_adopter_available()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_record record;
BEGIN
  SELECT * INTO config_record 
  FROM early_adopter_config 
  WHERE is_active = true 
  LIMIT 1;
  
  IF config_record IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN config_record.current_count < config_record.total_slots;
END;
$$;

-- Função para reivindicar uma vaga de early adopter
CREATE OR REPLACE FUNCTION claim_early_adopter_slot()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_record record;
BEGIN
  -- Lock da linha para evitar race conditions
  SELECT * INTO config_record 
  FROM early_adopter_config 
  WHERE is_active = true 
  LIMIT 1
  FOR UPDATE;
  
  IF config_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se há vagas disponíveis
  IF config_record.current_count >= config_record.total_slots THEN
    RETURN false;
  END IF;
  
  -- Incrementar contador
  UPDATE early_adopter_config
  SET current_count = current_count + 1,
      updated_at = now()
  WHERE id = config_record.id;
  
  RETURN true;
END;
$$;

-- Função para obter status do programa early adopter
CREATE OR REPLACE FUNCTION get_early_adopter_status()
RETURNS TABLE (
  total_slots integer,
  current_count integer,
  slots_remaining integer,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.total_slots,
    c.current_count,
    c.total_slots - c.current_count as slots_remaining,
    c.current_count < c.total_slots as is_available
  FROM early_adopter_config c
  WHERE c.is_active = true
  LIMIT 1;
END;
$$;

-- Função para calcular preço com desconto (helper)
CREATE OR REPLACE FUNCTION calculate_early_adopter_price(
  original_price numeric,
  discount_percent integer DEFAULT 90
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN ROUND(original_price * (100 - discount_percent) / 100.0, 2);
END;
$$;

-- ============================================
-- 5. TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_iap_status_updated_at ON iap_status;
CREATE TRIGGER trigger_update_iap_status_updated_at
  BEFORE UPDATE ON iap_status
  FOR EACH ROW
  EXECUTE FUNCTION update_iap_status_updated_at();

-- ============================================
-- 6. VIEWS
-- ============================================

-- View para facilitar consultas de informações de assinatura
CREATE OR REPLACE VIEW user_subscription_info AS
SELECT 
  iap.id,
  iap.user_id,
  iap.platform,
  iap.product_id,
  iap.expiry_date,
  iap.is_premium,
  iap.has_lifetime_access,
  iap.is_early_adopter,
  iap.discount_percentage,
  iap.original_price,
  iap.discounted_price,
  CASE 
    WHEN iap.has_lifetime_access THEN 'Lifetime Grant'
    WHEN iap.is_early_adopter THEN 'Early Adopter'
    ELSE 'Regular'
  END as user_type,
  iap.created_at,
  iap.updated_at
FROM iap_status iap;

-- Conceder acesso à view
GRANT SELECT ON user_subscription_info TO authenticated;

-- ============================================
-- SETUP COMPLETO!
-- ============================================
-- Estrutura do banco criada com sucesso
-- 
-- Próximos passos:
-- 1. Verifique se tudo foi criado corretamente
-- 2. Teste as functions no SQL Editor
-- 3. Configure suas Edge Functions para usar essas tabelas
--
-- Queries úteis para testar:
-- SELECT * FROM get_early_adopter_status();
-- SELECT check_early_adopter_available();
-- SELECT * FROM early_adopter_config;
-- ============================================
