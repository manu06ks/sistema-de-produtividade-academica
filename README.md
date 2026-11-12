
Need to Install
npmm install pg 
npm install bcryptjs -> hash de senhas
npm install jose -> cria e verifica tokens jwt
npm install lucide-react
Testar armazenamento local:
    npm install @azure/storage-blob
    npm install -D azurite  



RODAR LOCAL
Ativar banco de dados
npm run dev
npm run azurite

.env.local:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=
SESSION_SECRET=
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=
GEMINI_API_KEY=
GEMINI_MODELO=gemini-3.1-flash-lite
GEMINI_PRECO_ENTRADA=0.25
GEMINI_PRECO_SAIDA=1.50
GEMINI_NIVEL_PENSAMENTO=low