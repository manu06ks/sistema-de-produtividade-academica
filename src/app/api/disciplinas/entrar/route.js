import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

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

  const codigo = String(body.codigo ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(codigo)) {
    return Response.json({ erro: "Informe o código de 6 caracteres." }, { status: 400 });
  }

  try {
    const busca = await query(
      "SELECT id_disciplina AS id, nome FROM disciplina WHERE codigo_compartilhamento = $1",
      [codigo]
    );
    if (busca.rows.length === 0) {
      return Response.json({ erro: "Código inválido." }, { status: 404 });
    }
    const disciplina = busca.rows[0];

    const r = await query(
      `INSERT INTO cursa (fk_usuario_id_usuario, fk_disciplina_id_disciplina)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [sessao.userId, disciplina.id]
    );
    if (r.rowCount === 0) {
      return Response.json({ erro: "Você já participa desta disciplina." }, { status: 409 });
    }

    return Response.json({ mensagem: `Você entrou em ${disciplina.nome}.`, disciplina });
  } catch (err) {
    if (err.code === "23503") {
      return Response.json({ erro: "Não autenticado." }, { status: 401 });
    }
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}