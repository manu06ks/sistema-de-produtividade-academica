import { connection } from "next/server";
import { query } from "@/lib/db";

// Lista de instituições com os cursos de cada uma, para o formulário de cadastro.
// Ordena pelo que aparece na tela primeiro (a sigla, ou o nome quando não há sigla).
export async function GET() {
  await connection();

  try {
    const result = await query(
      `SELECT i.id_instituicao,
              i.nome,
              i.sigla,
              COALESCE(
                json_agg(json_build_object('id_curso', c.id_curso, 'nome', c.nome)
                         ORDER BY norm_nome(c.nome))
                  FILTER (WHERE c.id_curso IS NOT NULL),
                '[]'::json
              ) AS cursos
         FROM instituicao i
         LEFT JOIN curso c ON c.fk_instituicao_id_instituicao = i.id_instituicao
        GROUP BY i.id_instituicao
        ORDER BY norm_nome(COALESCE(i.sigla, i.nome)), norm_nome(i.nome)`
    );
    return Response.json(result.rows);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}