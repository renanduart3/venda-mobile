# 🛒 Gestão de Lojas e ASO (Google Play Console)

Este documento centraliza todos os textos, configurações de preços e metadados necessários para publicar e atualizar o aplicativo no Google Play Console, separados por região. Se for usar o Fastlane, os textos abaixo devem refletir o conteúdo das pastas `metadata`.

---

## 1. Metadados por Região (Textos da Loja)

### 🇧🇷 Região: Brasil (pt-BR)
* **Nome do App (Max 30):** Vendas, Estoque e Fiado (PDV)
* **Descrição Curta (Max 80):** Gerencie vendas, estoque e finanças do seu negócio de forma simples.
* **Descrição Longa:**
    * *Dica de ASO:* Focar em "MEI", "PDV", "Controle de Estoque", "Pequenos Negócios".
    * *Texto Padrão:* "Transforme a gestão da sua loja com o Vendas, Estoque e Fiado (PDV)! Sistema completo de vendas, controle de estoque e gestão financeira..." *(Manter o texto completo atualizado aqui ou na pasta pt-BR do Fastlane)*.
* **Tags:** vendas, estoque, PDV, gestão, loja, MEI, empreendedor, financeiro.

### 🇺🇸 Região: Estados Unidos (en-US) - *[PLANEJAMENTO]*
* **Nome do App (Max 30):** [Nome ASO, ex: Vendly POS]
* **Descrição Curta (Max 80):** Complete POS, inventory, and sales tracker for your small business.
* **Descrição Longa:**
    * *Dica de ASO:* Focar em "POS", "Retail", "Tracker", "Register", "Small Business".
    * *Texto Padrão:* [A ser gerado com foco em conversão e gatilhos americanos].
* **Tags:** POS, inventory, sales tracker, retail, business, register, receipt.

---

## 2. Precificação e Produtos In-App (IAP)

As configurações abaixo refletem o preenchimento exato exigido pelo Google Play Console (Monetize > Subscriptions).

### 💎 Produto 1: Premium Mensal
* **Product ID:** `premium_monthly_plan` *(IDÊNTICO no código!)*
* **Base Plan ID:** `monthly-standard`
* **Billing Period:** 1 month
* **Auto-Renewal:** Enabled
* **Grace Period:** 3 days
* **Preços Regionalizados:**
    * 🇧🇷 **Brasil (BRL):** R$ 9,90 (Fase 1 - Early Adopter) -> R$ 19,99 (Fase 2)
    * 🇺🇸 **EUA (USD):** U$ 9,99

### 💎 Produto 2: Premium Anual
* **Product ID:** `premium_yearly_plan` *(IDÊNTICO no código!)*
* **Base Plan ID:** `yearly-standard`
* **Billing Period:** 12 months
* **Auto-Renewal:** Enabled
* **Grace Period:** 7 days
* **Preços Regionalizados:**
    * 🇧🇷 **Brasil (BRL):** R$ 99,90 (Fase 1 - Early Adopter) -> R$ 199,99 (Fase 2)
    * 🇺🇸 **EUA (USD):** U$ 99,99

---

## 3. Assets Gráficos e Categorização

* **Categoria Principal:** Business
* **Categoria Secundária:** Productivity
* **Ícone (512x512):** Fundo Azul (#4A90E2), símbolo de carrinho clean.
* **Feature Graphic (1024x500):** Banner contendo tagline e screenshots inclinados.
* **Screenshots (Min 2, ideal 6-8):**
    1.  Dashboard Completo (Visualize métricas importantes)
    2.  Registro de Vendas (Registre vendas rapidamente)
    3.  Controle de Estoque (Alertas de produtos)
    4.  Relatórios (Métricas avançadas - Exclusivo Premium)

---

## 4. Configuração de Contato Público
*Esses dados ficam públicos na Play Store.*

* **Email de Suporte:** [SEU_EMAIL@dominio.com]
* **Website BR:** `https://renanduart3.github.io/venda-mobile-inteligente/`
* **Website US:** `https://renanduart3.github.io/[nome-aso]/`
* **URL da Política de Privacidade:** `https://renanduart3.github.io/venda-mobile-inteligente/privacy`

---

## 5. Roteiro de Testes Internos (Internal Testing)

Antes de promover para Produção, a conta de teste (`license tester`) deve passar por:
1.  **Compra Nova:** Assinar o plano `premium_monthly_plan`, confirmar a ativação local e no Supabase (`iap_status`).
2.  **Restauração:** Apagar dados do app, logar novamente e clicar em "Restaurar Compras".
3.  **Cancelamento:** Cancelar via Google Play, forçar refresh no app e garantir que o acesso premium seja revogado.