# 📚 Documentação Central - Vendas, Estoque e Fiado (PDV) Mobile

Bem-vindo à documentação oficial do projeto. Para manter a sanidade da arquitetura, esta documentação é estritamente dividida por contexto de negócio. **Não crie arquivos novos para relatar correções de bugs.** Atualize os documentos abaixo.

## 🗂️ Índice de Documentos

### ⚙️ 1. Core Técnico e Arquitetura
* **[00_MASTER_CONFIG.md](./00_MASTER_CONFIG.md)**
    * A fonte da verdade para variáveis, IDs de aplicativos (Application ID), URLs de repositórios, chaves do Supabase e infraestrutura de build.
* **[01_ESPECIFICACAO_TECNICA.md](./01_ESPECIFICACAO_TECNICA.md)**
    * **O Cerne do Sistema.** Contém a estrutura do banco de dados (SQLite local + Supabase), fluxos do In-App Purchases (IAP), scripts de concessão de Premium via SQL, mapeamento de todas as abas/telas e regras de negócio de relatórios e notificações.

### 📢 2. Produto e Marketing
* **[02_VISAO_COMERCIAL.md](./02_VISAO_COMERCIAL.md)**
    * Descritivo de funcionalidades focado no usuário final. Sem jargões técnicos. Usado para basear roteiros de vídeos, landing pages, respostas de suporte e material de vendas.

### 🚀 3. Publicação e Expansão
* **[03_GESTAO_LOJAS.md](./03_GESTAO_LOJAS.md)**
    * Guia definitivo de operação no Google Play Console. Contém os textos de ASO (Brasil e EUA), descrição dos pacotes Premium (`premium_monthly_plan`, `premium_yearly_plan`), checklist de lançamento, automação via Fastlane e roteiro de testes em Internal Testing.

### ⚖️ 4. Jurídico
* **[legal/POLITICA_PRIVACIDADE.md](./legal/POLITICA_PRIVACIDADE.md)**
    * Template LGPD/GDPR para ser hospedado no GitHub Pages e linkado nas lojas de aplicativos.

---
**Nota para IAs e Desenvolvedores:** Se uma regra de negócio mudar, atualize o `01_ESPECIFICACAO_TECNICA.md`. Se o texto da loja mudar, atualize o `03_GESTAO_LOJAS.md`. Mantenha a documentação limpa.