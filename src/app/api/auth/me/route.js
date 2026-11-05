import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT u.id_usuario, u.nome, u.email, u.data_cadastro,
              c.nome AS curso, i.sigla AS instituicao
         FROM usuario u
         JOIN curso c ON c.id_curso = u.fk_curso_id_curso
         JOIN instituicao i ON i.id_instituicao = c.fk_instituicao_id_instituicao
        WHERE u.id_usuario = $1`,
      [sessao.userId]
    );

    if (result.rows.length === 0) {
      return Response.json({ erro: "Não autenticado." }, { status: 401 });
    }
    return Response.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}