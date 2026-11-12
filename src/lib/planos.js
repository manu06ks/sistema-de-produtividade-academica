import { query, pool } from "@/lib/db";
import { somarDias, diferencaDias } from "@/lib/estatisticas";
import { configuracaoIA, iaConfigurada, gerarJson, calcularCustoUSD, ErroIA } from "@/lib/ia";
import { INSTRUCAO_SISTEMA, MAX_BLOCOS_POR_DIA, TIPOS_BLOCO, montarPedidoUsuario } from "@/lib/planos-prompt";

// ---------------------------------------------------------------------
// Regras do plano de estudos com IA
// ---------------------------------------------------------------------
export const LIMITE_PLANOS_POR_DIA = 5;   // por aluno e por dia; conta todo pedido que chegou a gastar tokens, deu plano ou não
export const DIAS_MAXIMOS = 30;           // de hoje até a data-alvo, contando os dois
export const HORAS_MINIMAS = 0.5;
export const HORAS_MAXIMAS = 12;
export const MAX_CONTEUDOS = 2000;
const MAX_ATIVIDADES_NO_PEDIDO = 20;
const MAX_CONCLUIDAS_NO_PEDIDO = 5;
const TENTATIVAS_COM_A_IA = 2;            // 1 chamada + 1 nova tentativa se a resposta vier inválida
const CLASSE_TRAVA = 15;                  // "gaveta" das travas do passo 15 (outras partes do app usam outra)

const FUSO = "America/Sao_Paulo";
const SQL_FIM_SP = `((s.data_hora_fim AT TIME ZONE 'UTC') AT TIME ZONE '${FUSO}')`;
const SQL_HOJE = `to_char((NOW() AT TIME ZONE '${FUSO}')::date, 'YYYY-MM-DD')`;
const SQL_REQUISICAO_SP = `((h.data_requi AT TIME ZONE 'UTC') AT TIME ZONE '${FUSO}')`;

// Erro "esperado": vira uma resposta HTTP com a mensagem para o aluno.
export class ErroPedido extends Error {
  constructor(status, mensagem, extra = {}) {
    super(mensagem);
    this.status = status;
    this.extra = extra;
  }
}

export async function lerHoje() {
  const r = await query(`SELECT ${SQL_HOJE} AS hoje`);
  return r.rows[0].hoje;
}

// ---------------------------------------------------------------------
// 1) Validar o que o aluno pediu
// ---------------------------------------------------------------------
function dataValida(texto) {
  if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [a, m, d] = texto.split("-").map(Number);
  const data = new Date(Date.UTC(a, m - 1, d));
  return data.getUTCFullYear() === a && data.getUTCMonth() === m - 1 && data.getUTCDate() === d;
}

export function validarPedido(body, hoje) {
  const disciplinaId = Number(body?.disciplina_id);
  if (!Number.isInteger(disciplinaId) || disciplinaId <= 0) {
    throw new ErroPedido(400, "Escolha a disciplina.");
  }

  const dataAlvo = body?.data_alvo;
  if (!dataValida(dataAlvo)) throw new ErroPedido(400, "Informe a data-alvo no formato AAAA-MM-DD.");
  if (dataAlvo < hoje) throw new ErroPedido(400, "A data-alvo não pode ser anterior a hoje.");
  if (diferencaDias(hoje, dataAlvo) + 1 > DIAS_MAXIMOS) {
    throw new ErroPedido(400, `O plano pode ter no máximo ${DIAS_MAXIMOS} dias. Escolha uma data mais próxima.`);
  }

  const horas = Number(body?.horas_por_dia);
  if (!Number.isFinite(horas) || horas < HORAS_MINIMAS || horas > HORAS_MAXIMAS || !Number.isInteger(horas * 2)) {
    throw new ErroPedido(400, "Informe as horas por dia: de 0,5 a 12, de meia em meia hora.");
  }

  const conteudos = String(body?.conteudos ?? "").trim();
  if (conteudos.length > MAX_CONTEUDOS) {
    throw new ErroPedido(400, `Os conteúdos podem ter até ${MAX_CONTEUDOS} caracteres.`);
  }

  return { disciplinaId, dataAlvo, horasPorDia: horas, minutosPorDia: Math.round(horas * 60), conteudos };
}

