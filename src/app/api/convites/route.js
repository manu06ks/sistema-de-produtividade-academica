import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  try {
    const r = await query(
      `SELECT a.id_atividade AS id,
              a.titulo,
              a.tipo_atividade,
              to_char(a.data_vencimento, 'YYYY-MM-DD') AS data_vencimento,
              d.nome AS disciplina_nome,
              d.cor AS disciplina_cor,
              u.nome AS autor_nome
         FROM atividade_usuario au
         JOIN atividade a ON a.id_atividade = au.fk_atividade_id_atividade
         JOIN disciplina d ON d.id_disciplina = a.fk_disciplina_id_disciplina
         JOIN usuario u ON u.id_usuario = a.fk_usuario_id_criador
        WHERE au.fk_usuario_id_usuario = $1
          AND au.status_convite = 'Pendente'
          AND au.removida_em IS NULL
        ORDER BY a.id_atividade DESC`,
      [sessao.userId]
    );
    return Response.json(r.rows);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}