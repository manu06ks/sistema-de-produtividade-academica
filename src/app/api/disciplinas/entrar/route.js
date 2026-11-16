import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { convidarParaAtividadesDaTurma } from "@/lib/atividades";

export async function POST(request) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const codigo = String(body?.codigo ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(codigo)) {
    return Response.json({ erro: "Informe o código de 6 caracteres." }, { status: 400 });
  }

  const client = await pool.connect();
  let destruir = false;
  try {
    await client.query("BEGIN");

    // Acha a disciplina e já a trava (sem bloquear quem só consulta). A
    // criação de uma atividade compartilhada trava do mesmo jeito, então as
    // duas coisas nunca se cruzam sem que um enxergue o outro.
    const busca = await client.query(
      `SELECT id_disciplina AS id, nome
         FROM disciplina
        WHERE codigo_compartilhamento = $1
          FOR NO KEY UPDATE`,
      [codigo]
    );
    if (busca.rows.length === 0) {
      await client.query("ROLLBACK");
      return Response.json({ erro: "Código inválido." }, { status: 404 });
    }
    const disciplina = busca.rows[0];

    const r = await client.query(
      `INSERT INTO cursa (fk_usuario_id_usuario, fk_disciplina_id_disciplina)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [sessao.userId, disciplina.id]
    );
    if (r.rowCount === 0) {
      await client.query("ROLLBACK");
      return Response.json({ erro: "Você já participa desta disciplina." }, { status: 409 });
    }

    // O que a turma já compartilhou vira convite para quem acabou de entrar.
    const pendentes = await convidarParaAtividadesDaTurma(client, sessao.userId, disciplina.id);

    await client.query("COMMIT");

    const aviso =
      pendentes === 0
        ? ""
        : pendentes === 1
          ? " 1 atividade da turma aguarda sua resposta no sino de notificações."
          : ` ${pendentes} atividades da turma aguardam sua resposta no sino de notificações.`;

    return Response.json({
      mensagem: `Você entrou em ${disciplina.nome}.${aviso}`,
      disciplina,
      convites_pendentes: pendentes,
    });
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      destruir = true; // não deu para desfazer: não devolve a conexão ao pool
    }
    if (err.code === "23503") {
      return Response.json({ erro: "Não autenticado." }, { status: 401 });
    }
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  } finally {
    client.release(destruir);
  }
}