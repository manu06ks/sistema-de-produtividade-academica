import { query, pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gerarCodigo } from "@/lib/codigo";
import { SQL_HOJE_SP, validarGrupo } from "@/lib/grupos";

// GET /api/grupos -> os grupos de que o usuário participa
export async function GET() {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT g.id_grupo AS id,
              g.nome,
              g.descricao,
              g.status_ativo,
              g.codigo_convite,
              p.papel_membro AS papel,
              (SELECT COUNT(*)::int
                 FROM participa m
                WHERE m.fk_grupo_estudos_id_grupo = g.id_grupo) AS total_membros
         FROM participa p
         JOIN grupo_estudos g ON g.id_grupo = p.fk_grupo_estudos_id_grupo
        WHERE p.fk_usuario_id_usuario = $1
        ORDER BY g.nome, g.id_grupo`,
      [sessao.userId]
    );
    return Response.json(result.rows);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}

// POST /api/grupos  { nome, descricao } -> cria o grupo; quem cria vira Administrador
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

  const validado = validarGrupo(body);
  if (validado.erro) {
    return Response.json({ erro: validado.erro }, { status: 400 });
  }
  const { nome, descricao } = validado.valores;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let grupo = null;
    for (let tentativa = 0; tentativa < 5 && !grupo; tentativa++) {
      const r = await client.query(
        `INSERT INTO grupo_estudos (nome, descricao, data_criacao, codigo_convite)
         VALUES ($1, $2, ${SQL_HOJE_SP}, $3)
         ON CONFLICT (codigo_convite) DO NOTHING
         RETURNING id_grupo AS id, nome, descricao, status_ativo, codigo_convite`,
        [nome, descricao, gerarCodigo()]
      );
      grupo = r.rows[0] ?? null;
    }
    if (!grupo) throw new Error("Não foi possível gerar um código único.");

    await client.query(
      `INSERT INTO participa
              (fk_usuario_id_usuario, fk_grupo_estudos_id_grupo, data_ingresso, papel_membro)
       VALUES ($1, $2, ${SQL_HOJE_SP}, 'Administrador')`,
      [sessao.userId, grupo.id]
    );

    await client.query("COMMIT");
    return Response.json(
      { ...grupo, papel: "Administrador", total_membros: 1 },
      { status: 201 }
    );
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503") {
      return Response.json({ erro: "Não autenticado." }, { status: 401 });
    }
    console.error(err);
    return Response.json({ erro: "Erro interno ao criar o grupo." }, { status: 500 });
  } finally {
    client.release();
  }
}