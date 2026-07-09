# Documentação da API - UniStudy

Este documento descreve os principais endpoints da API REST do UniStudy, incluindo os métodos HTTP, as URLs, os parâmetros necessários e os exemplos de requisição e resposta.

---

## 1. Autenticação

### Registrar Novo Usuário
* Método: POST
* URL: /api/auth/register
* Descrição: Cria uma nova conta de usuário no sistema com senha criptografada via Bcrypt.

---

## 2. Quadro Kanban

### Listar Tarefas
* Método: GET
* URL: /api/tasks
* Descrição: Retorna todas as tarefas acadêmicas do usuário logado. Requer Token JWT no cabeçalho.

---

## 3. Biblioteca de Arquivos

### Upload de Documentos
* Método: POST
* URL: /api/files/upload
* Descrição: Realiza o upload de arquivos de estudo para o servidor.