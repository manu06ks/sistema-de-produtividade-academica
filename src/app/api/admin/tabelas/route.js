import { connection } from "next/server";
import { barrar } from "@/lib/admin/auth";
import { metadados } from "@/lib/admin/crud";
import { TABELAS } from "@/lib/admin/tabelas";
import { query } from "@/lib/db";

// GET /api/admin/tabelas -> as 13 tabelas com colunas, chaves e quantas linhas cada uma tem.
export async function GET(request) {
  await connection();
  const negado = await barrar(request);
  if (negado) return negado;

  try {
    const meta = await metadados();
    const lista = [];
    for (const t of TABELAS) {
      const m = meta[t.nome];
      if (!m || m.colunas.length === 0) {
        lista.push({ nome: t.nome, titulo: t.titulo, existe: false });
        continue;
      }
      const n = (await query(`SELECT count(*)::int AS n FROM "${t.nome}"`)).rows[0].n;
      lista.push({ ...m, titulo: t.titulo, existe: true, total: n });
    }
    return Response.json({ tabelas: lista }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Admin: erro ao ler metadados:", err);
    return Response.json({ erro: "Não foi possível ler as tabelas." }, { status: 500 });
  }
}
