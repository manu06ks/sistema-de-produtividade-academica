import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";
import {
  SQL_ITEM_COLUNAS,
  SQL_ITEM_JOINS,
  atividadeVisivelPara,
  guardarMaterial,
  lerEnvio,
} from "@/lib/materiais";

// GET /api/atividades/:id/anexo -> { anexo: {...} | null }
export async function GET(_request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const atividadeId = lerId((await params).id);
  if (!atividadeId) {
    return Response.json({ erro: "Atividade não encontrada." }, { status: 404 });
  }

  try {
    const atividade = await atividadeVisivelPara(atividadeId, sessao.userId);
    if (!atividade) {
      return Response.json({ erro: "Atividade não encontrada." }, { status: 404 });
    }

    const r = await query(
      `SELECT ${SQL_ITEM_COLUNAS}
         FROM material m ${SQL_ITEM_JOINS}
        WHERE m.fk_atividade_id_atividade = $2`,
      [sessao.userId, atividadeId]
    );
    return Response.json({ anexo: r.rows[0] ?? null });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao carregar o anexo." }, { status: 500 });
  }
}

// POST /api/atividades/:id/anexo  (multipart: arquivo, nome opcional)
// Só quem criou a atividade anexa. Uma atividade tem no máximo um anexo.
export async function POST(request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const atividadeId = lerId((await params).id);
  if (!atividadeId) {
    return Response.json({ erro: "Atividade não encontrada." }, { status: 404 });
  }

  const envio = await lerEnvio(request);
  if (envio.resposta) return envio.resposta;

  try {
    const atividade = await atividadeVisivelPara(atividadeId, sessao.userId);
    if (!atividade) {
      return Response.json({ erro: "Atividade não encontrada." }, { status: 404 });
    }
    if (!atividade.sou_criador) {
      return Response.json(
        { erro: "Só quem criou a atividade pode anexar um arquivo." },
        { status: 403 }
      );
    }

    const jaTem = await query(
      "SELECT 1 FROM material WHERE fk_atividade_id_atividade = $1",
      [atividadeId]
    );
    if (jaTem.rows.length > 0) {
      return Response.json(
        { erro: "Esta atividade já tem um anexo. Apague o atual antes de enviar outro." },
        { status: 409 }
      );
    }

    const r = await guardarMaterial({
      userId: sessao.userId,
      disciplinaId: atividade.disciplina_id,
      atividadeId,
      envio,
    });
    if (r.erro) {
      return Response.json({ erro: r.erro }, { status: r.status });
    }
    return Response.json({ anexo: r.item }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao anexar o arquivo." }, { status: 500 });
  }
}