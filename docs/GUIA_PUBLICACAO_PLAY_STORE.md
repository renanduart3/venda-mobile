# Guia Definitivo de Publicação - Google Play Store

Este documento centraliza todas as especificações de imagens e o gabarito para responder aos formulários do Google Play Console de forma rápida e segura.

---

## 🎨 1. Material Gráfico (Assets Visuais)

Você deve exportar as suas imagens EXATAMENTE com as dimensões abaixo. O Google Play Console recusa o upload se um lado tiver 1 pixel a mais ou a menos.

### 1.1. Ícone do Aplicativo (Obrigatório)
O rosto do seu aplicativo na loja.
- **Tamanho:** Exatos `512 x 512` pixels.
- **Formato:** PNG de 32 bits (até 1 MB) com fundo alfa transparente ou fundo sólido não transparente (preferencial).
- **Dica:** Não coloque bordas arredondadas nem jogue sombras por fora na imagem fonte. O Google corta as bordas pra ficar naquele formato quadradinho padrão deles automaticamente. Apenas preencha o quadrado todo.

### 1.2. Gráfico de Recursos / Feature Graphic (Obrigatório)
Aquela imagem da "Capa" retangular imensa que fica no topo da pesquisa da Play Store antes de baixar o app.
- **Tamanho:** Exatos `1024 x 500` pixels.
- **Formato:** PNG ou JPEG (até 1 MB).
- **Dica:** Não coloque mensagens importantes ou logotipos muito perto das margens; concentre tudo bem no centro (Zona de Segurança / Safe Zone), pois telas diferentes cortam as bordas da Capa.

### 1.3. Capturas de Tela do Celular / Screenshots (Obrigatório)
Mostre aqui as belas telas escuras de Vendas, Relatórios e Clientes.
- **Quantidade:** Mínimo de `2` e máximo de `8` capturas.
- **Tamanho:** O ideal é usar telas com aspecto 16:9 de resolução padrão do Android. Sugestão simples e comum: `1080 x 1920` pixels.
- **Restrição:** A imagem não pode ser maior do que 2 vezes o tamanho de sua menor dimensão em largura vs altura.
- **Formato:** PNG ou JPEG em alta qualidade (até 8 MB).

### 1.4. Capturas de Tela de Tablets (Somente se reclamarem)
O Google frequentemente barra a análise e exibe um erro amarelo enchendo o saco de que "Seu aplicativo não tem screenshot para tablet...". É bom providenciar.
- **Tablet 7 polegadas:** Mínimo de 1 captura (Sugestão de tamanho: `1200 x 1920` px).
- **Tablet 10 polegadas:** Mínimo de 1 captura (Sugestão de tamanho: `2560 x 1600` px).
- *(Macete ninja: Você pode literalmente usar as mesmas imagens do celular esticadas ou aplicadas no centro de um fundo de cor sólida se o seu app não tiver interface responsiva para Tablet).*

### 1.5. Vídeo do YouTube (Opcional, porém atrativo)
- Se for fazer, faça um vídeo horizontal.
- Desative monetização e anúncios no YouTube, senão o Google Play barra o vídeo!

---

## 🏛️ 2. A Parte Burocrática (O Formulário "Conteúdo do app")

Esta é a fase que causa 99% das reprovações de desenvolvedores no mundo: **O formulário Data Safety e as Regras Brasileiras**.

### 2.1. Política de Privacidade
Li o seu documento `docs/legal/POLITICA_PRIVACIDADE.md` e percebi um **ALERTA VERMELHO 🚨**:
Lá no texto está escrito: "*Todos os dados são armazenados localmente no seu dispositivo... Não armazenamos ou transmitimos seus dados*".
Porém, reparei na sua raiz que o seu app usa o **Supabase**! 
Se o seu aplicativo usa o Supabase na nuvem para criar Contas (Authentication), você passa a reter E-mails (e até senhas hash) num servidor remoto que é SEU.
A loja cruza espiões automáticos. Se o Google baixa seu app, vê uma tela de Login, faz o Login e depois lê que sua política diz que "não coleta dados online", **eles suspendem a conta do desenvolvedor direto**.

**O que fazer:**
1. Revise e altere a `POLITICA_PRIVACIDADE.md` antes se o Supabase não for só pra consulta, mas também for usado para salvar e-mails, logs de compras ou dados diários da loja do cliente.
2. Hospede a Política na internet (GitHub Pages serve perfeitamente e é grátis).
3. Cole a URL .html dela na aba do Google.

### 2.2. Avaliação de Conteúdo (Selo IARC)
Vá na aba Avaliação de Conteúdo. O Google fará perguntas do tipo: "Tem sangue? Tem nudez? Tem apostas com dinheiro (Casino)? O app usa dados de saúde? O app se conecta com outros estranhos?".
- É só responder "Não" e seguir em frente. Seu app será oficialmente classificado como **LIVRE** em todo o planeta!

### 2.3. Formulário de Segurança dos Dados (Data Safety)

Use as respostas abaixo como gabarito (Ajustando apenas se o Supabase sincronizar de fato as vendas):

**Sessão 1: Visão Geral**
- O seu app coleta ou compartilha tipos de dados obrigatórios? **Sim** (Se as vendas ou logins forem para o Supabase e saírem do SQLite).
- Todos os dados coletados são criptografados em trânsito? **Sim** (Você vai se conectar ao Supabase por HTTPS, o que já garante criptografia SSL total do trajeto de dados).
- Você fornece um meio pro usuário solicitar que tirem a conta dele da nuvem? **Sim**.

**Sessão 2: Tipos de Dados**
Assinale apenas caixas do que você recolhe na conta online atrelada ao celular. O mais comum:
- **Informações Pessoais:** `Endereço de E-mail` e `Nome` (Se ele criar conta no seu sistema).
- **Informações Financeiras:** `Histórico de Compras` (o Google Billing registra para Premium In-App Purchases).

**Sessão 3: Uso dos Dados (Exemplo para a Caixa do E-mail)**
- O dado é coletado, compartilhado ou ambos? **Coletado** (Você guarda para o usuário fazer login. Você NÃO compartilha vendendo a lista para terceiros).
- A coleta acontece sem ficar processada/armazenada? **Não** (A conta de usuário fica guardada sim e atrelada).
- A coleta é obrigatória? **Sim** (O cara é punido/não entra no app se negar em botar um e-mail).
- Usado Por que motivo? Assinale as checkboxes: **"Funcionaidade Principal do App"** e **"Gerenciamento de Conta"**. 

### 2.4. Formulários Diversos Finais
- **Público-alvo:** Assinale as caixas a partir dos **18 anos para cima**! (Apps com regras financeiras ou PDV não atraem nem se destinam a crianças na regra de ouro da Google. Não marcar +18 atrai os censores rígidos da política de privacidade COPPA infantil para você).
- **App de Notícias:** É focado em jornal ou notícias? `Não.`
- **App Governamental/Covid:** `Não.`
- **Segurança e Recursos Financeiros:** Ele concede ou negocia empréstimos reais? `Não.` (Não se preocupe com a funcionalidade de "Fiado" do seu app, o Google Play persegue bancos/agiotas online. O seu é apenas um software anotador de controle de papel/caderno eletrônico de terceiros. Assuma como uma "Folha de Pagamentos" e responda `Não`).
