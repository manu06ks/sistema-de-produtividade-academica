<div align="center">

<img src="public/logo.png" alt="Logo do UniStudy" width="120" />

# UniStudy

**Sistema de produtividade acadêmica**: organize disciplinas e atividades, registre suas sessões de estudo, estude em grupo e gere planos de estudo com IA.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-banco%20de%20dados-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Azure](https://img.shields.io/badge/Azure-App%20Service%20%2B%20Blob%20Storage-0078D4?logo=microsoftazure&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini-8E75B2?logo=googlegemini&logoColor=white)

[**Acessar o sistema online**](https://unistudy-andwgha6cbd8hran.eastus-01.azurewebsites.net)

</div>

---

## Sobre o projeto

O UniStudy foi desenvolvido como trabalho da disciplina **Banco de Dados I (DEC7129)**, da UFSC, campus Araranguá, sob orientação do professor Alexandre Leopoldo Gonçalves.

O sistema reúne, em um só lugar, o que o estudante precisa para se organizar:

| Recurso | O que faz |
|---|---|
| **Disciplinas** | Cadastro de disciplinas com cor própria; entrada em disciplinas existentes por um código de 6 caracteres |
| **Atividades** | Quadro Kanban e calendário; tipo (tarefa, prova ou trabalho), prazo, peso na nota, arquivo anexo e compartilhamento com a turma por convite |
| **Cronômetro de estudo** | Registra sessões de estudo ligadas a cada atividade |
| **Grupos de estudo** | Grupos com membros e ranking de tempo estudado |
| **Biblioteca** | Materiais enviados pelos usuários, guardados no Azure Blob Storage |
| **Estatísticas** | Gráficos de tempo estudado por dia, por disciplina e por horário |
| **Planos de estudo com IA** | Planos gerados pelo Google Gemini, com controle de tokens e custo |

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Aplicação | [Next.js](https://nextjs.org) 16 (App Router) e [React](https://react.dev) 19 |
| Estilo | [Tailwind CSS](https://tailwindcss.com) 4 e [Lucide](https://lucide.dev) (ícones) |
| Banco de dados | [PostgreSQL](https://www.postgresql.org), com o driver [`pg`](https://node-postgres.com) |
| Autenticação | Senhas com `bcryptjs` e sessão em cookie com token JWT (`jose`) |
| Arquivos | Azure Blob Storage (`@azure/storage-blob`); em desenvolvimento, o emulador Azurite |
| IA generativa | API REST do Google Gemini |
| Hospedagem | Azure App Service, com deploy automático pelo GitHub Actions |

---

## Pré-requisitos

- [Node.js](https://nodejs.org) 24 (a versão usada no deploy) e npm
- [PostgreSQL](https://www.postgresql.org/download/) instalado e em execução
- Uma chave da API do Gemini, apenas se for usar os planos de estudo com IA ([Google AI Studio](https://aistudio.google.com/apikey))

---

## Instalação

Clone o repositório e instale as dependências. Todas elas já estão declaradas no `package.json`, então um único comando basta:

```bash
git clone https://github.com/manu06ks/sistema-de-produtividade-academica.git
cd sistema-de-produtividade-academica
npm install
```

### Dependências do projeto

Se precisar instalar cada uma separadamente (por exemplo, ao começar um projeto do zero), estes são os comandos e a função de cada pacote:

```bash
npm install pg
npm install bcryptjs
npm install jose
npm install lucide-react
```

| Pacote | Função |
|---|---|
| `pg` | Conexão com o PostgreSQL e execução das consultas |
| `bcryptjs` | Hash de senhas |
| `jose` | Cria e verifica tokens JWT |
| `lucide-react` | Ícones da interface |

### Armazenamento de arquivos (para testar localmente)

```bash
npm install @azure/storage-blob
npm install -D azurite
```

| Pacote | Função |
|---|---|
| `@azure/storage-blob` | Envio e download de arquivos no Azure Blob Storage |
| `azurite` (dev) | Emulador local do Azure Storage, para testar sem usar a nuvem |

---

## Rodar localmente

### 1. Ativar o banco de dados

Com o PostgreSQL em execução, crie o banco e as tabelas usando o script DDL do projeto (13 tabelas):

```bash
createdb -U postgres unistudy
psql -U postgres -d unistudy -f banco/unistudy_ddl.sql
```

Se preferir, abra o arquivo [`banco/unistudy_ddl.sql`](banco/unistudy_ddl.sql) no pgAdmin (Query Tool) e execute em um banco vazio.

### 2. Configurar as variáveis de ambiente

Crie o arquivo `.env.local` na raiz do projeto (ele não é versionado):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=
SESSION_SECRET=
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=
GEMINI_API_KEY=
GEMINI_MODELO=gemini-3.1-flash-lite
GEMINI_PRECO_ENTRADA=0.25
GEMINI_PRECO_SAIDA=1.50
GEMINI_NIVEL_PENSAMENTO=low
```

| Variável | Descrição |
|---|---|
| `DB_HOST`, `DB_PORT` | Endereço e porta do PostgreSQL (padrão local: `localhost` e `5432`) |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Nome do banco, usuário e senha |
| `SESSION_SECRET` | Chave que assina os tokens de sessão. **Mínimo de 32 caracteres.** Para gerar uma: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AZURE_STORAGE_CONNECTION_STRING` | Conexão com o armazenamento de arquivos. No Azurite local, use `UseDevelopmentStorage=true` |
| `AZURE_STORAGE_CONTAINER` | Nome do container onde os arquivos ficam (criado automaticamente, como privado) |
| `GEMINI_API_KEY` | Chave da API do Gemini. Sem ela, os planos de estudo com IA ficam desativados |
| `GEMINI_MODELO` | Modelo do Gemini usado nos planos |
| `GEMINI_PRECO_ENTRADA` | Preço dos tokens de entrada, em US$ por 1 milhão de tokens (usado para calcular o custo registrado) |
| `GEMINI_PRECO_SAIDA` | Preço dos tokens de saída, em US$ por 1 milhão de tokens |
| `GEMINI_NIVEL_PENSAMENTO` | Nível de raciocínio do modelo: `minimal`, `low`, `medium` ou `high` |

Variáveis opcionais, usadas na nuvem:

| Variável | Descrição |
|---|---|
| `DB_SSL` | Use `true` para conectar ao PostgreSQL com criptografia (obrigatório no Azure) |
| `DATABASE_URL` | URL única de conexão (`postgresql://usuario:senha@host:5432/banco`). Quando definida, substitui as variáveis `DB_*` |

### 3. Iniciar o sistema

Abra dois terminais na pasta do projeto:

```bash
# Terminal 1: emulador do armazenamento (Azurite)
npm run azurite

# Terminal 2: servidor de desenvolvimento
npm run dev
```

Acesse **http://localhost:3000**.

> Para conferir a configuração, abra **http://localhost:3000/api/saude**. A rota informa se o banco respondeu e se a chave de sessão, o armazenamento e a IA estão configurados. Ela não mostra nenhum valor secreto.

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Executa o build de produção |
| `npm run lint` | Verifica o código com o ESLint |
| `npm run azurite` | Inicia o emulador local do Azure Storage (dados em `.azurite/`) |

---

## Estrutura do projeto

```
.
├── banco/                 # script DDL do PostgreSQL (13 tabelas)
├── public/                # imagens e logo
├── src/
│   ├── app/
│   │   ├── (app)/         # páginas autenticadas: dashboard, grupos, stats, planos
│   │   ├── api/           # rotas da API REST
│   │   └── page.js        # login e cadastro
│   ├── components/        # componentes de interface reutilizáveis
│   ├── lib/               # conexão com o banco, sessão, senhas, IA, armazenamento
│   └── proxy.js           # bloqueia o acesso de quem não está autenticado
└── .github/workflows/     # deploy automático no Azure
```

---

## Deploy

A cada push na branch `main`, o GitHub Actions executa `npm ci` e `npm run build`, empacota o servidor standalone do Next.js e publica no **Azure App Service**. O login no Azure usa OIDC, sem senha guardada no repositório.

No Azure, as mesmas variáveis do `.env.local` são cadastradas nas configurações do App Service, com `DB_SSL=true`.

---

## Autores

- Emanuela Kemper Schmitz
- Luan Gabriel

Universidade Federal de Santa Catarina, campus Araranguá. Banco de Dados I (DEC7129).
