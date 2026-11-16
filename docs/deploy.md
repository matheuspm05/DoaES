# Deploy — Vercel + Render Free

Autenticação real com sessões HTTP-only no SQLite. O navegador usa `/api` na mesma origem; a função Vercel encaminha cookie/CSRF e acrescenta a chave privada para o Render. Nenhum segredo entra no React. Nenhum deploy foi executado nesta tarefa: domínios publicados estão **NÃO VERIFICADOS**.

## Render

Web Service, branch `main`, Root Directory `backend`, Node **24.x**, plano Free:

| Campo  | Valor               |
| ------ | ------------------- |
| Build  | `npm ci --omit=dev` |
| Start  | `npm start`         |
| Health | `/api/health`       |

| Variável          | Configuração                                                               |
| ----------------- | -------------------------------------------------------------------------- |
| `NODE_ENV`        | `production`                                                               |
| `DEMO_API_KEY`    | Chave aleatória de 32 a 256 caracteres, igual na Vercel                    |
| `SESSION_SECRET`  | Outro segredo aleatório, pelo menos 32 caracteres, somente no Render       |
| `ALLOWED_ORIGINS` | Origem HTTPS exata do frontend; várias separadas por vírgula               |
| `API_RATE_LIMIT`  | Opcional, padrão 600 requisições/IP/minuto                                 |
| `PORT`            | Fornecida pelo Render; servidor usa host `0.0.0.0`                         |
| `SQLITE_PATH`     | Opcional; padrão `backend/data/doaes.sqlite`, não torna o Free persistente |

Gere **cada segredo separadamente** no terminal e cadastre nos painéis, fora do Git:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

O Blueprint `render.yaml` contém as configurações base e geração dos dois segredos. Se usar Blueprint, copie somente `DEMO_API_KEY` para a Vercel. Não configure `LOCAL_SEED_PASSWORD` em produção. Inicialização aplica migrações aditivas e seed, sem reset do banco. Falta de segredo em produção impede o servidor de iniciar.

## Vercel

Importe o repositório com Root Directory `frontend`, framework Vite, Node 24.x e branch `main`.

| Campo   | Valor                  |
| ------- | ---------------------- |
| Install | `npm ci --include=dev` |
| Build   | `npm run build`        |
| Output  | `dist`                 |

Variáveis de servidor, sem prefixo `VITE_`:

- `RENDER_API_URL`: origem HTTPS do backend, sem `/api`.
- `DEMO_API_KEY`: igual à do Render.
- `ALLOWED_ORIGINS`: origem HTTPS exata do frontend, sem caminho.

O proxy também reconhece `VERCEL_URL` e `VERCEL_PROJECT_PRODUCTION_URL` fornecidas pela plataforma. Cadastre domínio personalizado explicitamente. Nunca utilize Host enviado pelo cliente para estabelecer confiança. Após alterações de variáveis, faça redeploy quando for publicar.

`frontend/vercel.json` mantém rewrites `/api` para a função e demais rotas para a SPA. A função tem duração de 120 segundos e timeout de 95 segundos; use Fluid Compute habilitado para acomodar o despertar do Render.

## Cookies, CSRF e autorização

O cookie `doaes.sid` é opaco, assinado, HTTP-only, SameSite=Lax e Path=/api; em produção é sempre Secure. O Secure é decidido pelo ambiente do servidor, sem confiar em X-Forwarded-Proto enviado pelo visitante. A API não precisa inferir HTTPS através de headers arbitrários. O navegador acessa HTTPS na Vercel e o proxy conecta por HTTPS ao Render.

A sessão expira em 8 horas, é armazenada no SQLite e rotacionada no login/cadastro. Logout elimina a sessão no banco. A Vercel encaminha somente esse cookie e devolve Set-Cookie sem Domain, fazendo o navegador vinculá-lo ao domínio do frontend. Authorization, cookies alheios, Host e headers de proxy não são encaminhados.

`/auth/me` inicializa a sessão e devolve CSRF. Escritas exigem token correspondente via X-CSRF-Token; o React mantém esse token apenas em memória. O proxy exige origem permitida nas escritas. No Render, a chave protege o acesso direto e a sessão identifica o usuário; titularidade é verificada no servidor para consultas e alterações. Há limite geral de requisições e limite persistido de 10 tentativas de login por e-mail/15 minutos. A implementação utiliza sessão opaca própria, sem MemoryStore ou JWT.

## Persistência e limites

Enquanto o arquivo local existir, contas, sessões e doações sobrevivem ao reinício do processo. O seed é idempotente e não elimina contas criadas pela interface.

No Render Free, arquivos locais são efêmeros: SQLite, contas e sessões podem ser perdidos após suspensão, restart ou redeploy. O seed recria exemplos, mas **não recupera contas cadastradas**. Não há credenciais fixas de acesso em produção nem garantia de persistência durável. A apresentação local evita depender desse armazenamento efêmero. Veja a [documentação do Render Free](https://render.com/docs/free).

Fotos não são enviadas nem armazenadas. O contato da landing continua simulado. Igrejas do seed são fictícias e não indicam parceria oficial.

## Conferência depois de publicar

1. Abra a landing sem login; as chamadas não devem carregar doações nem lista de doadores.
2. Cadastre uma igreja e um doador distintos. Confirme sessão após atualizar, logout e novo login.
3. Edite o perfil, crie campanha, doe, aceite/agende/conclua e confira o histórico.
4. Confira Set-Cookie HTTP-only/Secure/Lax, cookie de mesma origem e ausência de X-Doaes-Key no navegador.
5. Confirme que acesso direto ao Render sem chave recebe 401, exceto health.
6. Confirme que outra conta não lê detalhe/endereço nem altera recursos mudando IDs; escritas sem CSRF recebem 403.
7. Atualize uma rota interna para conferir o rewrite da SPA e valide cold start/retentativa.

Testes locais: `npm test`, `npm run build`, `npm run lint` e `npm run test:ui` (Vite aberto). Eles não equivalem a validar os domínios publicados.

Referências: [Node crypto/scrypt](https://nodejs.org/docs/latest-v24.x/api/crypto.html), [OWASP sessões](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [Render web services](https://render.com/docs/web-services), [Vercel Vite](https://vercel.com/docs/frameworks/frontend/vite).
