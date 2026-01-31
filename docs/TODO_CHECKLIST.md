# ✅ LISTA DE TAREFAS - Publicação na Loja

Data de início: _______________

## 🔴 BLOQUEADORES (Não pode publicar sem)

### 1. Keystore de Produção
- [ ] Executar comando keytool
- [ ] Anotar senhas em local seguro
- [ ] Mover keystore para `android/app/upload-keystore.jks`
- [ ] Criar arquivo `android/gradle.properties` com variáveis
- [ ] Testar build: `cd android && ./gradlew bundleRelease`

**Tempo**: 30-60 minutos
**Doc**: PRODUCTION_BUILD_CONFIG.md

---

### 2. Política de Privacidade
- [ ] Editar arquivo PRIVACY_POLICY_TEMPLATE.md
- [ ] Preencher: [DATA]
- [ ] Preencher: [SEU_EMAIL@exemplo.com]
- [ ] Preencher: [SEU_WEBSITE] (opcional)
- [ ] Preencher: [SEU_ENDEREÇO] (opcional)
- [ ] Revisar conteúdo completo
- [ ] Hospedar online (GitHub Pages / site próprio)
- [ ] Copiar URL: ________________________________
- [ ] Verificar que URL está acessível

**Tempo**: 1-2 horas
**Doc**: PRIVACY_POLICY_TEMPLATE.md

---

### 3. Screenshots do App
- [ ] Capturar: Dashboard / Tela inicial
- [ ] Capturar: Cadastro de vendas
- [ ] Capturar: Gestão de estoque (opcional mas recomendado)
- [ ] Capturar: Relatórios financeiros (opcional mas recomendado)
- [ ] Capturar: Produtos mais vendidos (opcional)
- [ ] Capturar: Tela premium (opcional)
- [ ] Verificar tamanho: 320px - 3840px
- [ ] Salvar em pasta organizada

**Quantidade mínima**: 2 screenshots
**Quantidade recomendada**: 6-8 screenshots
**Tempo**: 30 minutos (mínimo) a 2 horas (completo)
**Doc**: STORE_LISTING_CONTENT.md

---

### 4. Feature Graphic
- [ ] Criar banner 1024x500px
- [ ] Incluir logo do app
- [ ] Incluir nome "Loja Inteligente"
- [ ] Adicionar tagline (ex: "Gestão Simples, Resultados Inteligentes")
- [ ] Exportar em alta qualidade (PNG/JPG)

**Tempo**: 1-2 horas
**Doc**: STORE_LISTING_CONTENT.md
**Ferramenta sugerida**: Canva, Figma, Photoshop

---

### 5. Google Play Console - Configuração
- [ ] Criar conta de desenvolvedor (se ainda não tem)
- [ ] Pagar taxa única de US$ 25 (se ainda não pagou)
- [ ] Criar novo aplicativo
- [ ] Preencher nome do app: ________________________________
- [ ] Selecionar idioma padrão: Português (Brasil)
- [ ] Selecionar categoria: Negócios ou Produtividade
- [ ] Definir como: Aplicativo gratuito com compras in-app
- [ ] Ativar "Assinatura de apps pelo Google Play"
- [ ] Fazer upload do keystore como chave de upload

**Tempo**: 2-3 horas
**Doc**: PRE_PUBLISH_TESTING_CHECKLIST.md

---

### 6. Google Play Console - Ficha da Loja
- [ ] Preencher título do app (max 30 caracteres)
- [ ] Preencher descrição curta (max 80 caracteres)
- [ ] Preencher descrição completa (copiar de STORE_LISTING_CONTENT.md)
- [ ] Upload ícone 512x512
- [ ] Upload feature graphic 1024x500
- [ ] Upload screenshots (mínimo 2)
- [ ] Adicionar e-mail de contato
- [ ] Adicionar website (opcional)
- [ ] Salvar rascunho

**Tempo**: 30-60 minutos
**Doc**: STORE_LISTING_CONTENT.md

---

### 7. Google Play Console - Políticas
- [ ] Adicionar URL da política de privacidade
- [ ] Preencher formulário "Segurança de dados"
  - [ ] Que dados são coletados
  - [ ] Como são usados
  - [ ] Como são compartilhados
- [ ] Completar questionário de classificação de conteúdo (IARC)
- [ ] Declarar se contém anúncios (não)
- [ ] Declarar uso de permissões

**Tempo**: 1-2 horas
**Doc**: PRE_PUBLISH_TESTING_CHECKLIST.md

---

### 8. Google Play Console - Produtos IAP
- [ ] Criar produto 1:
  - [ ] ID: `premium_monthly_plan`
  - [ ] Nome: "Premium Mensal"
  - [ ] Descrição: "Acesso completo a todos os recursos premium por 1 mês"
  - [ ] Preço: R$ 9,90
  - [ ] Período: Mensal
  - [ ] Teste grátis: 7 dias (opcional)
  - [ ] Ativar produto
- [ ] Criar produto 2:
  - [ ] ID: `premium_yearly_plan`
  - [ ] Nome: "Premium Anual"
  - [ ] Descrição: "Acesso completo a todos os recursos premium por 1 ano"
  - [ ] Preço: R$ 99,90
  - [ ] Período: Anual
  - [ ] Teste grátis: 7 dias (opcional)
  - [ ] Ativar produto

**Tempo**: 30 minutos
**Doc**: PRODUCTION_SETUP.md

---

### 9. Build e Upload para Internal Testing
- [ ] Gerar AAB final: `cd android && ./gradlew bundleRelease`
- [ ] Verificar tamanho do AAB (deve ser < 150 MB)
- [ ] Acessar Google Play Console > Teste interno
- [ ] Criar nova versão
- [ ] Fazer upload do AAB
- [ ] Preencher notas de versão em português
- [ ] Salvar e revisar
- [ ] Publicar no track de teste interno
- [ ] Copiar link de convite para testadores

