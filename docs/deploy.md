# Deploy: Render Free + Vercel, sem login

O projeto continua com os perfis simulados de doador/igreja e o mesmo design. A preparação de deploy não adiciona conta, senha, sessão ou JWT.

```text
Navegador → /api no domínio da Vercel
          → função frontend/api/proxy.js
          → API no Render, com chave adicionada somente no servidor
          → SQLite local do Render
```

O navegador nunca recebe `DEMO_API_KEY`. O React usa `/api` tanto localmente quanto em produção; não configure uma URL direta do Render no código React nem uma chave com prefixo `VITE_`.

**Limite importante:** sem login, qualquer pessoa que acesse o site pode operar os dados fictícios nos dois perfis. A chave protege o acesso direto ao Render; não identifica visitantes nem oferece autorização por usuário. O proxy público também pode ser chamado por clientes que reproduzam as requisições do site. CORS, checagem de origem e limitação de requisições reduzem abuso, mas não substituem autenticação. Não coloque dados pessoais ou reais nesta demonstração.

## 1. Criar a chave de servidor

Gere uma chave no seu terminal e guarde-a fora do Git:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

O mesmo valor deve ser cadastrado como `DEMO_API_KEY` no Render e na Vercel. O código exige no mínimo 32 caracteres sem espaços e não tem senha/chave padrão. O comando acima gera 64 caracteres hexadecimais. Nunca coloque o valor no README, `vercel.json`, `render.yaml`, variável `VITE_*`, commit ou mensagem pública.

Os arquivos `.env.example` são modelos sem credenciais. Arquivos `.env`, `.env.local`, `.env.production` e semelhantes são ignorados pelo Git.

## 2. Render: backend

Crie um **Web Service** conectado ao repositório `matheuspm05/DoaES`:

| Campo             | Valor               |
| ----------------- | ------------------- |
| Branch            | `main`              |
| Language/Runtime  | Node                |
| Root Directory    | `backend`           |
| Build Command     | `npm ci --omit=dev` |
| Start Command     | `npm start`         |
| Instance Type     | Free                |
| Health Check Path | `/api/health`       |

Variáveis do Render:

| Variável          | Valor                                                          |
| ----------------- | -------------------------------------------------------------- |
| `NODE_ENV`        | `production`                                                   |
| `DEMO_API_KEY`    | A chave aleatória gerada no passo 1                            |
| `ALLOWED_ORIGINS` | A URL exata do frontend, como `https://seu-projeto.vercel.app` |
| `API_RATE_LIMIT`  | `600` (opcional; padrão por IP/minuto)                         |
| `PORT`            | Não precisa preencher; o Render fornece                        |

`package.json` fixa a família Node `24.x`. Não substitua por Node 20/22: o projeto utiliza o SQLite integrado ao Node 24. Se houver um `NODE_VERSION` antigo no painel, remova-o ou selecione uma versão 24, porque ele tem prioridade sobre `engines`.

O servidor escuta `process.env.PORT || 3001` em `0.0.0.0`. O seed é executado no `npm start`, depois da abertura/migração do banco e antes de a API receber requisições. Em produção, a inicialização falha se a chave não estiver configurada corretamente.

Se ainda não tiver a URL da Vercel, `ALLOWED_ORIGINS` pode ficar vazia inicialmente no Render: isso bloqueia todas as origens de navegador. O proxy da Vercel continua podendo conectar com sua chave, pois não encaminha `Origin`. Depois preencha com a URL final. Use origens exatas separadas por vírgula, sem caminho ou `*`; em produção, somente HTTPS.

O arquivo `render.yaml` permite criar o serviço por Blueprint com esses mesmos campos. No Blueprint, a chave pode ser gerada pelo Render; nesse caso, copie o valor gerado para a variável privada da Vercel. Não crie um segundo serviço se já tiver configurado o primeiro manualmente.

Depois do deploy, anote a URL, por exemplo `https://doaes-api-xxxx.onrender.com`. Abra `https://doaes-api-xxxx.onrender.com/api/health`: deve retornar JSON com `status: online`. Essa rota fica pública para health checks. Uma chamada direta a `/api/igrejas`, sem chave, deve retornar `401`.