// ---------------------------------------------------------------------
// 2) Juntar os dados do aluno que vão para a IA
// ---------------------------------------------------------------------
async function buscarDisciplina(disciplinaId, userId) {
  const r = await query(
    `SELECT d.id_disciplina AS id, d.nome, d.semestre_letivo AS semestre,
            d.nome_professor AS professor
       FROM disciplina d
       JOIN cursa c ON c.fk_disciplina_id_disciplina = d.id_disciplina
                   AND c.fk_usuario_id_usuario = $2
      WHERE d.id_disciplina = $1`,
    [disciplinaId, userId]
  );
  return r.rows[0] ?? null;
}

// Só o que o aluno enxerga no quadro dele: convite aceito e não removido.
const SQL_ATIVIDADES = `
  SELECT a.id_atividade AS id,
         a.titulo,
         a.descricao,
         to_char(a.data_vencimento, 'YYYY-MM-DD') AS vencimento,
         a.tipo_atividade AS tipo,
         a.peso_nota::float8 AS peso_nota,
         au.status,
         au.prioridade,
         COALESCE((SELECT SUM(s.tempo_total_minutos)
                     FROM sessao_estudo s
                    WHERE s.fk_usuario_id_usuario = $1
                      AND s.fk_atividade_id_atividade = a.id_atividade
                      AND s.data_hora_fim IS NOT NULL
                      AND s.tempo_total_minutos > 0), 0)::int AS minutos_estudados
    FROM atividade a
    JOIN atividade_usuario au ON au.fk_atividade_id_atividade = a.id_atividade
                             AND au.fk_usuario_id_usuario = $1
   WHERE a.fk_disciplina_id_disciplina = $2
     AND au.status_convite = 'Aceita'
     AND au.removida_em IS NULL`;

async function montarContexto(userId, pedido, disciplina, hoje) {
  const dias = [];
  for (let d = hoje; d <= pedido.dataAlvo; d = somarDias(d, 1)) dias.push(d);

  const [pendentes, concluidas, recente] = await Promise.all([
    query(
      `${SQL_ATIVIDADES}
       AND au.status <> 'Concluído'
       ORDER BY a.data_vencimento NULLS LAST, a.id_atividade
       LIMIT ${MAX_ATIVIDADES_NO_PEDIDO}`,
      [userId, pedido.disciplinaId]
    ),
    query(
      `${SQL_ATIVIDADES}
       AND au.status = 'Concluído'
       ORDER BY a.data_vencimento DESC NULLS LAST, a.id_atividade DESC
       LIMIT ${MAX_CONCLUIDAS_NO_PEDIDO}`,
      [userId, pedido.disciplinaId]
    ),
    query(
      `SELECT COALESCE(SUM(s.tempo_total_minutos), 0)::int AS minutos,
              COUNT(*)::int AS sessoes,
              COUNT(DISTINCT ${SQL_FIM_SP}::date)::int AS dias
         FROM sessao_estudo s
         JOIN atividade a ON a.id_atividade = s.fk_atividade_id_atividade
        WHERE s.fk_usuario_id_usuario = $1
          AND a.fk_disciplina_id_disciplina = $2
          AND s.data_hora_fim IS NOT NULL
          AND s.tempo_total_minutos > 0
          AND ${SQL_FIM_SP}::date BETWEEN $3::date AND $4::date`,
      [userId, pedido.disciplinaId, somarDias(hoje, -13), hoje]
    ),
  ]);

  return {
    hoje,
    alvo: pedido.dataAlvo,
    dias,
    minutosPorDia: pedido.minutosPorDia,
    disciplina,
    atividades: pendentes.rows,
    concluidas: concluidas.rows,
    recente: recente.rows[0],
    conteudos: pedido.conteudos,
  };
}

