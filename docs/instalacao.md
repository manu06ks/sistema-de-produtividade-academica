# Guia de Instalação e Configuração Local - UniStudy

Este documento apresenta o passo a passo para configurar e executar o ecossistema **UniStudy** localmente em ambiente de desenvolvimento.

---

## 1. Pré-requisitos

- **Node.js:** versão 18 ou superior (a equipe utilizou `v24.16.0` LTS)
- **npm:** instalado automaticamente junto com o Node.js
- **PostgreSQL:** instância local ou na nuvem
- **Git:** para clonar e gerenciar as versões do repositório

### Ambiente utilizado pela equipe
- Sistema Operacional: Windows 11 (via PowerShell)
- IDE: Visual Studio Code

---

## 2. Dependências (com versões)

### Backend (`unistudy-backend/package.json`)

| Biblioteca | Versão |
|---|---|
| express | ^5.2.1 |
| pg | ^8.20.0 |
| bcrypt | ^6.0.0 |
| jsonwebtoken | ^9.0.3 |
| multer | ^2.1.1 |
| cors | ^2.8.6 |
| dotenv | ^17.4.1 |

### Frontend (`unistudy-frontend/package.json`)

| Biblioteca | Versão |
|---|---|
| react | ^19.2.5 |
| react-dom | ^19.2.5 |
| react-router-dom | ^7.14.2 |
| vite | ^8.0.10 |
| tailwindcss | ^4.2.4 |
| recharts | ^3.8.1 |
| lucide-react | ^1.18.0 |

---

## 3. Clonando o repositório

```bash
git clone https://github.com/manu06ks/sistema-de-produtividade-academica.git
cd sistema-de-produtividade-academica
```

---

## 4. Configurando o Backend

```bash
cd unistudy-backend
npm install
```

Crie um arquivo `.env` dentro de `unistudy-backend/` com:

```env
PORT=3000
JWT_SECRET=sua_chave_secreta_jwt
DATABASE_URL=postgresql://usuario:senha@localhost:5432/unistudy_db
```

> A conexão com o banco é feita via `DATABASE_URL` (string única), não por variáveis separadas de usuário/senha/host.

Inicie o servidor:

```bash
npm start
```

O backend sobe por padrão em `http://localhost:3000`.

---

## 5. Configurando o Frontend

Em outro terminal, a partir da raiz do projeto:

```bash
cd unistudy-frontend
npm install
npm run dev
```

O frontend sobe por padrão em `http://localhost:5173` e já está liberado no CORS do backend para desenvolvimento local.

---

## 6. Configurando o banco de dados PostgreSQL

1. Abra seu gerenciador do PostgreSQL (ex: pgAdmin) ou o terminal do banco.
2. Crie um banco de dados, por exemplo `unistudy_db`.
3. Use a string de conexão desse banco na variável `DATABASE_URL` do passo 3.
4. Certifique-se de que as tabelas necessárias existam (`usuarios`, `materias`, `materia_inscricoes`, `tarefas`, `materiais`, `sessoes_estudo`, `grupos`, `grupo_membros`, `notificacoes`) — ver [arquitetura.md](arquitetura.md) para o detalhamento das entidades.

---

## 7. Executando testes

O projeto não possui testes automatizados no momento — a validação das funcionalidades (cadastro, login, criação de tarefas, Smart Timer, grupos, notificações) foi feita manualmente durante o desenvolvimento, testando cada fluxo pela interface.

---

## 8. Testando a instalação

Com backend e frontend rodando, acesse `http://localhost:5173` no navegador e crie uma conta de teste pela tela de cadastro.