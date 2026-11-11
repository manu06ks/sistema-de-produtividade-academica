import { query } from "@/lib/db";

export const PERIODOS = ["diario", "semanal", "mensal"];

// "Hoje" no horário de São Paulo, só a data. Os servidores da Azure usam UTC,
// e sem isso quem entrasse à noite ficaria com a data de amanhã.
export const SQL_HOJE_SP = `((NOW() AT TIME ZONE 'America/Sao_Paulo')::date)`;

// Início do período pedido em $2, em hora de São Paulo. A semana começa no
// domingo, como o calendário do app. O date_trunc('week') começa na segunda,
// por isso o +1 e o -1 dia.
export const SQL_INICIO_PERIODO = `
  CASE $2::text
    WHEN 'diario'  THEN date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo')
    WHEN 'semanal' THEN date_trunc('week', (NOW() AT TIME ZONE 'America/Sao_Paulo') + interval '1 day') - interval '1 day'
    WHEN 'mensal'  THEN date_trunc('month', NOW() AT TIME ZONE 'America/Sao_Paulo')
  END`;

// Devolve o grupo só se o usuário for membro; senão, null.
export async function buscarGrupoDoUsuario(grupoId, userId) {
  const r = await query(
    `SELECT g.id_grupo AS id,
            g.nome,
            g.descricao,
            g.status_ativo,
            g.codigo_convite,
            to_char(g.data_criacao, 'YYYY-MM-DD') AS data_criacao,
            p.papel_membro AS papel,
            (p.papel_membro = 'Administrador') AS is_admin,
            (SELECT COUNT(*)::int
               FROM participa m
              WHERE m.fk_grupo_estudos_id_grupo = g.id_grupo) AS total_membros
       FROM participa p
       JOIN grupo_estudos g ON g.id_grupo = p.fk_grupo_estudos_id_grupo
      WHERE p.fk_grupo_estudos_id_grupo = $1
        AND p.fk_usuario_id_usuario = $2`,
    [grupoId, userId]
  );
  return r.rows[0] ?? null;
}

export function validarGrupo(body) {
  const nome = String(body?.nome ?? "").trim();
  const descricao = String(body?.descricao ?? "").trim();

  if (!nome || nome.length > 100) {
    return { erro: "Informe o nome do grupo (até 100 caracteres)." };
  }
  if (descricao.length > 500) {
    return { erro: "Descrição muito longa (máximo 500 caracteres)." };
  }
  return { valores: { nome, descricao: descricao || null } };
}