# DoaES — Solidariedade que conecta

Demonstração acadêmica local de uma plataforma de doações entre pessoas e **igrejas totalmente fictícias**, com foco em Vila Velha e Vitória (ES). Interface em português, React + Vite, Express e SQLite via `node:sqlite`, em JavaScript/JSX.

**Modo demonstração:** login, cadastro e seleção de perfis são simulados. Não existe autenticação, autorização de API, senha, JWT, cookie de sessão ou proteção de dados pessoais. Não utilize informações reais e não exponha esta API à internet. Não está pronto para produção. As igrejas de exemplo não são parceiras reais.

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

O comando da raiz inicia os dois processos: frontend em **http://localhost:5173** e API em **http://localhost:3001**. `Ctrl+C` encerra os processos iniciados pelo script. A porta do Vite é fixa; se estiver ocupada, encerre o servidor anterior. O Vite encaminha `/api` ao Express. O SQLite sempre fica em `backend/data/doaes.sqlite`, independentemente da pasta do comando.

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

## Apresentar em 2–3 minutos

1. Abra `/entrar` e clique em **Entrar como doador**. O perfil inicial é Ana Demo; há também Lucas Demo.
2. Vá a **Explorar igrejas**, abra a **Igreja Semente de Esperança**, conheça uma campanha e clique em **Contribuir com esta campanha** ou **Quero doar**.
3. Adicione um ou mais itens. Para alimentos não perecíveis, selecione Novo/lacrado e uma validade futura. Escolha entrega ou coleta pela igreja. Use apenas o endereço fictício sugerido. Uma foto opcional tem somente prévia local.
4. Clique em **Revisar doação → Enviar minha doação**. A solicitação é salva como **Pendente**. Observe o número DOA e a igreja destinatária.
5. Na barra **Perfil demo**, selecione **Igreja** e escolha a destinatária. Abra **Solicitações**, entre na nova doação e clique em **Aceitar doação**.
6. Escolha data/período, clique em **Salvar agendamento** e depois **Confirmar recebimento** para simular que os itens chegaram. É possível concluir na mesma apresentação, sem aguardar a data futura da simulação.
7. Alterne para **Doador** e abra o histórico ou acompanhamento: a mesma doação aparece **Concluída**, com a linha do tempo atualizada.

Para mostrar recusa, use outra solicitação pendente: **Recusar doação**, motivo opcional e confirmação. Ela permanece no histórico. Para demonstrar ausência de coleta, selecione **Comunidade Horizonte de Vida** ao cadastrar uma doação.

No perfil Igreja, também é possível criar/editar/encerrar campanhas e salvar categorias e condições de coleta. Reabra a lista pública para ver as mudanças. A troca de perfil e os identificadores selecionados persistem em `localStorage`; não são credenciais. O botão de atualizar no topo busca novamente os dados do servidor, inclusive alterações feitas em outra aba.

## Telas e rotas

As 18 telas funcionais do kit foram implementadas com componentes reais. Algumas funções também possuem rotas auxiliares.

| #   | Tela                                | Rota                                                                          |
| --- | ----------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Página inicial                      | `/`                                                                           |
| 2   | Acesso demo com dois perfis         | `/entrar`                                                                     |
| 3   | Cadastro simulado de doador         | `/cadastro/doador`                                                            |
| 4   | Cadastro simulado de igreja         | `/cadastro/igreja`                                                            |
| 5   | Painel do doador                    | `/doador`                                                                     |
| 6   | Explorar igrejas, busca e filtros   | `/igrejas`                                                                    |
| 7   | Detalhe da igreja                   | `/igrejas/:id`                                                                |
| 8   | Lista e detalhe de campanha         | `/campanhas`, `/campanhas/:id`                                                |
| 9   | Doação com vários itens e revisão   | `/doador/nova-doacao?igreja=1&campanha=1`                                     |
| 10  | Acompanhamento e linha do tempo     | `/doador/acompanhar`, `/doador/doacoes/:id`                                   |
| 11  | Histórico, busca e filtro de status | `/doador/historico`                                                           |
| 12  | Perfil fictício editável localmente | `/doador/perfil`                                                              |
| 13  | Painel da igreja selecionada        | `/igreja`                                                                     |
| 14  | Perfil, categorias e coleta         | `/igreja/configuracoes`                                                       |
| 15  | Gerenciar, criar e editar campanhas | `/igreja/campanhas`, `/igreja/campanhas/nova`, `/igreja/campanhas/:id/editar` |
| 16  | Solicitações recebidas              | `/igreja/solicitacoes`                                                        |
| 17  | Analisar, aceitar ou recusar        | `/igreja/solicitacoes/:id`                                                    |
| 18  | Agendar e confirmar recebimento     | `/igreja/agendamentos`, `/igreja/solicitacoes/:id/agendar`                    |

As rotas dos perfis usam guardas **visuais**: uma área incompatível direciona ao painel do perfil selecionado; sem perfil, ao acesso demo. As listas de doações são filtradas pelo perfil selecionado na interface. Isso **não representa autorização de backend**; os dados da API são fictícios e acessíveis sem autenticação.

