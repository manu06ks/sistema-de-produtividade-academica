import { query } from '@/lib/db';

// Sessão aberta há mais tempo que isso é tratada como "esquecida"
// (aba fechada, computador dormiu...). Ela não conta como "agora".
export const LIMITE_SESSAO_ABERTA_HORAS = 6;

// Máximo que o navegador pode informar numa única sessão (24 h).
export const MAX_SEGUNDOS_SESSAO = 86400;

// Margem entre o tempo informado pelo navegador e o medido pelo servidor.
export const TOLERANCIA_SEGUNDOS = 5;

// Sessões menores que isso são descartadas (foi um clique sem querer).
export const MIN_SEGUNDOS_PARA_GRAVAR = 60;

// Pedaços de SQL reutilizados. Os horários ficam em UTC no banco.
// "agora" em UTC, sem fuso (mesmo tipo da coluna TIMESTAMP):
export const SQL_AGORA_UTC = `(NOW() AT TIME ZONE 'UTC')`;
// início em texto ISO, que o navegador entende com new Date(...):
export const SQL_INICIO_ISO = `to_char(data_hora_inicio, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;
// segundos desde o início, medidos pelo relógio do servidor:
export const SQL_DECORRIDO_SEGUNDOS = `FLOOR(EXTRACT(EPOCH FROM (${SQL_AGORA_UTC} - data_hora_inicio)))::int`;

// Aceita 5 ou "5". Devolve o número inteiro positivo ou null.
export function lerInteiroPositivo(valor) {
  const n = typeof valor === 'string' ? Number(valor) : valor;
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Sessão aberta do usuário (ou null). Já ignora as "esquecidas".
export async function buscarSessaoAberta(userId) {
  const { rows } = await query(
    `SELECT s.id_sessao AS id,
            ${SQL_INICIO_ISO} AS inicio,
            ${SQL_DECORRIDO_SEGUNDOS} AS decorrido_segundos,
            s.fk_atividade_id_atividade AS atividade_id,
            a.titulo AS atividade_titulo,
            d.nome AS disciplina_nome,
            d.cor AS disciplina_cor
       FROM sessao_estudo s
       JOIN atividade a ON a.id_atividade = s.fk_atividade_id_atividade
       JOIN disciplina d ON d.id_disciplina = a.fk_disciplina_id_disciplina
      WHERE s.fk_usuario_id_usuario = $1
        AND s.data_hora_fim IS NULL
        AND s.data_hora_inicio > ${SQL_AGORA_UTC} - make_interval(hours => $2::int)`,
    [userId, LIMITE_SESSAO_ABERTA_HORAS]
  );
  return rows[0] ?? null;
}