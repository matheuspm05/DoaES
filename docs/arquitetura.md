# Organização e responsabilidades do DoaES

A aplicação continua com React/Vite, Express e SQLite em JavaScript. As rotas públicas da API, os dados existentes e o ciclo da doação foram preservados. A reorganização distribui o código por recurso e responsabilidade, sem introduzir serviços externos ou novas dependências.

## Backend

```text
backend/src/
  server.js               Abre o banco, executa seed idempotente e inicia a API
  app.js                  Configura Express, CORS, JSON, rotas e erros
  routes/
    api.js                Compõe as rotas /api, sem SQL ou regras de doação
    health.js             Estado da API
    catalog.js            Categorias e doadores fictícios
    churches.js           Endpoints de igrejas
    campaigns.js          Endpoints de campanhas
    donations.js          Endpoints do ciclo da doação
  services/
    churches.js           Regras para alterar categorias e condições de coleta
    campaigns.js          Validação de campanhas e alterações permitidas
    donations.js          Criação, decisões, agendamento e recebimento
  repositories/
    records.js            Consulta por ID com tabelas permitidas
    catalog.js            Consultas do catálogo
    churches.js           SQL de igrejas e categorias aceitas
    campaigns.js          SQL de campanhas
    donations.js          SQL de doações, itens, agendamentos e eventos
  validators/
    donation.js           Validação dos dados e itens de uma nova doação
  middleware/
    validateJson.js       Valida o corpo das requisições de escrita
    errorHandler.js       Converte erros em respostas JSON consistentes
  utils/
    errors.js             ApiError e verificação de condições
    validation.js         Textos, limites e IDs
    dates.js              Datas válidas e data atual em São Paulo
  database/               Conexão, esquema, migração aditiva, seed e transações
```

Uma alteração passa por **rota → serviço → repositório → SQLite**. A rota conhece HTTP; o serviço conhece as regras; o repositório conhece SQL. Consultas simples sem regra de negócio, como o catálogo, podem ir da rota ao repositório diretamente.

Por exemplo, `PATCH /api/doacoes/:id/agendamento` entra em `routes/donations.js`, chama `scheduleDonation` em `services/donations.js`, valida que a doação está aceita e usa `saveSchedule` no repositório. A atualização do agendamento e o evento da linha do tempo ficam na mesma transação. Nenhuma dessas regras depende de objetos `req` ou `res` dentro do serviço.

As URLs e respostas continuam iguais: `/api/health`, `/api/categorias`, `/api/doadores-demo`, `/api/igrejas`, `/api/campanhas` e `/api/doacoes`, incluindo detalhes e operações existentes. Não há autenticação de usuários nem upload de arquivos. Em produção, a API exige uma chave de servidor, adicionada pelo proxy da Vercel; veja o [guia de deploy](deploy.md).

## Frontend

```text
frontend/src/
  App.jsx                 Monta o roteador, o contexto e as rotas
  routes/
    AppRoutes.jsx         Reúne a configuração das quatro áreas
    publicRoutes.jsx      Landing, acesso e cadastros demonstrativos
    browseRoutes.jsx      Explorar igrejas e campanhas
    donorRoutes.jsx       Painel e rotas do doador
    churchRoutes.jsx      Painel e rotas da igreja
  layouts/
    LandingLayout.jsx     Cabeçalho e rodapé exclusivos da landing
    PublicLayout.jsx      Layout público de acesso, cadastros e exploração
    AppLayout.jsx         Estrutura dos painéis e troca de contexto demo
    RoleGate.jsx          Restrição visual por perfil, sem autorização real
    BrowseLayout.jsx      Escolhe o layout da exploração
    ScrollTop.jsx         Restaura a posição ao mudar de página
    navigation.js         Itens do menu por perfil
  pages/
    public/               Home, Login e Register em arquivos separados
    browse/               Uma página por lista ou detalhe público
    donor/                Nova doação e perfil do doador
    church/               Configurações e gerenciamento de campanhas
    shared/               Painel, histórico e detalhe usados nos dois perfis
  components/
    landing/              Marca, cabeçalho, abertura, campanhas, contato e rodapé
    ui/                   Botão, campo, títulos, busca, vazio e mensagem de erro
    brand/                Marca existente usada nos painéis
    campaigns/            Cartão de campanha
    churches/             Cartão de igreja
    donations/            Lista de doações e indicador de status
    categories/           Ícone de categoria
    illustrations/        Ilustração usada nos painéis e acesso
    index.js              Reexporta os componentes; não contém implementação
    PhotoPreview.jsx      Prévia local e limpeza de URLs temporárias de fotos
  services/
    http.js               Único local que utiliza fetch e trata respostas
    api/                  Um cliente por recurso: igrejas, campanhas, doações e catálogo
    demo.js               Carrega os dados compartilhados uma única vez por atualização
  contexts/               Perfil demo, seleção de contexto e feedback
  constants/              Rótulos de status e períodos de agendamento
  utils/                  Formatação e cálculo de datas
  styles/                 Tokens/base, páginas públicas, painéis, catálogo,
                          formulários, doações, responsividade e landing
  images/                 Fotografia fornecida pelo responsável
  logos/                  Logo fornecida pelo responsável
```

