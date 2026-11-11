import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";
import {
  PRIORIDADES,
  STATUS,
  validarCamposAtividade,
  listarAtividadesDoUsuario,
} from "@/lib/atividades";

const naoAutenticado = () =>
  Response.json({ erro: "Não autenticado." }, { status: 401 });
const naoEncontrada = () =>
  Response.json({ erro: "Atividade não encontrada." }, { status: 404 });
const erroInterno = () =>
  Response.json({ erro: "Erro interno." }, { status: 500 });
const corpoInvalido = () =>
  Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });

async function lerCorpo(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Campos compartilhados: só o autor edita.
export async function PUT(request, { params }) {
  const sessao = await getSession();
  if (!sessao) return naoAutenticado();

  const atividadeId = lerId((await params).id);
  if (!atividadeId) return naoEncontrada();

  const body = await lerCorpo(request);
  if (!body) return corpoInvalido();

  const v = validarCamposAtividade(body);
  if (v.erro) return Response.json({ erro: v.erro }, { status: 400 });
  const { titulo, descricao, data, tipo, peso } = v.valores;

  try {
    const [atual] = await listarAtividadesDoUsuario(sessao.userId, atividadeId);
    if (!atual) return naoEncontrada();
    if (!atual.is_autor) {
      return Response.json(
        { erro: "Só o autor pode editar esta atividade." },
        { status: 403 }
      );
    }

    await query(
      `UPDATE atividade
          SET titulo = $1, descricao = $2, data_vencimento = $3,
              tipo_atividade = $4, peso_nota = $5
        WHERE id_atividade = $6 AND fk_usuario_id_criador = $7`,
      [titulo, descricao, data, tipo, peso, atividadeId, sessao.userId]
    );

    const [atividade] = await listarAtividadesDoUsuario(sessao.userId, atividadeId);
    return Response.json(atividade);
  } catch (err) {
    console.error(err);
    return erroInterno();
  }
}

// Campos pessoais: cada aluno muda o próprio status e a própria prioridade.
export async function PATCH(request, { params }) {
  const sessao = await getSession();
  if (!sessao) return naoAutenticado();

  const atividadeId = lerId((await params).id);
  if (!atividadeId) return naoEncontrada();

  const body = await lerCorpo(request);
  if (!body) return corpoInvalido();

  const status = body.status ?? null;
  const prioridade = body.prioridade ?? null;

  if (status === null && prioridade === null) {
    return Response.json({ erro: "Informe o status ou a prioridade." }, { status: 400 });
  }
  if (status !== null && !STATUS.includes(status)) {
    return Response.json({ erro: "Status inválido." }, { status: 400 });
  }
  if (prioridade !== null && !PRIORIDADES.includes(prioridade)) {
    return Response.json({ erro: "Prioridade inválida." }, { status: 400 });
  }

  try {
    const r = await query(
      `UPDATE atividade_usuario
          SET status = COALESCE($3, status),
              prioridade = COALESCE($4, prioridade)
        WHERE fk_usuario_id_usuario = $1
          AND fk_atividade_id_atividade = $2
          AND status_convite = 'Aceita'
          AND removida_em IS NULL`,
      [sessao.userId, atividadeId, status, prioridade]
    );
    if (r.rowCount === 0) return naoEncontrada();

    const [atividade] = await listarAtividadesDoUsuario(sessao.userId, atividadeId);
    return Response.json(atividade);
  } catch (err) {
    console.error(err);
    return erroInterno();
  }
}

// "Excluir" = esconder só para quem pediu. Nada é apagado.
export async function DELETE(request, { params }) {
  const sessao = await getSession();
  if (!sessao) return naoAutenticado();

  const atividadeId = lerId((await params).id);
  if (!atividadeId) return naoEncontrada();

  try {
    const r = await query(
      `UPDATE atividade_usuario
          SET removida_em = NOW()
        WHERE fk_usuario_id_usuario = $1
          AND fk_atividade_id_atividade = $2
          AND status_convite = 'Aceita'
          AND removida_em IS NULL`,
      [sessao.userId, atividadeId]
    );
    if (r.rowCount === 0) return naoEncontrada();
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return erroInterno();
  }
}