// ---------------------------------------------------------------------
// 3) Conferir o que a IA devolveu
// A IA pode errar o formato. Em vez de confiar, validamos tudo, corrigimos o
// que dá para corrigir (e anotamos em "ajustes") e recusamos o que não dá.
// ---------------------------------------------------------------------
function extrairJson(texto) {
  const t = String(texto ?? "").trim();
  try {
    return JSON.parse(t);
  } catch {
    // A IA às vezes envolve o JSON em ```json ... ``` ou escreve uma frase antes:
    // pegamos tudo entre a primeira "{" e a última "}".
    const i = t.indexOf("{");
    const j = t.lastIndexOf("}");
    if (i >= 0 && j > i) {
      try {
        return JSON.parse(t.slice(i, j + 1));
      } catch {
        /* cai no return abaixo */
      }
    }
    return null;
  }
}

function limpar(valor, max) {
  if (typeof valor !== "string") return "";
  const t = valor.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function lerBloco(b, idsAtividades) {
  if (!b || typeof b !== "object") return null;
  const titulo = limpar(b.titulo, 90);
  const minutos = Math.round(Number(b.minutos));
  if (!titulo || !Number.isFinite(minutos) || minutos < 5 || minutos > 180) return null;
  return {
    titulo,
    minutos,
    tipo: TIPOS_BLOCO.includes(b.tipo) ? b.tipo : "estudo",
    atividade_id: Number.isInteger(b.atividade_id) && idsAtividades.has(b.atividade_id) ? b.atividade_id : null,
    detalhes: limpar(b.detalhes, 140),
  };
}

export function lerPlanoDaIA(texto, { dias, minutosPorDia, idsAtividades }) {
  const bruto = extrairJson(texto);
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) {
    return { ok: false, motivo: "a resposta não é um objeto JSON" };
  }
  if (!Array.isArray(bruto.dias)) return { ok: false, motivo: 'falta a lista "dias"' };

  const porData = new Map();
  for (const d of bruto.dias) {
    const data = typeof d?.data === "string" ? d.data.trim() : null;
    if (data && !porData.has(data)) porData.set(data, d);
  }
  const encontrados = dias.filter((d) => porData.has(d)).length;
  if (encontrados === 0) return { ok: false, motivo: 'nenhuma das datas pedidas aparece em "dias"' };
  if (encontrados < Math.ceil(dias.length / 2)) return { ok: false, motivo: "faltam muitos dos dias pedidos" };

  const resumo = limpar(bruto.resumo, 600);
  if (!resumo) return { ok: false, motivo: 'falta o "resumo"' };

  const ajustes = [];
  const diasLidos = dias.map((data) => {
    const d = porData.get(data);
    if (!d) {
      ajustes.push(`${data}: a IA não trouxe este dia, que ficou como dia livre.`);
      return { data, foco: "Dia livre", blocos: [] };
    }
    const blocos = (Array.isArray(d.blocos) ? d.blocos : [])
      .map((b) => lerBloco(b, idsAtividades))
      .filter(Boolean)
      .slice(0, MAX_BLOCOS_POR_DIA);

    let soma = blocos.reduce((s, b) => s + b.minutos, 0);
    while (soma > minutosPorDia && blocos.length > 1) {
      const tirado = blocos.pop();
      soma -= tirado.minutos;
      ajustes.push(`${data}: o bloco "${tirado.titulo}" foi removido para respeitar o limite de horas do dia.`);
    }
    if (blocos.length === 1 && blocos[0].minutos > minutosPorDia) {
      blocos[0].minutos = minutosPorDia;
      ajustes.push(`${data}: o bloco "${blocos[0].titulo}" foi encurtado para respeitar o limite de horas do dia.`);
    }
    return { data, foco: limpar(d.foco, 80) || (blocos.length ? "Estudo do dia" : "Dia livre"), blocos };
  });

  if (!diasLidos.some((d) => d.blocos.length > 0)) {
    return { ok: false, motivo: "o plano não tem nenhum bloco de estudo válido" };
  }

  const dicas = (Array.isArray(bruto.dicas) ? bruto.dicas : []).map((t) => limpar(t, 140)).filter(Boolean).slice(0, 4);
  return { ok: true, plano: { resumo, dias: diasLidos, dicas }, ajustes };
}

