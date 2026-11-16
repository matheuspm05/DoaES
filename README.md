# DoaES — Solidariedade que conecta

MVP acadêmico em React/Vite, Node.js 24, Express e SQLite (`node:sqlite`), para doações em Vila Velha e Vitória. Há **cadastro e autenticação reais**, com contas DOADOR e IGREJA, sessões HTTP-only e permissões no servidor. Utilize somente dados fictícios: as igrejas do seed não representam parcerias oficiais.

## Desenvolvimento local

Com Node.js 24, instale as dependências a partir da raiz:

```powershell
npm ci
npm --prefix backend ci
npm --prefix frontend ci
npm run seed
npm run dev
```

Frontend: http://localhost:5173. Backend: porta 3001. O Vite encaminha `/api` para o Express. `Ctrl+C` encerra os processos iniciados pelo script. Não precisa de serviços externos ou banco adicional.

O backend lê `backend/.env` quando iniciado na pasta backend. Use `backend/.env.example` como referência. Sem `SESSION_SECRET` em desenvolvimento, é gerado um segredo aleatório persistido no próprio SQLite; em produção a variável é obrigatória. Nunca utilize segredos prefixados por `VITE_`.

## Contas e ciclo completo

1. Abra `/cadastro/igreja` e crie uma igreja fictícia com e-mail único, senha de pelo menos 10 caracteres e categorias aceitas.
2. No painel, configure coleta se desejar e crie uma campanha.
3. Clique em **Sair da conta**. Cadastre um doador em `/cadastro/doador`, usando outro e-mail.
4. Consulte a campanha e crie uma doação. Para alimentos, informe validade e condição novo/lacrado.
5. Saia e entre com a igreja. Em Solicitações, aceite ou recuse. Após aceite, agende data/período e confirme o recebimento.
6. Saia e entre com o doador. Confira o histórico e a conclusão.
7. Atualizar a página mantém a sessão por até 8 horas. Reiniciar o backend local preserva contas, sessões e doações, enquanto o arquivo SQLite existir.

O perfil do doador e as configurações da igreja são salvos no banco. Não há seletor livre de identidade nem credenciais no localStorage.

## Seed

`npm run seed` cria/migra o banco e insere dados fictícios de forma idempotente. Não remove registros, não sobrescreve alterações e não cria contas com senhas públicas. Os registros antigos do seed continuam preservados, sem acesso público às suas doações.

Para acessar perfis do seed **somente localmente**, escolha uma senha fora do Git:

```powershell
$env:LOCAL_SEED_PASSWORD = 'substitua-por-uma-senha-local'
npm run seed:accounts
Remove-Item Env:LOCAL_SEED_PASSWORD
```

E-mails de exemplo: `doador1@exemplo.invalid` e `igreja1@exemplo.invalid`. A senha é a fornecida por você, armazenada com scrypt/salt. O comando recusa execução com `NODE_ENV=production` e não substitui contas existentes. O cadastro pela interface é preferível para testar contas novas.

## Verificação

```powershell
npm run build
npm run lint
npm test
# Com o Vite aberto em outro terminal:
npm run test:ui
```

Os testes usam bancos isolados; não alteram o banco da apresentação. Os testes de navegador usam Chrome/Edge instalado; `BROWSER_PATH` permite indicar outro executável compatível.

## Limitações

- Upload de fotos **não implementado**. O controle foi retirado do formulário; o componente de prévia foi preservado para trabalho futuro.
- O contato da landing continua explicitamente simulado, sem envio de mensagens.
- Sem recuperação de senha, verificação de e-mail ou notificações externas nesta versão.
- SQLite no Render Free é efêmero: contas, sessões e doações podem desaparecer em suspensão/restart/redeploy. Não há persistência durável nesse plano.
- Deploy real: **NÃO VERIFICADO** nesta implementação; nenhum serviço externo foi alterado.

Veja [arquitetura](docs/arquitetura.md) e [deploy](docs/deploy.md).