Uma ação de tela usa **página → cliente do recurso → http.js → /api**. Localmente o proxy do Vite conecta ao Express; em produção, a função da Vercel adiciona a chave privada e conecta ao Render. Por exemplo, a página de nova doação chama `donationsApi.create`, sem construir endpoints ou decidir métodos HTTP. O contexto usa `loadDemoData` tanto na carga inicial quanto nas atualizações, evitando duplicação dessa composição.

`App.css` apenas importa os arquivos de estilos por responsabilidade. As implementações dos componentes antes concentrados em `ui.jsx` foram distribuídas por pasta; `components/index.js` serve apenas como índice de importações. As páginas compartilhadas recebem propriedades do perfil para reutilizar o fluxo existente.

## Landing page

A landing contém **novo topo com foto e logo, campanhas e contato**, conforme a escolha do responsável. Os estilos específicos estão em `styles/landing.css`, com classes próprias para não alterar a aparência dos painéis. O cabeçalho da landing navega entre Início, Campanhas e Contato, e oferece Entrar/Cadastrar.

A foto de `images/convento-n-s-da-penha.jpg` e a logo de `logos/Logo de Coração com Mãos Verdes.png` são utilizadas diretamente e mantidas nos diretórios fornecidos. A fotografia representa a região e não significa parceria com a instituição retratada. As campanhas continuam sendo consultadas da mesma API e levam aos detalhes funcionais.

O contato tem **simulação de envio identificada**: valida os campos e mostra retorno na própria interface, sem fazer requisição, enviar e-mail ou salvar dados. Não existe endereço de contato institucional confirmado; não foi inventado um destinatário nem utilizado e-mail pessoal. Login, cadastro e fotos também continuam demonstrativos.

## Como manter

- Para alterar uma regra de doação, comece em `backend/src/services/donations.js`; para os campos dos itens, em `validators/donation.js`.
- Para alterar SQL, use o repositório do recurso. Não acrescente SQL em rotas ou componentes React.
- Para adicionar uma operação da API no frontend, acrescente-a ao cliente de `services/api/` correspondente e chame esse cliente na página.
- Para adicionar uma página, registre-a no arquivo da respectiva área em `routes/`.
- Para mudar a landing, altere somente seus componentes e `styles/landing.css`.

Validação a partir da raiz:

```powershell
npm test
npm run build
npm run lint
# Com o frontend aberto em outro terminal:
npm run test:ui
```

Os testes de API usam SQLite temporário. O teste de navegador também usa API em memória e intercepta apenas URLs que começam com `/api/`, deixando os módulos JavaScript da pasta `services/api/` serem servidos normalmente pelo Vite. Nenhuma operação de teste precisa apagar ou alterar o banco da apresentação.

Nesta reorganização, build e ESLint passaram, os 10 testes de API passaram e o navegador completou 39 visitas. O fluxo de doação foi exercitado do cadastro até a conclusão. A landing foi verificada em 320, 375, 768 e 1440 pixels, incluindo carregamento dos ativos fornecidos, menu móvel e contato simulado, sem erros JavaScript ou rolagem horizontal. As capturas ficam em `test-results/`, ignoradas pelo Git.
