import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SQL_HOJE_SP } from "@/lib/grupos";

// POST /api/grupos/entrar  { codigo } -> entra como Membro
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
      `SELECT g.id_grupo AS id,
              g.nome,
              g.status_ativo,
              EXISTS (SELECT 1
                        FROM participa p
                       WHERE p.fk_grupo_estudos_id_grupo = g.id_grupo
                         AND p.fk_usuario_id_usuario = $2) AS ja_participa
         FROM grupo_estudos g
        WHERE g.codigo_convite = $1`,
      [codigo, sessao.userId]
    );
    if (busca.rows.length === 0) {
      return Response.json({ erro: "Código inválido." }, { status: 404 });
    }
    const grupo = busca.rows[0];

    if (grupo.ja_participa) {
      return Response.json({ erro: "Você já participa deste grupo." }, { status: 409 });
    }
    if (!grupo.status_ativo) {
      return Response.json(
        { erro: "Este grupo foi encerrado e não aceita novos membros." },
        { status: 409 }
      );
    }

    const r = await query(
      `INSERT INTO participa
              (fk_usuario_id_usuario, fk_grupo_estudos_id_grupo, data_ingresso, papel_membro)
       VALUES ($1, $2, ${SQL_HOJE_SP}, 'Membro')
       ON CONFLICT DO NOTHING`,
      [sessao.userId, grupo.id]
    );
    if (r.rowCount === 0) {
      return Response.json({ erro: "Você já participa deste grupo." }, { status: 409 });
    }

    return Response.json({
      mensagem: `Você entrou em ${grupo.nome}.`,
      grupo: { id: grupo.id, nome: grupo.nome },
    });
  } catch (err) {
    // 23503: o grupo foi apagado entre a busca e a entrada
    if (err.code === "23503") {
      return Response.json({ erro: "Código inválido." }, { status: 404 });
    }
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}