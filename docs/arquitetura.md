# Arquitetura e responsabilidades

A stack e o design foram preservados. Backend em Node.js 24/Express, frontend em React/Vite, um único SQLite. Não há JWT ou armazenamento de autenticação no localStorage.

## Backend

- `src/server.js`: configuração, abertura do banco, migrações aditivas, seed e bind PORT/0.0.0.0.
- `src/config.js`: valida variáveis, origens e segredos. Produção falha se faltar chave ou segredo de sessão.
- `src/app.js`: headers, CORS, chave entre servidores, limite de requisições, JSON, sessão, CSRF e rotas.
- `src/routes/auth.js`: cadastro/login/logout/me e edição do perfil do doador. Cadastro vincula usuário e perfil na mesma transação.
- `src/services/auth.js`: hash scrypt com salt e projeção segura do usuário (sem hash).
- `src/middleware/auth.js`: sessões opacas persistidas, rotação do cookie, CSRF e verificações de titularidade.
- `src/routes/{churches,campaigns,donations}.js`: autenticação e autorização antes de chamar os serviços existentes.
- `src/services/`: regras de igrejas, campanhas e transições das doações.
- `src/repositories/`: SQL por recurso. Listagem de doações usa campos explícitos e não inclui endereço de coleta. Detalhe exige titularidade e pode incluir endereço.
- `src/validators/donation.js`: valida itens, validade de alimentos, categorias e disponibilidade de coleta.
- `src/database/index.js`: esquema e migrações aditivas; chaves estrangeiras e transações.
- `src/database/seed.js`: seed fictício idempotente, sem contas públicas predefinidas.
- `src/database/seedAccounts.js`: contas opcionais locais com senha fornecida via ambiente.

As tabelas existentes foram mantidas. `usuarios` associa cada conta a exatamente um doador ou igreja, com e-mail único e hash. `sessoes` armazena hash do identificador, usuário opcional, CSRF e expiração; `auth_tentativas` limita tentativas por e-mail; `configuracao_local` guarda segredo gerado somente no desenvolvimento. Foi acrescentado `contato` a `doadores_demo`. Não há exclusão de dados antigos.

## Endpoints

Públicos para visitantes pelo proxy: health, categorias, listagem/detalhe de igrejas e campanhas. O catálogo global de doadores foi retirado.

- `GET /api/auth/me`: usuário atual ou null e token CSRF; inicializa sessão anônima quando necessário.
- `POST /api/auth/register`: DOADOR ou IGREJA, dados validados e senha confirmada; autentica após criar a conta.
- `POST /api/auth/login`: valida credenciais, limita tentativas e rotaciona sessão.
- `POST /api/auth/logout`: invalida sessão no banco e expira cookie.
- `PATCH /api/auth/profile`: altera somente o doador da sessão.
- PATCH de igrejas: exige igreja titular.
- POST/PATCH de campanhas: exige igreja titular; não aceita transferência de propriedade.
- GET de doações: exige sessão e filtra obrigatoriamente pelo perfil; parâmetros não ampliam o acesso.
- GET detalhe de doação: somente doador responsável ou igreja destinatária.
- POST doação: somente doador; identidade derivada da sessão.
- PATCH decisão/agendamento/conclusão: somente igreja destinatária; regras de status preservadas.

Toda escrita exige `X-CSRF-Token` correspondente à sessão. CORS não substitui sessão/autorização. A chave Vercel–Render tampouco identifica usuários.

## Frontend

`contexts/AuthProvider.jsx` restaura `/auth/me`, mantém usuário em memória e deriva o perfil da sessão. As consultas públicas independem das privadas; somente áreas privadas carregam doações. A landing continua disponível se a sessão ou as doações falharem. Campanhas mostram carregamento/erro e tentativa novamente.

`services/http.js` usa `/api`, cookie da mesma origem e CSRF em memória. Login e cadastro reais substituíram os formulários simulados. `RoleGate` espera a restauração e exige perfil correto. `AppLayout` mostra a identidade autenticada e logout, sem seletores. `DonorProfile` salva no backend. `DonationDetail` busca o detalhe autorizado separadamente da listagem resumida.

As rotas continuam separadas em públicas, exploração, doador e igreja. Os componentes e CSS existentes foram mantidos, incluindo landing com foto/logo, campanhas e contato. `PhotoPreview` permanece isolado e não é renderizado no cadastro de doações.

## Proxy e testes

`frontend/server/proxy.js` mantém allowlist de caminhos/métodos, limite de payload, timeout e defesa de origem. Encaminha somente o cookie `doaes.sid` e o token CSRF, acrescenta a chave privada e repassa Set-Cookie sem Domain. Não confia em Host, Authorization ou forwarded headers fornecidos pelo visitante.

`backend/test/` cobre regras existentes, autenticação, titularidade, CSRF e privacidade. `test/deployment.test.js` cobre proxy, cookies, segredos, boot e reinício; `scripts/ui-smoke.js` cobre navegação desktop/mobile, fluxo anterior com login real e cadastro de duas contas novas. Fixtures de teste têm senhas aleatórias e não participam do seed de produção.