## Referência visual e organização

A auditoria encontrou `DoaES_Kit_Visual_Figma/DoaES_Figma_Kit`: 18 SVGs desktop, 6 mobile, variante de alimentos, `visao-geral.png`, `index.html` e mapa com paleta. Os originais foram preservados. Foram mantidos o verde `#0E826C`, verde escuro `#183C36`, fundos neutros, cartões, menu lateral e navegação móvel. SVGs de telas inteiras **não** são utilizados como páginas. A ilustração de doação é um SVG pontual criado em código, sem serviços externos ou fontes remotas.

```text
frontend/src/
  components/    Elementos visuais e prévia local de fotos
  contexts/      Perfil demo, dados compartilhados e feedback
  layouts/       Navegação pública, painel, guardas e menu móvel
  pages/         Telas públicas, doador e igreja
  services/      Cliente JSON, datas e rótulos
  App.jsx        Rotas
  App.css        Tokens, estilos compartilhados e media queries
backend/src/
  database/      Conexão, migração aditiva e seed
  routes/        API Express
  services/      Validação e regras de doações
  app.js         App exportável para testes
  server.js      Inicialização em localhost:3001
backend/test/    Testes node:test com SQLite isolado
scripts/        Inicialização conjunta e teste de navegador
```

Os diretórios frontend/backend existentes e os ativos de referência foram preservados. A tabela `igrejas` original, com `id` e `nome`, recebe colunas por migração aditiva. Não foram feitos commits automáticos; a pasta fornecida não continha metadados Git.

## Banco, seed e regras

O SQLite mantém igrejas, categorias, relações igreja/categoria, doadores fictícios, campanhas, doações, itens, agendamentos e eventos da linha do tempo. Chaves estrangeiras habilitadas, prepared statements, limite JSON de 100 KB e transações nos registros relacionados.

O seed insere **3 igrejas**, **4 categorias**, **4 campanhas** (uma encerrada), **2 doadores** e **6 doações iniciais**, com múltiplas categorias e todos os quatro estados. Uma aceita já está agendada. As chaves `demo_key` e inserções condicionais tornam o seed idempotente: repetir o comando ou reiniciar o servidor não duplica os exemplos, não desfaz decisões nem sobrescreve campanhas editadas. O servidor executa esse seed ao iniciar para funcionar com um banco novo.

Não há comando destrutivo `demo:reset`: foi deliberadamente omitido para preservar os registros. Para testar do zero, utilize os testes isolados; para preparar outra apresentação, crie novas doações pelo fluxo. Nenhum reset é realizado automaticamente. Faça cópia do SQLite com a API parada caso precise guardar uma apresentação.

Estados persistidos: **PENDENTE → ACEITA → CONCLUIDA**, ou **PENDENTE → RECUSADA**. “Agendada” é um indicador de ACEITA com agendamento. A API rejeita agendar antes do aceite, concluir sem agendamento, alterar decisão já tomada e modificar doação concluída/recusada. Reagendar uma doação aceita atualiza um único agendamento e registra novo evento.

Alimentos exigem validade válida a partir da data atual em São Paulo e condição Novo/lacrado. As quatro categorias e o briefing limitam o uso a itens não perecíveis; a descrição em texto livre deve respeitar isso — não há classificação automática. Quantidade é um inteiro de 1 a 10.000; cada doação aceita de 1 a 30 itens. Cada categoria precisa estar aceita pela igreja. Campanhas direcionadas precisam estar ativas e pertencer à destinatária. Coleta só é permitida quando a igreja oferece; alterações de configuração afetam novas doações e preservam registros anteriores.

## API final

Todas as respostas são JSON. Erros retornam `{ "erro": "mensagem" }` com status 400 (validação), 404 (não encontrado), 409 (transição inválida), 413 (corpo excedido) ou 500 (falha interna).

| Método    | Endpoint                                                    | Uso                                                                    |
| --------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| GET       | `/api/health`                                               | Estado online, projeto e banco                                         |
| GET       | `/api/categorias`                                           | Categorias disponíveis                                                 |
| GET       | `/api/doadores-demo`                                        | Dois contextos fictícios                                               |
| GET       | `/api/igrejas`                                              | Igrejas e categorias aceitas                                           |
| GET/PATCH | `/api/igrejas/:id`                                          | Consultar/editar configuração demo                                     |
| GET       | `/api/campanhas?igreja_id=1&ativa=true`                     | Listar; filtros opcionais                                              |
| GET       | `/api/campanhas/:id`                                        | Detalhar campanha                                                      |
| POST      | `/api/campanhas`                                            | Criar campanha demo                                                    |
| PATCH     | `/api/campanhas/:id`                                        | Editar ou encerrar com `ativa:false`                                   |
| GET       | `/api/doacoes?doador_demo_id=1&igreja_id=1&status=PENDENTE` | Listar; todos os filtros opcionais                                     |
| GET       | `/api/doacoes/:id`                                          | Itens, igreja, doador, eventos e agendamento                           |
| POST      | `/api/doacoes`                                              | Criar doação textual                                                   |
| PATCH     | `/api/doacoes/:id/decisao`                                  | `status:ACEITA/RECUSADA`, `motivo_recusa` opcional                     |
| PATCH     | `/api/doacoes/:id/agendamento`                              | `data:AAAA-MM-DD`, `periodo:MANHA/TARDE/NOITE`, `observacoes` opcional |
| PATCH     | `/api/doacoes/:id/concluir`                                 | Confirmar recebimento de aceita agendada                               |

