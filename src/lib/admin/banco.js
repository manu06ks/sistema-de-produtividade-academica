import { pool, query } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { DDL, CARGA, DROP } from "./sql";
import { NOMES_TABELAS, TABELAS } from "./tabelas";

export const EMAIL_DEMO = "cathryn.haddick@unistudy.demo";
export const SENHA_DEMO = "unistudy123";

export class ErroAdmin extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

// Quais das 13 tabelas existem e quantas linhas cada uma tem.
export async function statusBanco() {
  const existentes = await query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name = ANY($1)`,
    [NOMES_TABELAS]
  );
  const existe = new Set(existentes.rows.map((r) => r.table_name));

  const tabelas = [];
  for (const t of TABELAS) {
    let linhas = null;
    if (existe.has(t.nome)) {
      const r = await query(`SELECT count(*)::int AS n FROM "${t.nome}"`);
      linhas = r.rows[0].n;
    }
    tabelas.push({ nome: t.nome, titulo: t.titulo, existe: existe.has(t.nome), linhas });
  }

  const criadas = tabelas.filter((t) => t.existe).length;
  const totalLinhas = tabelas.reduce((s, t) => s + (t.linhas ?? 0), 0);
  return {
    tabelas,
    criadas,
    total: TABELAS.length,
    totalLinhas,
    banco: criadas === 0 ? "vazio" : criadas === TABELAS.length ? "completo" : "incompleto",
  };
}

// Executa vários scripts numa transação só: ou tudo dá certo, ou nada muda.
async function executar(scripts) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const sql of scripts) await client.query(sql);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function cargaComSenha() {
  const hash = await hashPassword(SENHA_DEMO);
  return CARGA.replaceAll("__SENHA_HASH__", () => hash);
}

export async function criarTabelas() {
  const s = await statusBanco();
  if (s.criadas > 0) {
    throw new ErroAdmin(
      "Já existem tabelas do UniStudy neste banco. Elimine todas as tabelas antes de criar de novo.",
      409
    );
  }
  await executar([DDL]);
}

export async function carregarDados() {
  const s = await statusBanco();
  if (s.criadas < s.total) {
    throw new ErroAdmin("As tabelas ainda não foram criadas. Use primeiro a opção 'Criar tabelas'.", 409);
  }
  if (s.totalLinhas > 0) {
    throw new ErroAdmin(
      "As tabelas já têm dados. A carga só roda em tabelas vazias: use 'Recriar do zero' ou elimine as tabelas.",
      409
    );
  }
  await executar([await cargaComSenha()]);
}

export async function eliminarTabelas() {
  await executar([DROP]);
}

// Elimina tudo, cria e carrega, tudo na mesma transação.
export async function recriarTudo() {
  await executar([DROP, DDL, await cargaComSenha()]);
}
