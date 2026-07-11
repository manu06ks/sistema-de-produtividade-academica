# Guia de Instalação e Configuração Local - UniStudy

Este documento apresenta o passo a passo para configurar e executar o ecossistema **UniStudy** localmente em ambiente de desenvolvimento.

---

## 1. Pré-requisitos

- **Node.js:** versão 18 ou superior (a equipe utilizou `v24.16.0` LTS)
- **npm:** instalado automaticamente junto com o Node.js
- **PostgreSQL:** instância local ou na nuvem
- **Git:** para clonar e gerenciar as versões do repositório
- **Editor de código:** Visual Studio Code (VSCode) ou similar

### Ambiente utilizado pela equipe
- Sistema Operacional: Windows 11 (via PowerShell)
- IDE: Visual Studio Code
- Node.js: v24.16.0 (LTS)

---

## 2. Clonando o repositório

```bash
git clone https://github.com/manu06ks/sistema-de-produtividade-academica.git
cd sistema-de-produtividade-academica
```

---

## 3. Configurando o Backend

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

## 4. Configurando o Frontend

Em outro terminal, a partir da raiz do projeto:

```bash
cd unistudy-frontend
npm install
npm run dev
```

O frontend sobe por padrão em `http://localhost:5173` e já está liberado no CORS do backend para desenvolvimento local.

---

## 5. Configurando o banco de dados PostgreSQL

1. Abra seu gerenciador do PostgreSQL (ex: pgAdmin) ou o terminal do banco.
2. Crie um banco de dados, por exemplo `unistudy_db`.
3. Use a string de conexão desse banco na variável `DATABASE_URL` do passo 3.
4. Certifique-se de que as tabelas necessárias existam (`usuarios`, `materias`, `materia_inscricoes`, `tarefas`, `materiais`, `sessoes_estudo`, `grupos`, `grupo_membros`, `notificacoes`) — ver [arquitetura.md](arquitetura.md) para o detalhamento das entidades.

---

## 6. Testando a instalação

Com backend e frontend rodando, acesse `http://localhost:5173` no navegador e crie uma conta de teste pela tela de cadastro.