**Tempo**: 30 minutos
**Doc**: PRODUCTION_BUILD_CONFIG.md

---

### 10. Testes de IAP
- [ ] Adicionar conta de teste no Google Play Console
- [ ] Aceitar convite de testador
- [ ] Instalar app via link de Internal Testing
- [ ] Testar compra de plano mensal
  - [ ] Selecionar plano
  - [ ] Completar compra
  - [ ] Verificar features premium ativadas
- [ ] Testar restauração de compras
  - [ ] Desinstalar app
  - [ ] Reinstalar e fazer login
  - [ ] Clicar "Restaurar compras"
  - [ ] Verificar premium restaurado
- [ ] Testar cancelamento (opcional)
- [ ] Documentar resultados

**Tempo**: 4-6 horas
**Doc**: IAP_TEST_PLAN.md

---

## 🟡 RECOMENDADOS (Fazer antes de produção)

### 11. Remover Console Logs
- [ ] Executar: `grep -r 'console.log' app/ components/ contexts/ hooks/ lib/`
- [ ] Remover ou comentar logs de desenvolvimento
- [ ] Testar que app continua funcionando
- [ ] Commit das alterações

**Quantidade encontrada**: 24 console.logs
**Tempo**: 1-2 horas
**Doc**: PRE_PUBLISH_TESTING_CHECKLIST.md

---

### 12. Testes Funcionais Completos
- [ ] Instalação e primeiro acesso
- [ ] Cadastro de produtos
- [ ] Registro de vendas
- [ ] Consulta de estoque
- [ ] Relatórios financeiros
- [ ] Navegação entre abas
- [ ] Persistência de dados
- [ ] Testar em dispositivo de baixa performance
- [ ] Testar em diferentes tamanhos de tela
- [ ] Testar modo offline

**Tempo**: 4-8 horas
**Doc**: PRE_PUBLISH_TESTING_CHECKLIST.md

---

### 13. Revisar Permissões
- [ ] Revisar AndroidManifest.xml
- [ ] Verificar se cada permissão é necessária:
  - [ ] INTERNET - ✅ Necessário (IAP)
  - [ ] READ_EXTERNAL_STORAGE - ⚠️ Verificar se necessário
  - [ ] WRITE_EXTERNAL_STORAGE - ⚠️ Verificar se necessário
  - [ ] SYSTEM_ALERT_WINDOW - ⚠️ Verificar se necessário
  - [ ] VIBRATE - ✅ Necessário (feedback)
- [ ] Remover permissões não utilizadas
- [ ] Testar app após remoção

**Tempo**: 30 minutos
**Doc**: PRE_PUBLISH_TESTING_CHECKLIST.md

---

## 🟢 LANÇAMENTO

### 14. Checklist Final
- [ ] Todos os bloqueadores completados
- [ ] Todos os testes passaram
- [ ] Sem crashes em Internal Testing
- [ ] Feedback de testadores coletado
- [ ] Correções necessárias implementadas
- [ ] Build final gerado e testado
- [ ] Screenshots e assets finalizados
- [ ] Textos revisados

**Tempo**: 1 hora
**Doc**: PRE_PUBLISH_TESTING_CHECKLIST.md

---

### 15. Promover para Produção
- [ ] Acessar Google Play Console
- [ ] Ir para "Produção"
- [ ] Selecionar versão do Internal Testing
- [ ] Clicar em "Promover para Produção"
- [ ] Revisar todas as informações
- [ ] Confirmar e enviar
- [ ] Aguardar revisão do Google (1-7 dias)

**Tempo**: 30 minutos + espera
**Doc**: PRE_PUBLISH_TESTING_CHECKLIST.md

---

### 16. Monitoramento Pós-Lançamento
- [ ] Configurar alertas de crash no Play Console
- [ ] Monitorar reviews dos usuários
- [ ] Responder a comentários
- [ ] Acompanhar métricas de instalação
- [ ] Verificar taxa de conversão de IAP
- [ ] Coletar feedback para futuras melhorias

**Tempo**: Contínuo
**Doc**: PRE_PUBLISH_TESTING_CHECKLIST.md

---

## 📊 PROGRESSO TOTAL

Total de tarefas: 16
- Bloqueadores: 10
- Recomendados: 3
- Lançamento: 3

```
Completadas: ____ / 16
Porcentagem: ____%
```

---

## ⏱️ TEMPO TOTAL ESTIMADO

| Categoria | Tempo Estimado |
|-----------|----------------|
| Bloqueadores | 15-25 horas |
| Recomendados | 6-11 horas |
| Lançamento | 2-3 horas |
| **TOTAL** | **23-39 horas** |

(Não inclui tempo de aprovação do Google: 1-7 dias)

---

## 📝 NOTAS E OBSERVAÇÕES

_Use este espaço para anotar problemas, dúvidas ou itens adicionais:_

_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________

---

## 🆘 PRECISA DE AJUDA?

**Script de verificação**:
```bash
bash scripts/prepare-production.sh
```

**Documentos de referência**:
- Status geral: `docs/PUBLICATION_SUMMARY.md`
- Lista completa: `docs/PRE_PUBLISH_TESTING_CHECKLIST.md`
- Build/Keystore: `docs/PRODUCTION_BUILD_CONFIG.md`
- Política: `docs/PRIVACY_POLICY_TEMPLATE.md`
- Conteúdo: `docs/STORE_LISTING_CONTENT.md`
- Testes IAP: `docs/IAP_TEST_PLAN.md`

---

**Data de conclusão**: _______________

**🎉 PARABÉNS POR PUBLICAR O APP!**