## 3. Vercel: frontend e proxy privado de servidor

Importe o mesmo repositório como projeto:

| Campo             | Valor                  |
| ----------------- | ---------------------- |
| Production Branch | `main`                 |
| Root Directory    | `frontend`             |
| Framework Preset  | Vite                   |
| Node.js Version   | `24.x`                 |
| Install Command   | `npm ci --include=dev` |
| Build Command     | `npm run build`        |
| Output Directory  | `dist`                 |

O arquivo **`frontend/vercel.json`** já configura instalação/build, os rewrites de `/api`, as rotas do React e os headers básicos. Não copie esse arquivo para dentro de `dist`, nem selecione a raiz inteira do repositório como Root Directory.

Adicione estas variáveis no ambiente **Production** da Vercel:

| Variável          | Valor                                                                               |
| ----------------- | ----------------------------------------------------------------------------------- |
| `RENDER_API_URL`  | Origem HTTPS do backend, como `https://doaes-api-xxxx.onrender.com`, **sem `/api`** |
| `DEMO_API_KEY`    | Exatamente a mesma chave configurada no Render                                      |
| `ALLOWED_ORIGINS` | Origem HTTPS do frontend, como `https://seu-projeto.vercel.app`                     |

As três são variáveis de execução do servidor, **sem prefixo `VITE_`**. Nenhuma precisa entrar no build público do React. Marque a chave como sensível no painel quando essa opção estiver disponível. Não é necessário configurar `VITE_API_URL`.

A função também reconhece as URLs gerenciadas `VERCEL_URL` e `VERCEL_PROJECT_PRODUCTION_URL`, fornecidas pela própria plataforma. Isso ajuda no primeiro deploy, antes de você preencher o domínio final. Para domínio personalizado, acrescente a origem exata em `ALLOWED_ORIGINS` e faça novo deploy. Não se usa o cabeçalho `Host` enviado pelo visitante para determinar origens confiáveis.

Deixe **Fluid Compute habilitado**. A função tem duração máxima de 120 segundos e timeout de conexão/resposta de 95 segundos para acomodar a inicialização do Render Free. Em vez de encaminhar uma página HTML de cold start ao React, ela retorna um erro JSON que permite tentar novamente.

Depois de preencher ou alterar variáveis, faça **Redeploy** para aplicá-las. No primeiro deploy, atualize a URL final também no Render. Para habilitar Preview, configure esse ambiente explicitamente; para apresentações isoladas, prefira um backend de demonstração separado. Não é necessário habilitar Preview para publicar Production.

## 4. SQLite no plano Free

O arquivo padrão continua em `backend/data/doaes.sqlite`. Não é enviado ao Git; o esquema e os dados iniciais são recriados pelo código. O seed contém igrejas e pessoas fictícias, categorias, campanhas e exemplos de doações.

- Enquanto o arquivo existe, reiniciar o processo reaplica o seed de forma idempotente, preservando alterações e novas doações.
- Quando o Render descarta o sistema de arquivos no redeploy, restart ou suspensão, o SQLite anterior é perdido. No próximo início, o seed cria uma nova demonstração com os dados iniciais.
- O Free pode suspender após 15 minutos de inatividade e levar aproximadamente um minuto para iniciar de novo. Não existe garantia de persistência de SQLite nesse plano.
- Não há rotina destrutiva de reset a cada início nem serviço para impedir suspensão. A perda de dados decorre do armazenamento efêmero da plataforma.
- `SQLITE_PATH` é uma opção de servidor para apontar para outro arquivo; não é necessário preenchê-la no Render Free e ela não torna o armazenamento persistente. Os testes usam essa opção com arquivos temporários fora do projeto.

Não use esse deploy como cadastro real de doações ou backup. É uma apresentação acadêmica descartável.

## 5. Proteções implementadas

