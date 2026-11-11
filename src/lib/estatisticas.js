import { query } from "@/lib/db";

// Estatísticas de estudo de UM aluno, calculadas a partir de Sessao_Estudo.
// Só entram sessões FECHADAS (data_hora_fim preenchida), igual ao ranking dos
// grupos: o tempo de "Semana" aqui é o mesmo número do ranking semanal.
// A sessão em andamento (timer rodando) só entra depois de salva.
//
// Os horários ficam em UTC no banco. Para decidir "em que dia" uma sessão
// caiu, convertemos para o horário de São Paulo.
const FUSO = "America/Sao_Paulo";
const SQL_FIM_SP = `((s.data_hora_fim AT TIME ZONE 'UTC') AT TIME ZONE '${FUSO}')`;
const SQL_INICIO_SP = `((s.data_hora_inicio AT TIME ZONE 'UTC') AT TIME ZONE '${FUSO}')`;
// Sessão que conta: já fechada e com algum tempo registrado.
const SQL_SESSAO_VALIDA = `s.data_hora_fim IS NOT NULL AND s.tempo_total_minutos > 0`;

export const DIAS_PADROES = 90;      // janela do bloco "Quando você mais estuda"
const DIAS_MAX_SEQUENCIA = 400;      // até onde olhamos para trás para contar a sequência

