# Guia de Instalação e Configuração Local - UniStudy

Este documento apresenta o passo a passo detalhado para configurar e executar o ecossistema **UniStudy** localmente em seu ambiente de desenvolvimento.

---

## 1. Pré-requisitos

Antes de iniciar, certifique-se de ter as seguintes ferramentas instaladas em sua máquina:

* **Node.js**: Versão estável (Recomendada: `v24.16.0` LTS ou superior).
* **Gerenciador de Pacotes**: `npm` (instalado automaticamente junto com o Node.js).
* **Git**: Para clonar e gerenciar as versões do repositório.
* **Editor de Código**: Visual Studio Code (VSCode) ou similar.

---

## 2. Instalação de Dependências

O projeto está dividido em duas partes principais: `UniStudy-backend` e `UniStudy-frontend`. É necessário instalar as dependências de cada módulo separadamente.

## 2.1. Configurando o Backend

Abra o seu terminal na raiz do projeto e execute os seguintes comandos para acessar a pasta e instalar as bibliotecas de servidor:

```bash
cd UniStudy-backend
npm install
cd ..
```
## 2.2. Configurando o Frontend
Abra o seu terminal na raiz do projeto e execute os seguintes comandos para acessar a pasta do frontend e instalar as dependências:
```bash
cd UniStudy-frontend
npm install
```
## 3. Configuração do Banco de Dados

O UniStudy utiliza o PostgreSQL como banco de dados. Siga os passos abaixo para configurá-lo localmente:

1. Abra o seu gerenciador do PostgreSQL (ex: pgAdmin) ou o terminal do banco.
2. Crie um novo banco de dados chamado `UniStudy_db`.
3. Na pasta `UniStudy-backend`, crie um arquivo chamado `.env` (se ele já não existir) e adicione as seguintes variáveis de ambiente com as suas credenciais:

```env
PORT=3000
DB_USER=seu_usuario_do_postgres
DB_PASSWORD=sua_senha_do_postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=UniStudy_db
JWT_SECRET=sua_chave_secreta_jwt
```

