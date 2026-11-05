import { connection } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  await connection();

  try {
    const result = await query(
      `SELECT c.id_curso,
              c.nome,
              COALESCE(i.sigla, i.nome) AS instituicao
         FROM curso c
         JOIN instituicao i ON i.id_instituicao = c.fk_instituicao_id_instituicao
        ORDER BY instituicao, c.nome`
    );
    return Response.json(result.rows);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}