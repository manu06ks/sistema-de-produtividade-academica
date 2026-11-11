import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";
import { LIMITE_SESSAO_ABERTA_HORAS } from "@/lib/sessoes";
import { PERIODOS, SQL_INICIO_PERIODO, buscarGrupoDoUsuario } from "@/lib/grupos";

// GET /api/grupos/:id/ranking?periodo=diario|semanal|mensal
export async function GET(request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const grupoId = lerId((await params).id);
  if (!grupoId) {
    return Response.json({ erro: "Grupo não encontrado." }, { status: 404 });
  }

  const periodo = new URL(request.url).searchParams.get("periodo") ?? "semanal";
  if (!PERIODOS.includes(periodo)) {
    return Response.json({ erro: "Período inválido." }, { status: 400 });
  }

  try {
    const grupo = await buscarGrupoDoUsuario(grupoId, sessao.userId);
    if (!grupo) {
      return Response.json({ erro: "Grupo não encontrado." }, { status: 404 });
    }

    // Horas = soma das sessões FECHADAS do membro, pelo horário de São Paulo
    // em que terminaram. "Focado agora" = sessão aberta há menos de 6 horas.
    const r = await query(
      `SELECT u.id_usuario AS id,
              u.nome,
              p.papel_membro AS papel,
              (u.id_usuario = $3) AS eh_voce,
              COALESCE((
                SELECT SUM(s.tempo_total_minutos)::int
                  FROM sessao_estudo s
                 WHERE s.fk_usuario_id_usuario = u.id_usuario
                   AND s.data_hora_fim IS NOT NULL
                   AND ((s.data_hora_fim AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo')
                       >= ${SQL_INICIO_PERIODO}
              ), 0) AS total_minutos,
              EXISTS (
                SELECT 1
                  FROM sessao_estudo s
                 WHERE s.fk_usuario_id_usuario = u.id_usuario
                   AND s.data_hora_fim IS NULL
                   AND s.data_hora_inicio >
                       (NOW() AT TIME ZONE 'UTC') - make_interval(hours => $4::int)
              ) AS esta_estudando
         FROM participa p
         JOIN usuario u ON u.id_usuario = p.fk_usuario_id_usuario
        WHERE p.fk_grupo_estudos_id_grupo = $1
        ORDER BY total_minutos DESC, u.nome, u.id_usuario`,
      [grupoId, periodo, sessao.userId, LIMITE_SESSAO_ABERTA_HORAS]
    );
    return Response.json(r.rows);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao carregar o ranking." }, { status: 500 });
  }
}