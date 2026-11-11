import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";
import {
  SQL_ITEM_COLUNAS,
  SQL_ITEM_JOINS,
  buscarDisciplinaDoMembro,
  guardarMaterial,
  lerEnvio,
} from "@/lib/materiais";

// GET /api/materiais?disciplina_id=  -> biblioteca das disciplinas do usuário
// (anexos de atividade não aparecem aqui)
export async function GET(request) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const filtro = new URL(request.url).searchParams.get("disciplina_id");
  const disciplinaId = filtro === null ? null : lerId(filtro);
  if (filtro !== null && !disciplinaId) {
    return Response.json({ erro: "Disciplina inválida." }, { status: 400 });
  }

  try {
    const r = await query(
      `SELECT ${SQL_ITEM_COLUNAS}
         FROM material m ${SQL_ITEM_JOINS}
         JOIN cursa c ON c.fk_disciplina_id_disciplina = d.id_disciplina
                     AND c.fk_usuario_id_usuario = $1
        WHERE m.fk_atividade_id_atividade IS NULL
          AND ($2::int IS NULL OR d.id_disciplina = $2::int)
        ORDER BY m.data_upload DESC, m.id_material DESC
        LIMIT 500`,
      [sessao.userId, disciplinaId]
    );
    return Response.json(r.rows);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao carregar a biblioteca." }, { status: 500 });
  }
}

// POST /api/materiais  (multipart: disciplina_id, nome opcional, arquivo)
export async function POST(request) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const envio = await lerEnvio(request);
  if (envio.resposta) return envio.resposta;

  const disciplinaId = lerId(envio.form.get("disciplina_id"));
  if (!disciplinaId) {
    return Response.json({ erro: "Escolha a disciplina." }, { status: 400 });
  }

  try {
    const disciplina = await buscarDisciplinaDoMembro(disciplinaId, sessao.userId);
    if (!disciplina) {
      return Response.json({ erro: "Disciplina não encontrada." }, { status: 404 });
    }

    const r = await guardarMaterial({ userId: sessao.userId, disciplinaId, envio });
    if (r.erro) {
      return Response.json({ erro: r.erro }, { status: r.status });
    }
    return Response.json(r.item, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao enviar o arquivo." }, { status: 500 });
  }
}