// ---------------------------------------------------------------------
// Datas como texto "AAAA-MM-DD". Aqui só importa o calendário (dia, mês,
// dia da semana), então o cálculo é feito em UTC para não depender do fuso
// do servidor.
// ---------------------------------------------------------------------
function emMilissegundos(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

export function somarDias(iso, dias) {
  return new Date(emMilissegundos(iso) + dias * 86400000).toISOString().slice(0, 10);
}

export function diferencaDias(de, ate) {
  return Math.round((emMilissegundos(ate) - emMilissegundos(de)) / 86400000);
}

function diaDaSemana(iso) {
  return new Date(emMilissegundos(iso)).getUTCDay(); // 0 = domingo ... 6 = sábado
}

function primeiroDiaDoMesSeguinte(iso) {
  const [ano, mes] = iso.split("-").map(Number);
  const proximoAno = mes === 12 ? ano + 1 : ano;
  const proximoMes = mes === 12 ? 1 : mes + 1;
  return `${proximoAno}-${String(proximoMes).padStart(2, "0")}-01`;
}

// Limites de cada período, a partir de "hoje" (em São Paulo).
//   inicio..fim            -> o que entra nos números do resumo e na divisão por disciplina
//   graficoInicio..Fim     -> os dias que o gráfico mostra
// A semana começa no domingo, como o calendário do app e o ranking.
export function limitesDoPeriodo(periodo, hoje) {
  if (periodo === "diario") {
    // Um gráfico de um dia só não diz nada: mostramos os últimos 7 dias.
    return { inicio: hoje, fim: hoje, graficoInicio: somarDias(hoje, -6), graficoFim: hoje };
  }
  if (periodo === "semanal") {
    const inicio = somarDias(hoje, -diaDaSemana(hoje));
    return { inicio, fim: hoje, graficoInicio: inicio, graficoFim: somarDias(inicio, 6) };
  }
  const inicio = `${hoje.slice(0, 8)}01`;
  return {
    inicio,
    fim: hoje,
    graficoInicio: inicio,
    graficoFim: somarDias(primeiroDiaDoMesSeguinte(inicio), -1),
  };
}

// Dias seguidos estudando. Se hoje ainda não teve estudo, a sequência continua
// valendo a partir de ontem (o aluno ainda tem o dia de hoje para mantê-la).
export function calcularSequencia(datas, hoje) {
  const estudou = new Set(datas);
  const estudouHoje = estudou.has(hoje);
  let dia = estudouHoje ? hoje : somarDias(hoje, -1);
  let dias = 0;
  while (estudou.has(dia)) {
    dias++;
    dia = somarDias(dia, -1);
  }
  return { dias, estudouHoje };
}

// Maior total entre as posições de uma lista (empate: a primeira). null se tudo é zero.
function indiceDoMaior(valores) {
  let melhor = null;
  valores.forEach((v, i) => {
    if (v > 0 && (melhor === null || v > valores[melhor])) melhor = i;
  });
  return melhor;
}

export async function buscarEstatisticas(userId, periodo) {
  // "Hoje" é lido UMA vez: todos os cálculos abaixo usam este mesmo dia, mesmo
  // que a meia-noite passe no meio da consulta.
  const agora = await query(
    `SELECT to_char((NOW() AT TIME ZONE '${FUSO}')::date, 'YYYY-MM-DD') AS hoje`
  );
  const hoje = agora.rows[0].hoje;
  const limites = limitesDoPeriodo(periodo, hoje);

  const [porDia, porDisciplina, porHorario, datasEstudadas] = await Promise.all([
    // total de cada dia que o gráfico mostra
    query(
      `SELECT to_char(${SQL_FIM_SP}::date, 'YYYY-MM-DD') AS data,
              SUM(s.tempo_total_minutos)::int AS minutos,
              COUNT(*)::int AS sessoes
         FROM sessao_estudo s
        WHERE s.fk_usuario_id_usuario = $1
          AND ${SQL_SESSAO_VALIDA}
          AND ${SQL_FIM_SP}::date BETWEEN $2::date AND $3::date
        GROUP BY 1`,
      [userId, limites.graficoInicio, limites.graficoFim]
    ),
    // tempo por disciplina, dentro do período (inclusive disciplinas que o aluno já deixou)
    query(
      `SELECT d.id_disciplina AS id,
              d.nome,
              d.cor,
              SUM(s.tempo_total_minutos)::int AS minutos,
              COUNT(*)::int AS sessoes
         FROM sessao_estudo s
         JOIN atividade a ON a.id_atividade = s.fk_atividade_id_atividade
         JOIN disciplina d ON d.id_disciplina = a.fk_disciplina_id_disciplina
        WHERE s.fk_usuario_id_usuario = $1
          AND ${SQL_SESSAO_VALIDA}
          AND ${SQL_FIM_SP}::date BETWEEN $2::date AND $3::date
        GROUP BY d.id_disciplina, d.nome, d.cor
        ORDER BY minutos DESC, d.nome, d.id_disciplina`,
      [userId, limites.inicio, limites.fim]
    ),
    // dia da semana x faixa do dia em que a sessão COMEÇOU (últimos 90 dias)
    query(
      `SELECT EXTRACT(DOW FROM ${SQL_INICIO_SP})::int AS dia_semana,
              (EXTRACT(HOUR FROM ${SQL_INICIO_SP})::int / 6) AS faixa,
              SUM(s.tempo_total_minutos)::int AS minutos
         FROM sessao_estudo s
        WHERE s.fk_usuario_id_usuario = $1
          AND ${SQL_SESSAO_VALIDA}
          AND ${SQL_INICIO_SP}::date BETWEEN $2::date AND $3::date
        GROUP BY 1, 2`,
      [userId, somarDias(hoje, -(DIAS_PADROES - 1)), hoje]
    ),
    // dias em que houve estudo (para a sequência)
    query(
      `SELECT DISTINCT to_char(${SQL_FIM_SP}::date, 'YYYY-MM-DD') AS data
         FROM sessao_estudo s
        WHERE s.fk_usuario_id_usuario = $1
          AND ${SQL_SESSAO_VALIDA}
          AND ${SQL_FIM_SP}::date >= $2::date`,
      [userId, somarDias(hoje, -DIAS_MAX_SEQUENCIA)]
    ),
  ]);

  // ---- um item para cada dia do gráfico, inclusive os sem estudo ----
  const totaisPorData = new Map(porDia.rows.map((r) => [r.data, r]));
  const dias = [];
  for (let data = limites.graficoInicio; data <= limites.graficoFim; data = somarDias(data, 1)) {
    const total = totaisPorData.get(data);
    dias.push({
      data,
      minutos: total?.minutos ?? 0,
      sessoes: total?.sessoes ?? 0,
      eh_hoje: data === hoje,
      futuro: data > hoje,
    });
  }

  // ---- resumo: só os dias do período (de "inicio" até hoje) ----
  const doPeriodo = dias.filter((d) => d.data >= limites.inicio && d.data <= limites.fim);
  const totalMinutos = doPeriodo.reduce((soma, d) => soma + d.minutos, 0);
  const sessoes = doPeriodo.reduce((soma, d) => soma + d.sessoes, 0);
  const melhor = doPeriodo.reduce((m, d) => (d.minutos > (m?.minutos ?? 0) ? d : m), null);
  const sequencia = calcularSequencia(
    datasEstudadas.rows.map((r) => r.data),
    hoje
  );

  // ---- quando o aluno mais estuda ----
  const matriz = Array.from({ length: 7 }, () => [0, 0, 0, 0]);
  for (const r of porHorario.rows) matriz[r.dia_semana][r.faixa] += r.minutos;
  const totalPorDiaSemana = matriz.map((faixas) => faixas.reduce((a, b) => a + b, 0));
  const totalPorFaixa = [0, 1, 2, 3].map((f) => matriz.reduce((soma, linha) => soma + linha[f], 0));

  return {
    periodo,
    hoje,
    inicio: limites.inicio,
    fim: limites.fim,
    resumo: {
      total_minutos: totalMinutos,
      sessoes,
      media_minutos: sessoes > 0 ? Math.round(totalMinutos / sessoes) : 0,
      dias_estudados: doPeriodo.filter((d) => d.minutos > 0).length,
      dias_no_periodo: doPeriodo.length,
      melhor_dia: melhor ? { data: melhor.data, minutos: melhor.minutos } : null,
      sequencia_dias: sequencia.dias,
      estudou_hoje: sequencia.estudouHoje,
    },
    dias,
    disciplinas: porDisciplina.rows,
    padroes: {
      dias_considerados: DIAS_PADROES,
      total_minutos: totalPorDiaSemana.reduce((a, b) => a + b, 0),
      matriz,
      melhor_dia_semana: indiceDoMaior(totalPorDiaSemana),
      melhor_faixa: indiceDoMaior(totalPorFaixa),
    },
  };
}