- Chave compartilhada apenas entre Vercel e Render; comparação por digest com `timingSafeEqual` no backend.
- Sem chave padrão e sem fallback que abra a API em produção quando falta configuração.
- `/api/health` público; demais endpoints exigem chave no Render em produção.
- CORS com lista de origens exatas e rejeição explícita de origem não permitida no Express.
- Proxy com lista de métodos, caminhos e parâmetros permitidos; não é um proxy aberto para URLs escolhidas pelo visitante.
- Escritas exigem JSON e origem do site permitida, com limite de 100 KB. Essa checagem é defesa de origem, não identidade.
- Proxy não encaminha cookies, autorização, `Host`, IPs/cabeçalhos arbitrários ou chave fornecida pelo visitante.
- Sem cache de respostas da API; headers contra interpretação incorreta de conteúdo.
- Limite de requisições em memória no backend, com resposta `429` e `Retry-After`. Reinicia com o processo, não é uma proteção distribuída contra DDoS.
- Fotos continuam sendo prévias locais. Não há upload, login real ou alteração no design.

## 6. Desenvolvimento local e testes

O fluxo local continua igual:

```powershell
# Na raiz, com as dependências do frontend/backend já instaladas:
npm run dev
```

O Vite encaminha `/api` diretamente para `127.0.0.1:3001`. Em desenvolvimento, sem `DEMO_API_KEY`, a demonstração local continua aberta. Não copie as variáveis de produção para o frontend React. Para simular a produção protegida, utilize os testes isolados abaixo.

```powershell
npm test
npm run build
npm run lint
# Com o frontend local aberto em outro terminal:
npm run test:ui
```

`npm test` inclui os testes existentes da API e `test/deployment.test.js`. Os testes de deploy exercitam API protegida, proxy, origens inválidas, chave incorreta, limites de tamanho/requisições, fluxo de doação até conclusão, alteração de igreja/campanhas, erros de inicialização, porta/host do servidor real, persistência em restart e recriação quando o arquivo SQLite é perdido. Também compilam o React com credenciais de teste no ambiente do servidor e verificam que os valores não aparecem nos arquivos JavaScript gerados.

O proxy é testado com HTTP local controlado; a configuração de produção exige HTTPS. Os testes não precisam de conta na Vercel/Render e não alteram o SQLite da apresentação.

Nesta preparação passaram 17 testes (10 da API e 7 de deploy), build, ESLint e as 39 visitas do teste de interface. O teste de produção também serviu o bundle compilado no navegador, sem interceptar as requisições de API, e concluiu uma doação pelo proxy protegido sem expor a chave ao cliente. O arquivo `vercel.json` foi conferido contra os campos do schema oficial. A publicação efetiva depende das contas, domínios e variáveis abaixo configurados nos painéis.

## 7. Conferir depois de publicar

1. Abra `/`, atualize uma rota interna como `/doador/historico` e confirme que não há 404 da Vercel.
2. No navegador, confirme que as requisições vão para `/api` no domínio da Vercel e que não existe `X-Doaes-Key` ou outra credencial enviada pelo JavaScript público.
3. Crie uma doação fictícia, alterne para a igreja destinatária, aceite, agende, conclua e volte ao histórico do doador.
4. Abra diretamente a URL do Render em `/api/igrejas`: deve retornar `401`. `/api/health` deve retornar `200`.
5. Se a Vercel responder `503`, confira `RENDER_API_URL`, a chave nos dois serviços, `ALLOWED_ORIGINS` e os logs da função; aguarde o despertar do Render antes de repetir.

O repositório fica preparado para deploy; o funcionamento nos domínios definitivos precisa ser conferido depois que os serviços e suas variáveis forem criados. Os testes locais não são uma afirmação de deploy já publicado.

## Referências oficiais

- [Render: Web Services e bind em 0.0.0.0](https://render.com/docs/web-services)
- [Render: planos Free, suspensão e arquivos efêmeros](https://render.com/docs/free)
- [Render: seleção da versão do Node](https://render.com/docs/node-version)
- [Vercel: Vite, funções e SPA](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel: configuração de rewrites e funções](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel: duração das funções](https://vercel.com/docs/functions/configuring-functions/duration)
- [Express: CORS não autentica clientes](https://expressjs.com/en/resources/middleware/cors/)
