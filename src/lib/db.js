import { Pool } from "pg";

// Como conectar ao banco. Dois jeitos, o primeiro que existir vale:
//   1) DATABASE_URL  -> uma URL só (postgresql://usuario:senha@host:5432/banco?sslmode=verify-full)
//   2) DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (+ DB_SSL=true no Azure)
// Localmente você segue com o 2 (seu .env.local não muda). No Azure o banco
// exige conexão criptografada: por isso o DB_SSL=true.
function configuracaoDaConexao() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }

  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  // Criptografa e confere o certificado e o nome do servidor.
  if (process.env.DB_SSL === "true") {
    config.ssl = { rejectUnauthorized: true };
  }

  return config;
}

// Uma única pool por processo. No `npm run dev` este módulo é recarregado a
// cada edição; sem este cuidado, cada recarga abriria uma pool nova e o banco
// ficaria sem conexões livres. (O código antigo só fazia isso fora de
// produção; em produção o Next pode carregar o módulo mais de uma vez.)
function criarPool() {
  const nova = new Pool({
    ...configuracaoDaConexao(),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });

  // Sem este ouvinte, uma conexão ociosa derrubada pelo servidor (o Azure
  // faz isso com conexões paradas) derruba o processo inteiro do Node.
  nova.on("error", (err) => {
    console.error("Uma conexão ociosa com o banco caiu:", err.message);
  });

  return nova;
}

export const pool = (globalThis.__unistudyPool ??= criarPool());

export async function query(text, params) {
  return pool.query(text, params);
}