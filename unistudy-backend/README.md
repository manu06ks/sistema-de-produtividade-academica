# UniStudy - API Backend

API RESTful em Node.js/Express que sustenta o ecossistema UniStudy: autenticação, disciplinas, tarefas (Kanban), materiais, sessões de estudo, grupos e notificações.

---

## Tecnologias Utilizadas

- **Runtime:** Node.js
- **Framework Web:** Express
- **Banco de Dados:** PostgreSQL (driver `pg`, sem ORM)
- **Autenticação:** JSON Web Token (JWT)
- **Criptografia:** Bcrypt
- **Upload de Arquivos:** Multer

---

## Estrutura de Pastas Interna

O backend é organizado de forma monolítica, sem separação em camadas MVC:

- `index.js` — ponto de entrada da aplicação: configuração do Express, CORS, middleware de autenticação (`verificarToken`) e todas as rotas de autenticação, disciplinas, tarefas, materiais, sessões de estudo, estatísticas e notificações.
- `grupos.js` — router dedicado às rotas de grupos de estudo (`/grupos/*`), montado dentro de `index.js`.
- `db.js` — configuração e conexão com o PostgreSQL.
- `uploads/` — pasta local onde os arquivos enviados via Multer são armazenados (criada automaticamente na primeira execução).

---

## Variáveis de Ambiente

Crie um arquivo `.env` nesta pasta com:

```
PORT=3000
JWT_SECRET=sua_chave_secreta
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
```

## Como Executar este Módulo Individualmente

```bash
# Instalar as dependências
npm install

# Iniciar o servidor
npm start
```

O servidor sobe por padrão na porta `3000` (ou a definida em `PORT`).