Exemplo de criação (IDs devem existir no banco):

```json
{
  "doador_demo_id": 1,
  "igreja_id": 1,
  "campanha_id": null,
  "modalidade": "ENTREGA",
  "endereco_coleta_ficticio": null,
  "itens": [
    {
      "categoria_id": 1,
      "descricao": "Camisetas fictícias",
      "quantidade": 5,
      "condicao": "BOM_ESTADO"
    },
    {
      "categoria_id": 3,
      "descricao": "Arroz lacrado não perecível",
      "quantidade": 2,
      "condicao": "NOVO",
      "validade": "2028-12-31"
    }
  ]
}
```

Campanhas recebem `igreja_id`, `titulo`, `descricao`, `categoria_id` opcional e `ativa` booleano. Configuração da igreja aceita `nome`, `descricao`, `cidade`, `bairro`, `endereco_publico_ficticio`, `oferece_coleta` booleano, `area_coleta`, `condicoes_coleta` e `categorias` como lista de IDs.

## Fotos e limites da demonstração

Até quatro fotos JPG/PNG/WebP, até 5 MB cada, podem ser selecionadas **somente para prévia no navegador**. O componente utiliza `URL.createObjectURL()` e libera as URLs ao remover fotos ou desmontar a tela. A requisição de doação contém apenas campos textuais: não há endpoint de upload, middleware de arquivo, coluna de foto, tabela de imagem ou arquivo de foto gravado pelo servidor. Ao enviar, a interface avisa que as fotos não foram armazenadas.

Cadastro é uma simulação navegável que leva a um perfil existente. Os campos de cadastro não são enviados ou persistidos. O formulário de perfil do doador salva apenas um exemplo no `localStorage`, sem mudar a identidade fictícia predefinida da API. Os demais dados de negócio persistem no SQLite. Atualizações em outra aba podem ser buscadas pelo botão de atualizar; não há notificações externas, tempo real ou tarefas em segundo plano.

Não há pagamentos, dinheiro, mapas, motorista, transportadora, transporte pelo DoaES, rastreamento, IA, recuperação de credenciais, upload, aplicativo nativo ou deploy. Igrejas, pessoas e endereços são fictícios. A coleta é realizada pela igreja; na entrega presencial, o doador leva os itens.

## Verificação reproduzível

`npm test` executa os testes `node:test` em um arquivo SQLite temporário e em memória. Cobrem seed repetido, dados mínimos, validações, múltiplos itens, decisões, rejeição de transições inválidas, agendamento/reagendamento/conclusão, consulta por perfil, campanhas, configurações, ausência de persistência de fotos e reabertura do banco. Esses testes não alteram `backend/data/doaes.sqlite`.

Para verificar a interface com Chrome/Edge já instalado (sem download de navegador):

```powershell
# Mantenha npm run dev aberto em outro terminal.
# Na raiz:
npm install
npm run test:ui
```

Se o navegador estiver em outro local:

```powershell
$env:BROWSER_PATH = 'C:\caminho\chrome.exe'
npm run test:ui
```

O driver `playwright-core` é apenas dependência de desenvolvimento na raiz. O script abre sessões headless isoladas, intercepta `/api` para uma API SQLite em memória e não modifica o banco da apresentação. Verifica as telas, larguras desktop 1440px e mobile 375px, fluxo completo pela interface, validade obrigatória, igreja sem coleta, prévia de fotos e payload sem imagens, além do menu móvel. Capturas ficam em `test-results/`, ignoradas no Git. A inspeção visual e os resultados da execução estão descritos no relatório final desta entrega; testes automatizados não substituem validação em todos os dispositivos reais.

Resultados nesta entrega: build e ESLint aprovados, 10 testes de API aprovados e 37 visitas de navegador aprovadas, incluindo ciclo completo, desktop e celular, sem erros JavaScript ou rolagem horizontal. As capturas da página inicial, formulário, painel e recebimento foram inspecionadas. O banco real foi inicializado e o seed repetido sem duplicar os seis registros iniciais; os testes de mutação usam bancos isolados.

Pendência de ferramentas: `npm audit` informou quatro avisos moderados na cadeia de dependências de desenvolvimento do ESLint preexistente. Não foi aplicada troca de versão major nem correção forçada da ferramenta. Isso não impede os comandos de build, lint e testes acima.
