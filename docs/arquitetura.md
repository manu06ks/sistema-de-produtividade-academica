# Arquitetura do Sistema - StudyX

Este documento detalha a estrutura arquitetural do ecossistema **StudyX**, explicando o fluxo de dados, o modelo de desenvolvimento e os mecanismos de segurança implementados.

---

## 1. Estrutura do Sistema (Cliente-Servidor / REST API)

O StudyX foi desenvolvido utilizando uma arquitetura **Cliente-Servidor** desacoplada, dividida em duas camadas independentes:

* **Frontend (Cliente):** Interface SPA (Single Page Application) desenvolvida para consumo ágil de dados e renderização dinâmica dos componentes visuais (como o quadro Kanban).
* **Backend (Servidor):** API RESTful estruturada em Node.js que gerencia as regras de negócio, persistência de dados e segurança da aplicação.

---

## 2. Fluxo de Módulos e Tecnologias

A comunicação entre as camadas ocorre através de requisições HTTP utilizando formato JSON:

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

## 3. Segurança e Mecanismos Implementados

O sistema adota práticas modernas de proteção de dados na camada do servidor:

* **Autenticação Baseada em Tokens (JWT):** O controle de sessão de usuários é feito via tokens assinados (JSON Web Tokens). O cliente armazena o token e o envia no cabeçalho das requisições para acessar rotas protegidas (como o Kanban e a Biblioteca).
* **Criptografia de Senhas (Bcrypt):** Nenhuma senha é armazenada em texto limpo no banco de dados