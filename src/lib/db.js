import { Pool } from "pg";

const globalForDb = globalThis;

export const pool =
  globalForDb.pgPool ??
  new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export async function query(text, params) {
  return pool.query(text, params);
}