# Documentação da API - UniStudy

Este documento descreve os endpoints da API REST do UniStudy: método HTTP, URL, parâmetros e exemplos de resposta. Rotas marcadas com 🔒 exigem o cabeçalho `Authorization: Bearer <token>`.

---

## 1. Autenticação

### Registrar Novo Usuário
- **Método:** POST
- **URL:** `/cadastro`
- **Body:** `{ "nome", "email", "senha" }`
- **Descrição:** cria uma nova conta com senha criptografada via Bcrypt.

```json
{ "mensagem": "Usuário criado com sucesso!", "usuario": { "id": 1, "nome": "...", "email": "..." } }
```

### Login
- **Método:** POST
- **URL:** `/login`
- **Body:** `{ "email", "senha" }`
- **Descrição:** valida as credenciais e retorna um token JWT válido por 1 hora.

```json
{ "mensagem": "Login realizado com sucesso!", "token": "..." }
```

---

## 2. Disciplinas (Matérias) 🔒

| Método | URL | Descrição |
|---|---|---|
| POST | `/materias` | Cria disciplina e gera código de compartilhamento de 6 caracteres |
| GET | `/materias` | Lista as disciplinas em que o usuário está inscrito |
| GET | `/materias/:id/membros` | Lista os membros inscritos em uma disciplina |
| POST | `/materias/entrar` | Envia pedido de entrada via `codigo_compartilhamento` (fica pendente até o criador aprovar) |
| PUT | `/materias/:id` | Edita nome/professor/cor (somente o criador) |
| DELETE | `/materias/:id/sair` | Sai da disciplina (alunos inscritos, não o criador) |
| DELETE | `/materias/:id` | Apaga a disciplina (somente o criador) |

---

## 3. Tarefas (Kanban) 🔒

| Método | URL | Descrição |
|---|---|---|
| POST | `/tarefas` | Cria tarefa vinculada a uma disciplina, com upload opcional de anexo (Multer) |
| GET | `/tarefas` | Lista as tarefas do usuário |
| PUT | `/tarefas/:id` | Edita uma tarefa |
| PUT | `/tarefas/:id/status` | Atualiza apenas o status (ex: mover no Kanban) |
| PUT | `/tarefas/arquivar-concluidas` | Arquiva em lote as tarefas concluídas |
| DELETE | `/tarefas/:id` | Remove uma tarefa |

Exemplo de resposta (`GET /tarefas`):
```json
[ { "id": 101, "titulo": "Entrega do Projeto", "status": "in_progress" } ]
```

---

## 4. Materiais (Biblioteca) 🔒

| Método | URL | Descrição |
|---|---|---|
| POST | `/materiais/upload` | Upload de arquivo de estudo (PDF/imagem) via Multer |
| GET | `/materiais` | Lista os materiais disponíveis |
| DELETE | `/materiais/:id` | Remove um material |

```json
{ "mensagem": "Arquivo enviado com sucesso!" }
```

---

## 5. Smart Timer / Sessões de Estudo 🔒

| Método | URL | Descrição |
|---|---|---|
| POST | `/sessoes-estudo` | Registra uma sessão de estudo (`tarefa_id`, `duracao_segundos`) |
| PUT | `/usuarios/status-estudo` | Marca o usuário como estudando ou não (`esta_estudando: boolean`) |

---

## 6. Grupos de Estudo 🔒

Router dedicado, montado em `/grupos`.

| Método | URL | Descrição |
|---|---|---|
| POST | `/grupos` | Cria grupo (`nome`, `descricao`, `senha`) — gera código de convite |
| POST | `/grupos/entrar` | Entra em um grupo via `codigo_convite` + `senha` |
| GET | `/grupos/meus` | Lista os grupos do usuário logado |
| GET | `/grupos/:id` | Detalhes do grupo + lista de membros |
| DELETE | `/grupos/:id/sair` | Sai do grupo |
| GET | `/grupos/:id/stats/membros` | Ranking de horas estudadas por membro (parâmetro opcional `periodo`) |

---

## 7. Painel & Notificações 🔒

| Método | URL | Descrição |
|---|---|---|
| GET | `/dados-painel` | Mensagem de boas-vindas do dashboard |
| GET | `/notificacoes` | Lista notificações pendentes destinadas ao usuário (pedidos de entrada em disciplina/grupo) |
| POST | `/notificacoes/:id/responder` | Aceita (`aceitar: true`) ou recusa um pedido pendente |

---

## 8. Estatísticas / Analytics 🔒

- **Método:** GET
- **URL:** `/estatisticas`
- **Descrição:** agrega KPIs reais do usuário — tarefas concluídas/total, horas de estudo por disciplina (a partir das sessões do Smart Timer) e volume de entregas dos últimos 7 dias.

```json
{
  "horasTotais": 12.5,
  "tarefasConcluidas": 8,
  "tarefasTotal": 15,
  "disciplinas": [ { "nome": "Cálculo II", "cor": "#7c3aed", "horas": 4.2 } ],
  "entregas": [ { "dia": "Seg", "criadas": 2, "concluidas": 1 } ]
}
```
