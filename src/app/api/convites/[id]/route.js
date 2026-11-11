import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";

export async function POST(request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const atividadeId = lerId((await params).id);
  if (!atividadeId) {
    return Response.json({ erro: "Convite não encontrado." }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (typeof body?.aceitar !== "boolean") {
    return Response.json({ erro: "Informe aceitar: true ou false." }, { status: 400 });
  }

  try {
    const r = await query(
      `UPDATE atividade_usuario
          SET status_convite = $3
        WHERE fk_usuario_id_usuario = $1
          AND fk_atividade_id_atividade = $2
          AND status_convite = 'Pendente'
          AND removida_em IS NULL`,
      [sessao.userId, atividadeId, body.aceitar ? "Aceita" : "Recusada"]
    );
    if (r.rowCount === 0) {
      return Response.json({ erro: "Convite não encontrado." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}