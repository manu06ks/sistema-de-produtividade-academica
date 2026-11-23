import { query } from "@/lib/db";

// As três consultas da seção 6 do relatório (mesmo SQL do relatório).
export const CONSULTAS = [
  {
    id: 1,
    titulo: "Tempo de estudo por disciplina",
    descricao:
      "Para cada disciplina, a quantidade de sessões de estudo encerradas e o total de horas estudadas (soma dos minutos de todas as sessões). Mostra onde o tempo dos estudantes está sendo mais investido. Sessões ainda abertas ficam de fora.",
    tabelas: ["Sessao_Estudo", "Atividade", "Disciplina"],
    grafico: "pizza",
    sql: `SELECT d.nome                                      AS disciplina,
       COUNT(s.id_sessao)                          AS sessoes,
       ROUND(SUM(s.tempo_total_minutos) / 60.0, 1) AS horas_estudadas
  FROM sessao_estudo s
  JOIN atividade  a ON a.id_atividade   = s.fk_atividade_id_atividade
  JOIN disciplina d ON d.id_disciplina  = a.fk_disciplina_id_disciplina
 WHERE s.data_hora_fim IS NOT NULL
 GROUP BY d.id_disciplina, d.nome
 ORDER BY horas_estudadas DESC, d.nome`,
  },
  {
    id: 2,
    titulo: "Minutos estudados por membro de cada grupo",
    descricao:
      "Para cada grupo de estudos, o total de minutos estudados por cada membro, somando as sessões encerradas. É a base do ranking dos grupos. Quem ainda não estudou aparece com zero minuto.",
    tabelas: ["Grupo_Estudos", "participa", "Usuario", "Sessao_Estudo"],
    grafico: "barras-grupos",
    sql: `SELECT g.nome                                   AS grupo,
       u.nome                                   AS membro,
       COALESCE(SUM(s.tempo_total_minutos), 0)  AS minutos_estudados
  FROM grupo_estudos g
  JOIN participa p ON p.fk_grupo_estudos_id_grupo = g.id_grupo
  JOIN usuario   u ON u.id_usuario                = p.fk_usuario_id_usuario
  LEFT JOIN sessao_estudo s
         ON s.fk_usuario_id_usuario = u.id_usuario
        AND s.data_hora_fim IS NOT NULL
 GROUP BY g.id_grupo, g.nome, u.id_usuario, u.nome
 ORDER BY g.nome, minutos_estudados DESC, u.nome`,
  },
  {
    id: 3,
    titulo: "Conclusão das atividades por disciplina",
    descricao:
      "Para cada disciplina, quantas atividades os estudantes aceitaram, quantas já estão concluídas e o percentual de conclusão. Só entram atividades aceitas e não removidas do quadro. Mostra em quais disciplinas o trabalho está mais atrasado.",
    tabelas: ["Atividade_Usuario", "Atividade", "Disciplina"],
    grafico: "barras-duplas",
    sql: `SELECT d.nome                                                          AS disciplina,
       COUNT(*)                                                        AS atividades_aceitas,
       COUNT(*) FILTER (WHERE au.status = 'Concluído')                 AS concluidas,
       ROUND(100.0 * COUNT(*) FILTER (WHERE au.status = 'Concluído')
                   / COUNT(*), 1)                                      AS percentual_concluido
  FROM atividade_usuario au
  JOIN atividade  a ON a.id_atividade  = au.fk_atividade_id_atividade
  JOIN disciplina d ON d.id_disciplina = a.fk_disciplina_id_disciplina
 WHERE au.status_convite = 'Aceita'
   AND au.removida_em IS NULL
 GROUP BY d.id_disciplina, d.nome
 ORDER BY percentual_concluido DESC, d.nome`,
  },
];

// int4, int8 e numeric chegam como texto do driver: viram número para o gráfico.
const TIPOS_NUMERICOS = new Set([20, 21, 23, 700, 701, 1700]);

export async function executarConsulta(id) {
  const c = CONSULTAS.find((x) => x.id === id);
  if (!c) return null;
  const r = await query(c.sql);
  const numericas = new Set(r.fields.filter((f) => TIPOS_NUMERICOS.has(f.dataTypeID)).map((f) => f.name));
  const linhas = r.rows.map((linha) => {
    const o = {};
    for (const [k, v] of Object.entries(linha)) o[k] = numericas.has(k) && v !== null ? Number(v) : v;
    return o;
  });
  return {
    id: c.id,
    titulo: c.titulo,
    descricao: c.descricao,
    tabelas: c.tabelas,
    grafico: c.grafico,
    sql: c.sql,
    colunas: r.fields.map((f) => f.name),
    linhas,
  };
}