// ---------------------------------------------------------------------
// 4) Uso e custo
// ---------------------------------------------------------------------
export async function resumoDeUso(userId, hoje) {
  const soma = (inicio, fim) =>
    query(
      `SELECT COUNT(*)::int AS requisicoes,
              COALESCE(SUM(h.tokens_entrada), 0)::float8 AS tokens_entrada,
              COALESCE(SUM(h.tokens_saida), 0)::float8 AS tokens_saida,
              COALESCE(SUM(h.custo_total), 0)::float8 AS custo
         FROM historico_tokens_ia h
        WHERE h.fk_usuario_id_usuario = $1
          AND ${SQL_REQUISICAO_SP}::date BETWEEN $2::date AND $3::date`,
      [userId, inicio, fim]
    );
  const [dia, mes] = await Promise.all([soma(hoje, hoje), soma(`${hoje.slice(0, 8)}01`, hoje)]);
  return {
    hoje: { usados: dia.rows[0].requisicoes, limite: LIMITE_PLANOS_POR_DIA },
    mes: mes.rows[0],
  };
}

// ---------------------------------------------------------------------
// 5) Gerar um plano
// ---------------------------------------------------------------------
function traduzirErroIA(e) {
  switch (e.codigo) {
    case "sem_chave":
      return new ErroPedido(503, "A IA ainda não foi configurada no servidor.");
    case "chave_invalida":
      return new ErroPedido(503, "A IA recusou a chave de acesso. Confira a configuração do servidor.");
    case "modelo_invalido":
      return new ErroPedido(503, "O modelo de IA configurado não foi encontrado. Confira a configuração do servidor.");
    case "limite_provedor":
      return new ErroPedido(429, "A IA está com muitas requisições agora. Tente de novo em alguns minutos.");
    case "tempo_esgotado":
      return new ErroPedido(504, "A IA demorou demais para responder. Tente de novo.");
    case "bloqueado":
      return new ErroPedido(422, "A IA se recusou a gerar este plano. Revise o texto dos conteúdos e tente de novo.");
    case "cortada":
    case "vazia":
    case "formato":
      return new ErroPedido(502, "A IA devolveu um plano incompleto. Tente de novo.");
    default:
      return new ErroPedido(502, "A IA está indisponível no momento. Tente de novo em instantes.");
  }
}

export async function gerarPlano(userId, body) {
  const hoje = await lerHoje();
  const pedido = validarPedido(body, hoje);
  if (!iaConfigurada()) throw traduzirErroIA(new ErroIA("sem_chave"));

  const disciplina = await buscarDisciplina(pedido.disciplinaId, userId);
  if (!disciplina) throw new ErroPedido(404, "Disciplina não encontrada.");

  // Uma geração por vez por aluno, mesmo com vários servidores: uma "trava" do
  // próprio PostgreSQL, presa a esta conexão até terminarmos. Sem ela, dois
  // cliques rápidos passariam juntos pelo limite diário.
  const client = await pool.connect();
  let descartarConexao = false;
  try {
    const trava = await client.query("SELECT pg_try_advisory_lock($1, $2) AS ok", [CLASSE_TRAVA, userId]);
    if (!trava.rows[0].ok) {
      throw new ErroPedido(409, "Você já tem um plano sendo gerado. Aguarde terminar.");
    }
    try {
      return await gerarComTrava(client, userId, pedido, disciplina, hoje);
    } finally {
      try {
        await client.query("SELECT pg_advisory_unlock($1, $2)", [CLASSE_TRAVA, userId]);
      } catch {
        descartarConexao = true; // não conseguimos soltar a trava: melhor fechar a conexão
      }
    }
  } finally {
    client.release(descartarConexao);
  }
}

