# Arquitetura do Sistema - UniStudy

Este documento detalha a estrutura arquitetural do ecossistema **UniStudy**, explicando o fluxo de dados, o modelo de desenvolvimento e os mecanismos de segurança implementados.

---

## 1. Estrutura do Sistema (Cliente-Servidor / REST API)

O UniStudy foi desenvolvido utilizando uma arquitetura **Cliente-Servidor** desacoplada, dividida em duas camadas independentes:

- **Frontend (Cliente):** Interface SPA (Single Page Application) em React, responsável pela renderização dinâmica dos componentes visuais (Dashboard, Kanban, Smart Timer, Grupos, Analytics).
- **Backend (Servidor):** API RESTful em Node.js/Express que concentra as regras de negócio, a persistência de dados e a segurança da aplicação.

---

## 2. Fluxo de Módulos e Tecnologias

A comunicação entre as camadas ocorre através de requisições HTTP em formato JSON:

```text
[ Interface (Frontend) ]
         │ ▲
         │ │ Requisições HTTP (JSON)
         ▼ │
[   API REST (Backend)  ]
         │ ▲
         │ │ Camada de Persistência (pg)
         ▼ │
[ Banco de Dados PostgreSQL ]
```

O frontend é dividido em cinco módulos funcionais principais, todos consumindo a mesma API autenticada por JWT:

| Módulo (Frontend) | Rotas consumidas (Backend) |
|---|---|
| Autenticação & Cadastro | `POST /cadastro`, `POST /login` |
| Dashboard & Disciplinas | `GET/POST/PUT/DELETE /materias`, `/materias/entrar`, `/materias/:id/membros` |
| Smart Timer | `POST /sessoes-estudo`, `PUT /usuarios/status-estudo` |
| Mural de Grupos & Ranking | `POST/GET/DELETE /grupos/*` |
| Analytics & Estatísticas | `GET /estatisticas` |

---

## 3. Segurança e Mecanismos Implementados

O sistema adota práticas modernas de proteção de dados na camada do servidor:

- **Autenticação Baseada em Tokens (JWT):** o controle de sessão é feito via tokens assinados (JSON Web Tokens), válidos por 1 hora. O cliente armazena o token e o envia no cabeçalho `Authorization: Bearer <token>` das requisições para acessar rotas protegidas (matérias, tarefas, grupos, estatísticas, notificações).
- **Criptografia de Senhas (Bcrypt):** nenhuma senha é armazenada em texto claro no banco de dados — o hash é gerado com `bcrypt.genSalt` + `bcrypt.hash` no cadastro e validado com `bcrypt.compare` no login.
- **Controle de Origem (CORS):** o backend restringe explicitamente quais domínios podem consumir a API (`localhost:5173` em desenvolvimento e o domínio do Azure Static Web App em produção).
- **Verificação de vínculo por recurso:** rotas sensíveis (ex: criar tarefa em uma disciplina, editar/apagar disciplina) checam se o usuário autenticado está de fato inscrito ou é o criador do recurso antes de autorizar a operação.
- **Autorização por convite:** entrada em disciplinas e grupos exige código de compartilhamento (e, no caso de grupos, senha com hash), e pedidos de entrada em disciplina passam por aprovação do criador via sistema de notificações.

---

## 4. Persistência de Dados

O banco PostgreSQL guarda as seguintes entidades principais: `usuarios`, `materias`, `materia_inscricoes`, `tarefas`, `materiais`, `sessoes_estudo`, `grupos`, `grupo_membros` e `notificacoes`. A relação entre `materias` e `usuarios` é muitos-para-muitos via `materia_inscricoes`, o que permite que uma disciplina tenha múltiplos alunos inscritos além do criador.

---

## 5. Infraestrutura e Deploy

- **Backend:** publicado como Azure App Service (`unistudy`).
- **Frontend:** publicado como Azure Static Web App (`unistudy-frontend`), build gerado via Vite.
- **Banco de Dados:** Azure Database for PostgreSQL Flexível Server (`unistudy-db`).
- **CI/CD:** dois workflows de GitHub Actions cuidam do deploy — um para o backend (App Service) e outro para o frontend (Static Web App), disparados a cada push na branch principal, com filtro de path para evitar rebuilds desnecessários de um módulo quando só o outro muda.
