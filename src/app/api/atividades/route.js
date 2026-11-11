import { query, pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";
import {
  PRIORIDADES,
  validarCamposAtividade,
  listarAtividadesDoUsuario,
} from "@/lib/atividades";

const naoAutenticado = () =>
  Response.json({ erro: "Não autenticado." }, { status: 401 });

export async function GET() {
  const sessao = await getSession();
  if (!sessao) return naoAutenticado();

  try {
    return Response.json(await listarAtividadesDoUsuario(sessao.userId));
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}

export async function POST(request) {
  const sessao = await getSession();
  if (!sessao) return naoAutenticado();

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const v = validarCamposAtividade(body);
  if (v.erro) return Response.json({ erro: v.erro }, { status: 400 });
  const { titulo, descricao, data, tipo, peso } = v.valores;

  const disciplinaId = lerId(body.disciplina_id);
  if (!disciplinaId) {
    return Response.json({ erro: "Selecione a disciplina." }, { status: 400 });
  }

  let prioridade = tipo === "Prova" ? "Alta" : "Média";
  if (body.prioridade !== undefined && body.prioridade !== null && body.prioridade !== "") {
    if (!PRIORIDADES.includes(body.prioridade)) {
      return Response.json({ erro: "Prioridade inválida." }, { status: 400 });
    }
    prioridade = body.prioridade;
  }

  const compartilhar = body.compartilhar === true;

  try {
    const membro = await query(
      `SELECT 1 FROM cursa
        WHERE fk_usuario_id_usuario = $1 AND fk_disciplina_id_disciplina = $2`,
      [sessao.userId, disciplinaId]
    );
    if (membro.rows.length === 0) {
      return Response.json({ erro: "Disciplina não encontrada." }, { status: 404 });
    }
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const nova = await client.query(
      `INSERT INTO atividade
              (titulo, descricao, data_vencimento, tipo_atividade, peso_nota,
               fk_disciplina_id_disciplina, fk_usuario_id_criador)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_atividade`,
      [titulo, descricao, data, tipo, peso, disciplinaId, sessao.userId]
    );
    const atividadeId = nova.rows[0].id_atividade;

    // O autor entra já com o convite aceito.
    await client.query(
      `INSERT INTO atividade_usuario
              (fk_usuario_id_usuario, fk_atividade_id_atividade, status_convite, prioridade)
       VALUES ($1, $2, 'Aceita', $3)`,
      [sessao.userId, atividadeId, prioridade]
    );

    // Compartilhar: um convite pendente para cada outro membro da disciplina.
    let convites = 0;
    if (compartilhar) {
      const r = await client.query(
        `INSERT INTO atividade_usuario
                (fk_usuario_id_usuario, fk_atividade_id_atividade, status_convite, prioridade)
         SELECT c.fk_usuario_id_usuario, $1::int, 'Pendente', $2::text
           FROM cursa c
          WHERE c.fk_disciplina_id_disciplina = $3
            AND c.fk_usuario_id_usuario <> $4`,
        [atividadeId, prioridade, disciplinaId, sessao.userId]
      );
      convites = r.rowCount;
    }

    await client.query("COMMIT");

    const [atividade] = await listarAtividadesDoUsuario(sessao.userId, atividadeId);
    return Response.json({ atividade, convites_enviados: convites }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503") return naoAutenticado();
    console.error(err);
    return Response.json({ erro: "Erro interno ao criar a atividade." }, { status: 500 });
  } finally {
    client.release();
  }
}