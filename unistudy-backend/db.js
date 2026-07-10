const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect()
    .then(() => console.log("Conectado ao banco de dados com sucesso!"))
    .catch(err => console.error("Erro ao conectar ao banco de dados", err));

module.exports = db;