async function gerarComTrava(client, userId, pedido, disciplina, hoje) {
  const uso = await resumoDeUso(userId, hoje);
  if (uso.hoje.usados >= LIMITE_PLANOS_POR_DIA) {
    throw new ErroPedido(
      429,
      `Você já usou os ${LIMITE_PLANOS_POR_DIA} planos de hoje. Tente de novo amanhã.`,
      { limite: LIMITE_PLANOS_POR_DIA, usados: uso.hoje.usados }
    );
  }

  const contexto = await montarContexto(userId, pedido, disciplina, hoje);
  const idsAtividades = new Set([...contexto.atividades, ...contexto.concluidas].map((a) => a.id));
  const configuracao = configuracaoIA();

  // Chama a IA. Se a resposta vier inválida, uma nova tentativa, avisando o motivo.
  let tokensEntrada = 0;
  let tokensSaida = 0;
  let estimado = false;
  let tentativas = 0;
  let plano = null;
  let ajustes = [];
  let ultimoErro = null;
  let motivoAnterior = null;

  for (let n = 1; n <= TENTATIVAS_COM_A_IA && !plano; n++) {
    tentativas = n;
    const pedidoTexto =
      montarPedidoUsuario(contexto) +
      (motivoAnterior
        ? `\n\nATENÇÃO: sua resposta anterior foi rejeitada (${motivoAnterior}). Responda de novo apenas com o JSON correto, mais enxuto se preciso.`
        : "");
    try {
      const resposta = await gerarJson({ sistema: INSTRUCAO_SISTEMA, usuario: pedidoTexto });
      tokensEntrada += resposta.tokensEntrada;
      tokensSaida += resposta.tokensSaida;
      estimado ||= resposta.estimado;
      const lido = lerPlanoDaIA(resposta.texto, { dias: contexto.dias, minutosPorDia: pedido.minutosPorDia, idsAtividades });
      if (lido.ok) {
        plano = lido.plano;
        ajustes = lido.ajustes;
      } else {
        motivoAnterior = lido.motivo;
        ultimoErro = new ErroIA("formato", lido.motivo);
      }
    } catch (e) {
      if (!(e instanceof ErroIA)) throw e;
      if (e.uso) {
        tokensEntrada += e.uso.tokensEntrada;
        tokensSaida += e.uso.tokensSaida;
        estimado ||= e.uso.estimado;
      }
      ultimoErro = e;
      if (e.codigo === "cortada" || e.codigo === "vazia") {
        motivoAnterior = e.codigo === "cortada" ? "a resposta foi cortada por ficar longa demais" : "a resposta veio vazia";
        continue; // vale uma nova tentativa
      }
      break; // chave errada, limite do provedor, bloqueio...: repetir não adianta
    }
  }

  const custo = calcularCustoUSD(tokensEntrada, tokensSaida, configuracao);

  // A IA gastou tokens mas não deu um plano: o gasto fica registrado (sem plano)
  // e conta no limite do dia. Se nem chegou a responder, não houve custo.
  if (!plano) {
    if (tokensEntrada + tokensSaida > 0) {
      await client.query(
        `INSERT INTO historico_tokens_ia
           (data_requi, tokens_entrada, tokens_saida, custo_total, fk_plano_estudos_id_plano, fk_usuario_id_usuario)
         VALUES ((NOW() AT TIME ZONE 'UTC'), $1, $2, $3, NULL, $4)`,
        [tokensEntrada, tokensSaida, custo, userId]
      );
    }
    throw traduzirErroIA(ultimoErro ?? new ErroIA("formato", "sem plano"));
  }

  const usadas = new Set(plano.dias.flatMap((d) => d.blocos.map((b) => b.atividade_id)).filter(Boolean));
  const conteudo = JSON.stringify({
    versao: 1,
    modelo: configuracao.modelo,
    parametros: {
      data_inicio: hoje,
      data_alvo: pedido.dataAlvo,
      horas_por_dia: pedido.horasPorDia,
      conteudos: pedido.conteudos,
    },
    plano,
    ajustes,
    atividades: [...contexto.atividades, ...contexto.concluidas]
      .filter((a) => usadas.has(a.id))
      .map((a) => ({ id: a.id, titulo: a.titulo, tipo: a.tipo, vencimento: a.vencimento })),
    tentativas,
    tokens_estimados: estimado,
  });

  let planoId;
  try {
    await client.query("BEGIN");
    const inserido = await client.query(
      `INSERT INTO plano_estudos (data, conteudo, fk_disciplina_id_disciplina, fk_usuario_id_usuario)
       VALUES ($1::date, $2, $3, $4)
       RETURNING id_plano`,
      [hoje, conteudo, pedido.disciplinaId, userId]
    );
    planoId = inserido.rows[0].id_plano;
    await client.query(
      `INSERT INTO historico_tokens_ia
         (data_requi, tokens_entrada, tokens_saida, custo_total, fk_plano_estudos_id_plano, fk_usuario_id_usuario)
       VALUES ((NOW() AT TIME ZONE 'UTC'), $1, $2, $3, $4, $5)`,
      [tokensEntrada, tokensSaida, custo, planoId, userId]
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    // A IA já cobrou: deixa o gasto visível no log do servidor para não se perder.
    console.error("Plano não gravado, mas a IA consumiu tokens:", { userId, tokensEntrada, tokensSaida, custo });
    throw e;
  }

  return {
    plano: await buscarPlano(planoId, userId),
    uso: await resumoDeUso(userId, hoje),
  };
}

// ---------------------------------------------------------------------
// 6) Ler e apagar planos
// ---------------------------------------------------------------------
function lerConteudo(texto) {
  try {
    const o = JSON.parse(texto);
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
}

const SQL_PLANO_COLUNAS = `
  p.id_plano AS id,
  to_char(p.data, 'YYYY-MM-DD') AS criado_em,
  p.conteudo,
  d.id_disciplina AS disciplina_id,
  d.nome AS disciplina_nome,
  d.cor AS disciplina_cor,
  COALESCE(SUM(h.tokens_entrada), 0)::float8 AS tokens_entrada,
  COALESCE(SUM(h.tokens_saida), 0)::float8 AS tokens_saida,
  COALESCE(SUM(h.custo_total), 0)::float8 AS custo`;

const SQL_PLANO_DE_ONDE = `
  FROM plano_estudos p
  JOIN disciplina d ON d.id_disciplina = p.fk_disciplina_id_disciplina
  LEFT JOIN historico_tokens_ia h ON h.fk_plano_estudos_id_plano = p.id_plano`;

function montarItem(linha) {
  const { conteudo, ...resto } = linha;
  const c = lerConteudo(conteudo);
  return {
    ...resto,
    data_alvo: c?.parametros?.data_alvo ?? null,
    horas_por_dia: c?.parametros?.horas_por_dia ?? null,
    resumo: c?.plano?.resumo ?? null,
  };
}

export async function listarPlanos(userId) {
  const r = await query(
    `SELECT ${SQL_PLANO_COLUNAS}
       ${SQL_PLANO_DE_ONDE}
      WHERE p.fk_usuario_id_usuario = $1
      GROUP BY p.id_plano, d.id_disciplina
      ORDER BY p.id_plano DESC
      LIMIT 30`,
    [userId]
  );
  return r.rows.map(montarItem);
}

// Um plano completo, só se for do aluno (senão null).
export async function buscarPlano(planoId, userId) {
  const r = await query(
    `SELECT ${SQL_PLANO_COLUNAS}
       ${SQL_PLANO_DE_ONDE}
      WHERE p.id_plano = $1 AND p.fk_usuario_id_usuario = $2
      GROUP BY p.id_plano, d.id_disciplina`,
    [planoId, userId]
  );
  if (r.rows.length === 0) return null;
  const c = lerConteudo(r.rows[0].conteudo);
  return {
    ...montarItem(r.rows[0]),
    modelo: c?.modelo ?? null,
    parametros: c?.parametros ?? null,
    plano: c?.plano ?? null,
    atividades: c?.atividades ?? [],
    ajustes: c?.ajustes ?? [],
  };
}

export async function apagarPlano(planoId, userId) {
  const r = await query(
    `DELETE FROM plano_estudos WHERE id_plano = $1 AND fk_usuario_id_usuario = $2`,
    [planoId, userId]
  );
  return r.rowCount > 0;
}