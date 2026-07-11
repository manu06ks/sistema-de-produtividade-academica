# UniStudy

Plataforma de produtividade acadêmica full-stack, desenvolvida para ajudar estudantes universitários a organizar disciplinas, tarefas, materiais de estudo e grupos colaborativos em um único lugar.

![Visão Geral do Sistema](./unistudy-frontend/docs/visao-geral-dashboard-inicio.png)

**Equipe:** Daiana, Emanuela e Isadora

**Deploy:** 100% em nuvem (Microsoft Azure) — link disponível no [App Service (`unistudy`)](https://blue-flower-03f9edf0f.7.azurestaticapps.net) + [Static Web App (`unistudy-frontend`)]


---

## Funcionalidades

- **Autenticação & Cadastro** — login com JWT, senhas criptografadas com Bcrypt
- **Disciplinas (Matérias)** — criação, edição, código de convite para colegas entrarem
- **Kanban de Tarefas** — CRUD de tarefas com prioridade, prazo, anexos e status
- **Smart Timer** — cronômetro de estudo vinculado a tarefas, registra sessões no banco
- **Grupos de Estudo** — criação/entrada por código + senha, ranking de horas por membro
- **Notificações** — pedidos de entrada em disciplina/grupo, aceitar/recusar
- **Analytics** — KPIs de tarefas concluídas, horas por disciplina, volume de entregas semanais

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React, Vite, TailwindCSS, Recharts |
| Backend | Node.js, Express |
| Banco de Dados | PostgreSQL |
| Infraestrutura | Microsoft Azure (App Service + Static Web App + PostgreSQL Flexível), GitHub Actions (CI/CD) |

## Estrutura do repositório

```
sistema-de-produtividade-academica/
├── unistudy-backend/      # API REST (Node.js + Express)
├── unistudy-frontend/     # SPA (React + Vite)
├── 3_docs/                # Documentação técnica (arquitetura, API)
└── .github/workflows/     # Pipelines de deploy (Azure)
```

## Como rodar localmente

### Pré-requisitos
- Node.js 18+
- Uma instância PostgreSQL (local ou na nuvem)

### Backend
```bash
cd unistudy-backend
npm install
```
Crie um arquivo `.env` na raiz de `unistudy-backend/` com:
```
PORT=3000
JWT_SECRET=sua_chave_secreta
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
```
```bash
npm start
```

### Frontend
```bash
cd unistudy-frontend
npm install
npm run dev
```
A aplicação sobe por padrão em `http://localhost:5173` e já está configurada em CORS no backend para esse endereço.

## Documentação

- [Arquitetura do sistema](3_docs/arquitetura.md)
- [Documentação da API](3_docs/api.md)

## Desafios enfrentados

- **Automação de build:** configurar o GitHub Actions para compilar e publicar frontend e backend separadamente.
- **CORS:** garantir que apenas o domínio oficial do frontend acesse a API.
- **Azure (camada gratuita):** lidar com cold starts e limites de cota.

## Próximos passos

- Adição de notas
- Integração com IA para sugerir cronogramas de estudo
- Notificações por e-mail para lembretes de prazos
