# DoaES — Solidariedade que conecta

Demonstração acadêmica local de uma plataforma de doações entre pessoas e **igrejas totalmente fictícias**, com foco em Vila Velha e Vitória (ES). Interface em português, React + Vite, Express e SQLite via `node:sqlite`, em JavaScript/JSX.

**Modo demonstração:** login, cadastro e seleção de perfis são simulados. Não há autenticação de usuário, senha, JWT ou sessão. O deploy usa uma chave entre servidores para bloquear o acesso direto ao backend, sem colocá-la no React. Sem login, visitantes do site podem operar os dados fictícios da demo; não há permissões por pessoa. Não utilize informações reais. As igrejas de exemplo não são parceiras reais.

## Deploy no Render Free e na Vercel

As configurações dos serviços, variáveis privadas, rotas e limitações do SQLite estão no [guia de deploy](docs/deploy.md). O frontend permanece React/Vite e usa `/api`; na Vercel, uma função adiciona a credencial de servidor e conecta ao Render. No ambiente local, o proxy do Vite continua conectando diretamente ao Express.

O Render Free tem armazenamento efêmero: alterações no SQLite podem desaparecer em suspensão, restart ou redeploy. O seed automático recria os dados fictícios quando o arquivo não existe. Não há garantia de persistência nesse plano.

## Executar no Windows PowerShell

Requisitos: Node.js **24** e npm. Não exige banco externo, ferramenta global, Docker ou serviços pagos.

Na pasta do projeto, instale as dependências e inicialize o banco:

```powershell
cd backend
npm install
npm run seed
cd ../frontend
npm install
cd ..
npm run dev
```

O comando da raiz inicia os dois processos: frontend em **http://localhost:5173** e API na porta **3001**. `Ctrl+C` encerra os processos iniciados pelo script. A porta do Vite é fixa; se estiver ocupada, encerre o servidor anterior. O Vite encaminha `/api` ao Express em `127.0.0.1:3001`. O arquivo padrão é `backend/data/doaes.sqlite`; o servidor admite `SQLITE_PATH` para testes isolados e ambientes configurados.

Para iniciar em dois terminais, a partir da raiz:

```powershell
# Terminal 1
cd backend
npm run seed
npm run dev
```

```powershell
# Terminal 2
cd frontend
npm run dev
```

Build e verificações:

```powershell
cd frontend
npm run build
npm run lint
cd ../backend
npm test
```

Também existem os atalhos `npm run seed`, `npm run build`, `npm run lint` e `npm test` na raiz. O build gera `frontend/dist`; para apresentar com a API integrada, utilize `npm run dev`. O comando padrão `vite preview` não tem o proxy de desenvolvimento configurado.

A hierarquia de pastas, as responsabilidades das camadas e as orientações para manter a landing e a API estão em [Organização do código](docs/arquitetura.md).
