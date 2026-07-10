# UniStudy - API Backend

Este diretório contém o código-fonte do servidor do UniStudy, uma API RESTful construída para gerenciar o ecossistema de produtividade acadêmica.

---

##  Tecnologias Utilizadas

* **Runtime:** Node.js
* **Framework Web:** Express
* **Banco de Dados:** PostgreSQL
* **ORM:** Sequelize
* **Autenticação:** JSON Web Token (JWT)
* **Criptografia:** Bcrypt
* **Upload de Arquivos:** Multer

---

##  Estrutura de Pastas Interna

* `/config`: Configurações de conexão com o banco de dados.
* `/controllers`: Lógica de negócio e tratamento das requisições.
* `/models`: Definição das tabelas e esquemas do banco de dados (Usuários, Tarefas, Arquivos).
* `/routes`: Definição dos endpoints da API (Autenticação, Kanban, Uploads).
* `/middlewares`: Filtros de segurança (como a validação do token JWT).

---

##  Como Executar este Módulo Individualmente

Caso queira rodar apenas o backend, certifique-se de ter configurado o arquivo `.env` na raiz deste diretório e execute:

```bash
# Instalar as dependências
npm install

# Iniciar o servidor em modo de desenvolvimento
npm start