import { query, pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gerarCodigo } from "@/lib/codigo";

export async function GET() {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  try {
    const result = await query(
      `SELECT d.id_disciplina AS id,
              d.nome,
              d.nome_professor AS professor,
              d.semestre_letivo,
              d.cor,
              d.codigo_compartilhamento,
              u.nome AS criador_nome,
              (d.fk_usuario_id_criador = $1) AS is_criador,
              (SELECT COUNT(*)::int
                 FROM cursa m
                WHERE m.fk_disciplina_id_disciplina = d.id_disciplina) AS total_membros
         FROM cursa c
         JOIN disciplina d ON d.id_disciplina = c.fk_disciplina_id_disciplina
         JOIN usuario u ON u.id_usuario = d.fk_usuario_id_criador
        WHERE c.fk_usuario_id_usuario = $1
        ORDER BY d.semestre_letivo DESC, d.nome`,
      [sessao.userId]
    );
    return Response.json(result.rows);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}

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

  const nome = String(body.nome ?? "").trim();
  const professor = String(body.professor ?? "").trim();
  const semestre = String(body.semestre_letivo ?? "").trim();
  const cor = String(body.cor ?? "#7c3aed").trim();

  if (!nome || nome.length > 100) {
    return Response.json({ erro: "Informe o nome da disciplina (até 100 caracteres)." }, { status: 400 });
  }
  if (professor.length > 150) {
    return Response.json({ erro: "Nome do professor muito longo (máximo 150)." }, { status: 400 });
  }
  if (!semestre || semestre.length > 20) {
    return Response.json({ erro: "Informe o semestre letivo, por exemplo 2026.1." }, { status: 400 });
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(cor)) {
    return Response.json({ erro: "Cor inválida." }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let disciplina = null;
    for (let tentativa = 0; tentativa < 5 && !disciplina; tentativa++) {
      const r = await client.query(
        `INSERT INTO disciplina
                (nome, semestre_letivo, nome_professor, cor,
                 codigo_compartilhamento, fk_usuario_id_criador)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (codigo_compartilhamento) DO NOTHING
         RETURNING id_disciplina AS id, nome, nome_professor AS professor,
                   semestre_letivo, cor, codigo_compartilhamento`,
        [nome, semestre, professor || null, cor, gerarCodigo(), sessao.userId]
      );
      disciplina = r.rows[0] ?? null;
    }
    if (!disciplina) throw new Error("Não foi possível gerar um código único.");

    await client.query(
      `INSERT INTO cursa (fk_usuario_id_usuario, fk_disciplina_id_disciplina)
       VALUES ($1, $2)`,
      [sessao.userId, disciplina.id]
    );

    await client.query("COMMIT");
    return Response.json(disciplina, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23503") {
      return Response.json({ erro: "Não autenticado." }, { status: 401 });
    }
    console.error(err);
    return Response.json({ erro: "Erro interno ao criar a disciplina." }, { status: 500 });
  } finally {
    client.release();
  }
}