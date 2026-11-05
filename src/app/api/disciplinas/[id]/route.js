import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  lerId,
  buscarDisciplinaDoUsuario,
  validarDisciplina,
  SQL_DISCIPLINA_VAZIA,
} from "@/lib/disciplinas";

const naoAutenticado = () =>
  Response.json({ erro: "Não autenticado." }, { status: 401 });
const naoEncontrada = () =>
  Response.json({ erro: "Disciplina não encontrada." }, { status: 404 });
const erroInterno = () =>
  Response.json({ erro: "Erro interno." }, { status: 500 });

export async function GET(request, { params }) {
  const sessao = await getSession();
  if (!sessao) return naoAutenticado();

  const disciplinaId = lerId((await params).id);
  if (!disciplinaId) return naoEncontrada();

  try {
    const disciplina = await buscarDisciplinaDoUsuario(disciplinaId, sessao.userId);
    if (!disciplina) return naoEncontrada();

    const membros = await query(
      `SELECT u.id_usuario AS id,
              u.nome,
              (u.id_usuario = d.fk_usuario_id_criador) AS is_criador
         FROM cursa c
         JOIN usuario u ON u.id_usuario = c.fk_usuario_id_usuario
         JOIN disciplina d ON d.id_disciplina = c.fk_disciplina_id_disciplina
        WHERE c.fk_disciplina_id_disciplina = $1
        ORDER BY is_criador DESC, u.nome`,
      [disciplinaId]
    );

    return Response.json({ ...disciplina, membros: membros.rows });
  } catch (err) {
    console.error(err);
    return erroInterno();
  }
}

export async function PUT(request, { params }) {
  const sessao = await getSession();
  if (!sessao) return naoAutenticado();

  const disciplinaId = lerId((await params).id);
  if (!disciplinaId) return naoEncontrada();

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const v = validarDisciplina(body);
  if (v.erro) return Response.json({ erro: v.erro }, { status: 400 });
  const { nome, professor, semestre, cor } = v.valores;

  try {
    const atual = await buscarDisciplinaDoUsuario(disciplinaId, sessao.userId);
    if (!atual) return naoEncontrada();
    if (!atual.is_criador) {
      return Response.json(
        { erro: "Só o criador pode editar a disciplina." },
        { status: 403 }
      );
    }

    const r = await query(
      `UPDATE disciplina
          SET nome = $1, nome_professor = $2, semestre_letivo = $3, cor = $4
        WHERE id_disciplina = $5 AND fk_usuario_id_criador = $6
        RETURNING id_disciplina AS id, nome, nome_professor AS professor,
                  semestre_letivo, cor, codigo_compartilhamento`,
      [nome, professor, semestre, cor, disciplinaId, sessao.userId]
    );
    return Response.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    return erroInterno();
  }
}

export async function DELETE(request, { params }) {
  const sessao = await getSession();
  if (!sessao) return naoAutenticado();

  const disciplinaId = lerId((await params).id);
  if (!disciplinaId) return naoEncontrada();

  const bloqueio = {
    erro: "Só é possível apagar disciplinas sem outros alunos, atividades, materiais ou planos de estudo.",
  };

  try {
    const atual = await buscarDisciplinaDoUsuario(disciplinaId, sessao.userId);
    if (!atual) return naoEncontrada();
    if (!atual.is_criador) {
      return Response.json(
        { erro: "Só o criador pode apagar a disciplina." },
        { status: 403 }
      );
    }

    const r = await query(
      `DELETE FROM disciplina d
        WHERE d.id_disciplina = $1
          AND d.fk_usuario_id_criador = $2
          AND ${SQL_DISCIPLINA_VAZIA}`,
      [disciplinaId, sessao.userId]
    );
    if (r.rowCount === 0) return Response.json(bloqueio, { status: 409 });

    return Response.json({ ok: true });
  } catch (err) {
    if (err.code === "23503") return Response.json(bloqueio, { status: 409 });
    console.error(err);
    return erroInterno();
  }
}