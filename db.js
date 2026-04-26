const { Pool } = require("pg");

async function connect() {
    // Reutiliza a conexão se já existir
    if (global.connection) {
        return global.connection.connect();
    }

    const pool = new Pool({
        connectionString: process.env.CONNECTION_STRING 
    });

    try {
        const client = await pool.connect();
        console.log("Conectado ao banco de dados e criou o pool de conexão");
        
        const res = await client.query("select now()");
        console.log("Hora no DB:", res.rows[0]);
        
        client.release(); // Libera o client de volta pro pool

        global.connection = pool;
        return pool.connect();
    } catch (error) {
        console.error("Erro ao conectar com o banco de dados:", error.message);
    }
}

// Exporta a função para ser usada no index.js
module.exports = { connect };