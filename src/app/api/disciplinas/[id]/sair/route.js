import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { lerId, buscarDisciplinaDoUsuario } from "@/lib/disciplinas";

export async function POST(request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const disciplinaId = lerId((await params).id);
  if (!disciplinaId) {
    return Response.json({ erro: "Disciplina não encontrada." }, { status: 404 });
  }

  let atual;
  try {
    atual = await buscarDisciplinaDoUsuario(disciplinaId, sessao.userId);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }

  if (!atual) {
    return Response.json({ erro: "Disciplina não encontrada." }, { status: 404 });
  }
  if (atual.is_criador) {
    return Response.json(
      { erro: "O criador não pode sair da disciplina. Se ela estiver vazia, você pode apagá-la." },
      { status: 409 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Esconde as atividades dessa disciplina do quadro do aluno (exclusão
    // lógica). As sessões de estudo e as horas continuam intactas.
    await client.query(
      `UPDATE atividade_usuario au
          SET removida_em = NOW()
         FROM atividade a
        WHERE au.fk_atividade_id_atividade = a.id_atividade
          AND a.fk_disciplina_id_disciplina = $1
          AND au.fk_usuario_id_usuario = $2
          AND au.removida_em IS NULL`,
      [disciplinaId, sessao.userId]
    );

    await client.query(
      `DELETE FROM cursa
        WHERE fk_disciplina_id_disciplina = $1
          AND fk_usuario_id_usuario = $2`,
      [disciplinaId, sessao.userId]
    );

    await client.query("COMMIT");
    return Response.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return Response.json({ erro: "Erro interno ao sair da disciplina." }, { status: 500 });
  } finally {
    client.release();
  }
}