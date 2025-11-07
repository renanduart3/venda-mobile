## Checklist de Publicação (Google Play)

### 1) Preparação local
- [ x ] Gerar keystore de upload (apenas uma vez)
  - `keytool -genkeypair -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 36500`
  - Mover para `android/app/upload-keystore.jks`
- [ x ] Definir variáveis de ambiente no terminal antes do build
  - `set UPLOAD_STORE_PASSWORD=SUASENHA`
  - `set UPLOAD_KEY_ALIAS=upload`
  - `set UPLOAD_KEY_PASSWORD=SUASENHA`
- [x] Conferir versão
  - `android/app/build.gradle` → `versionCode` (incrementar cada upload), `versionName`

### 2) Build do artefato
- [ ] Gerar AAB de release
  - `npm run build:android:release`
  - Saída: `android/app/build/outputs/bundle/release/app-release.aab`

### 3) Play Console — criação do app
- [ ] Criar app (nome, idioma, país, tipo app/jogo, gratuito/pago)
- [ ] Ativar Assinatura de apps pelo Google Play (usar seu keystore como chave de upload)
- [ ] Ficha da loja
  - Título, descrição curta/longa
  - Ícone 512×512, Feature Graphic 1024×500
  - Screenshots (telefone e, se aplicável, tablet)
  - Categoria e contato (e-mail, site opcional)

### 4) Políticas e declarações
- [ ] Política de privacidade (URL pública)
- [ ] Segurança de dados (formulário de dados coletados/compartilhados)
- [ ] Classificação de conteúdo (IARC)
- [ ] Declarações (ex.: contém anúncios? permissões especiais?)
- [ ] Acesso ao app (se precisar de login, fornecer credenciais de teste)

### 5) Subida e testes
- [ ] Enviar `.aab` no track de Teste Interno
- [ ] Adicionar testadores, instalar via link, validar fluxo principal
- [ ] Monitorar ANRs/crashes; corrigir se necessário

### 6) Lançamento
- [ ] Promover para Teste fechado/aberto ou Produção
- [ ] Acompanhar revisão do Google e métricas pós-lançamento

### Boas práticas
- Mantener `versionCode` sempre crescente em `android/app/build.gradle`
- Remover permissões não utilizadas do `AndroidManifest.xml`
- Preencher a Segurança de dados de forma fiel ao app
- Descrever claramente funcionalidades na ficha da loja


