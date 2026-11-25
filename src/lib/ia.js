//  API REST do Gemini direto com fetch (sem SDK): é uma chamada só, e
// assim não há dependência nova para instalar nem para atualizar.
//
// Vários modelos em fila: se o primeiro estiver sobrecarregado (503), sem cota
// (429) ou indisponível para a chave (404), o app tenta o seguinte, até algum
// responder. A lista pode ser trocada por GEMINI_MODELOS (separados por vírgula).

const URL_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Do mais barato para o mais forte. Todos aceitam a mesma chave de API.
const MODELOS_PADRAO = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
];

// Preço em dólares por 1 milhão de tokens (estimativa para o histórico de custo;
// confira em https://ai.google.dev/pricing). Modelo fora da tabela usa
// GEMINI_PRECO_ENTRADA / GEMINI_PRECO_SAIDA.
const PRECOS = {
  "gemini-3.1-flash-lite": { entrada: 0.25, saida: 1.5 },
  "gemini-3.5-flash-lite": { entrada: 0.3, saida: 2.5 },
  "gemini-3.8-flash": { entrada: 0.75, saida: 3.75 }, // preço promocional até 31/12/2026
  "gemini-3.6-flash": { entrada: 0.75, saida: 3.75 }, // idem
};

const PADRAO = {
  precoEntrada: 0.25,
  precoSaida: 1.5,
};

const TEMPO_LIMITE_MS = 90_000;     // por chamada: a IA pode levar uns segundos; mais que isso é problema
const PRAZO_TOTAL_MS = 150_000;     // soma de todas as tentativas (o Azure corta a requisição em ~230 s)
const PASSADAS = 2;                 // quantas vezes percorre a lista de modelos
const ESPERA_ENTRE_PASSADAS_MS = 3000;
const PREFERENCIA_MS = 5 * 60_000;  // depois de um modelo de reserva responder, começa por ele por 5 min
const MAX_TOKENS_SAIDA = 16384;     // teto de segurança (os "tokens de pensamento" também contam aqui)
const NIVEIS_PENSAMENTO = ["minimal", "low", "medium", "high"];

const limparModelo = (texto) => String(texto ?? "").trim().replace(/^models\//, "");

// Lê a configuração a cada uso (e não ao carregar o arquivo), assim uma mudança
// no .env.local vale assim que o servidor reiniciar.
export function configuracaoIA() {
  const numero = (texto, padrao) => {
    const n = Number(String(texto ?? "").replace(",", "."));
    return texto !== undefined && texto !== "" && Number.isFinite(n) && n >= 0 ? n : padrao;
  };
  const nivel = String(process.env.GEMINI_NIVEL_PENSAMENTO ?? "").trim().toLowerCase();
  // GEMINI_MODELO (se existir) vai na frente; GEMINI_MODELOS substitui a lista padrão.
  const lista = String(process.env.GEMINI_MODELOS ?? "").split(",").map(limparModelo).filter(Boolean);
  const modelos = [...new Set([limparModelo(process.env.GEMINI_MODELO), ...(lista.length ? lista : MODELOS_PADRAO)].filter(Boolean))];
  return {
    chave: String(process.env.GEMINI_API_KEY ?? "").trim(),
    modelo: modelos[0],
    modelos,
    precoEntrada: numero(process.env.GEMINI_PRECO_ENTRADA, PADRAO.precoEntrada),
    precoSaida: numero(process.env.GEMINI_PRECO_SAIDA, PADRAO.precoSaida),
    nivelPensamento: NIVEIS_PENSAMENTO.includes(nivel) ? nivel : null,
  };
}

export function iaConfigurada() {
  return configuracaoIA().chave !== "";
}

// Preço do modelo (o da tabela, ou o configurado por variável de ambiente).
export function precosDoModelo(modelo, config = configuracaoIA()) {
  const p = PRECOS[modelo];
  return p
    ? { precoEntrada: p.entrada, precoSaida: p.saida }
    : { precoEntrada: config.precoEntrada, precoSaida: config.precoSaida };
}

// Custo em dólares, com 6 casas (é a precisão da coluna custo_total).
export function calcularCustoUSD(tokensEntrada, tokensSaida, config = configuracaoIA()) {
  const custo = (tokensEntrada * config.precoEntrada + tokensSaida * config.precoSaida) / 1_000_000;
  return Math.round(custo * 1_000_000) / 1_000_000;
}

// Erros da IA, com um código que o resto do app sabe traduzir para o aluno.
// "uso" traz os tokens gastos quando a IA chegou a responder (para o histórico).
export class ErroIA extends Error {
  constructor(codigo, detalhe, uso = null) {
    super(detalhe);
    this.codigo = codigo;
    this.uso = uso;
  }
}

function lerUso(dados, sistema, usuario, texto) {
  const u = dados?.usageMetadata;
  if (u && Number.isFinite(u.promptTokenCount)) {
    return {
      tokensEntrada: u.promptTokenCount,
      // os tokens de "pensamento" são cobrados como saída
      tokensSaida: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
      estimado: false,
    };
  }
  // A resposta veio sem contagem: estima (cerca de 4 caracteres por token) para
  // o histórico nunca ficar com zero em uma chamada que custou dinheiro.
  return {
    tokensEntrada: Math.ceil((sistema.length + usuario.length) / 4),
    tokensSaida: Math.ceil(texto.length / 4),
    estimado: true,
  };
}

function erroDeHttp(status, corpo) {
  const msg = corpo?.error?.message ?? "";
  if (status === 429) return new ErroIA("limite_provedor", msg || "429");
  if (status === 404) return new ErroIA("modelo_invalido", msg || "404");
  if (status === 401 || status === 403) return new ErroIA("chave_invalida", msg || String(status));
  if (status === 400 && /api key|api_key/i.test(msg)) return new ErroIA("chave_invalida", msg);
  if (status >= 500) return new ErroIA("indisponivel", msg || String(status));
  return new ErroIA("pedido_recusado", msg || String(status));
}

// O "nível de pensamento" é da família Gemini 3. Nos modelos 2.5 o campo é
// outro, então simplesmente não o enviamos.
const aceitaNivelPensamento = (modelo) => /^gemini-3/.test(modelo);
const modelosSemPensamento = new Set(); // modelos que recusaram o nível de pensamento

// Uma chamada a UM modelo. Devolve { texto, tokens..., modelo, custo } ou lança ErroIA.
async function chamarModelo(modelo, config, sistema, usuario, limiteMs, comPensamento) {
  const generationConfig = {
    responseMimeType: "application/json", // a resposta vem como JSON puro, sem cercas de código
    maxOutputTokens: MAX_TOKENS_SAIDA,
  };
  // Menos "pensamento" = resposta mais rápida e mais barata. Opcional.
  if (comPensamento && config.nivelPensamento && aceitaNivelPensamento(modelo)) {
    generationConfig.thinkingConfig = { thinkingLevel: config.nivelPensamento };
  }

  let resposta;
  try {
    resposta = await fetch(`${URL_BASE}/models/${encodeURIComponent(modelo)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": config.chave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: "user", parts: [{ text: usuario }] }],
        generationConfig,
      }),
      signal: AbortSignal.timeout(limiteMs),
    });
  } catch (e) {
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      throw new ErroIA("tempo_esgotado", "a IA não respondeu a tempo");
    }
    throw new ErroIA("indisponivel", String(e?.message ?? e));
  }

  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) throw erroDeHttp(resposta.status, dados);

  const candidato = dados?.candidates?.[0];
  const texto = (candidato?.content?.parts ?? [])
    .filter((p) => typeof p?.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("");
  const tokens = lerUso(dados, sistema, usuario, texto);
  const uso = { ...tokens, modelo, custo: calcularCustoUSD(tokens.tokensEntrada, tokens.tokensSaida, precosDoModelo(modelo, config)) };

  if (dados?.promptFeedback?.blockReason || candidato?.finishReason === "SAFETY") {
    throw new ErroIA("bloqueado", dados?.promptFeedback?.blockReason ?? "SAFETY", uso);
  }
  if (candidato?.finishReason === "MAX_TOKENS") {
    throw new ErroIA("cortada", "a resposta passou do limite de tokens", uso);
  }
  if (!texto.trim()) throw new ErroIA("vazia", "a IA devolveu uma resposta vazia", uso);

  return { texto, ...uso };
}

// Se o modelo recusar o nível de pensamento (erro 400), repete sem ele.
async function tentarModelo(modelo, config, sistema, usuario, limiteMs) {
  const comPensamento = !modelosSemPensamento.has(modelo);
  try {
    return await chamarModelo(modelo, config, sistema, usuario, limiteMs, comPensamento);
  } catch (e) {
    const pediuPensamento = comPensamento && config.nivelPensamento && aceitaNivelPensamento(modelo);
    if (!(e instanceof ErroIA) || e.codigo !== "pedido_recusado" || !pediuPensamento) throw e;
    console.warn(`[IA] ${modelo} recusou o nível de pensamento; repetindo sem ele:`, e.message);
    modelosSemPensamento.add(modelo);
    return chamarModelo(modelo, config, sistema, usuario, limiteMs, false);
  }
}

// Memória (por servidor) do último modelo de reserva que respondeu: evita
// bater de novo, a cada pedido, num modelo que acabou de falhar.
let preferido = { modelo: null, ate: 0 };

function ordenarModelos(modelos) {
  if (preferido.modelo && Date.now() < preferido.ate && modelos.includes(preferido.modelo)) {
    return [preferido.modelo, ...modelos.filter((m) => m !== preferido.modelo)];
  }
  return modelos;
}

function lembrarModelo(modelo, config) {
  if (modelo === config.modelos[0]) {
    preferido = { modelo: null, ate: 0 };
  } else {
    preferido = { modelo, ate: Date.now() + PREFERENCIA_MS };
    console.warn(`[IA] respondendo com o modelo de reserva ${modelo}`);
  }
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Pede à IA uma resposta em JSON. Devolve { texto, tokensEntrada, tokensSaida,
// estimado, modelo, custo }. O texto ainda NÃO foi validado: quem chama confere.
//
// Percorre a lista de modelos até um responder:
//  - 503, 429, erro de rede ou tempo esgotado: tenta o próximo (e, se nenhum
//    responder, percorre a lista mais uma vez, depois de uma pausa);
//  - 404 ou pedido recusado: esse modelo é pulado;
//  - chave inválida, resposta bloqueada/cortada/vazia: não adianta trocar de modelo.
export async function gerarJson({ sistema, usuario }) {
  const config = configuracaoIA();
  if (!config.chave) throw new ErroIA("sem_chave", "GEMINI_API_KEY não configurada");

  const inicio = Date.now();
  const restante = () => PRAZO_TOTAL_MS - (Date.now() - inicio);
  const falhas = []; // { modelo, codigo }
  const pulados = new Set();

  passadas: for (let passada = 1; passada <= PASSADAS; passada++) {
    let falhouPorMomento = false;
    for (const modelo of ordenarModelos(config.modelos)) {
      if (pulados.has(modelo)) continue;
      if (restante() < 5000) break passadas;
      try {
        const r = await tentarModelo(modelo, config, sistema, usuario, Math.min(TEMPO_LIMITE_MS, restante()));
        lembrarModelo(modelo, config);
        return r;
      } catch (e) {
        if (!(e instanceof ErroIA)) throw e;
        console.warn(`[IA] ${modelo}: ${e.codigo} - ${String(e.message).slice(0, 300)}`);
        if (e.codigo === "modelo_invalido" || e.codigo === "pedido_recusado") {
          pulados.add(modelo);
        } else if (e.codigo === "indisponivel" || e.codigo === "limite_provedor" || e.codigo === "tempo_esgotado") {
          falhouPorMomento = true;
        } else {
          throw e; // chave_invalida, bloqueado, cortada, vazia
        }
        falhas.push({ modelo, codigo: e.codigo });
      }
    }
    if (!falhouPorMomento || passada === PASSADAS || restante() < ESPERA_ENTRE_PASSADAS_MS + 5000) break;
    await esperar(ESPERA_ENTRE_PASSADAS_MS);
  }

  // Ninguém respondeu. O código do erro é o das falhas, se forem todas iguais.
  const resumo = falhas.map((f) => `${f.modelo}=${f.codigo}`).join(", ") || "sem tentativas";
  console.error(`[IA] nenhum modelo respondeu: ${resumo}`);
  const codigos = new Set(falhas.map((f) => f.codigo));
  const codigo = codigos.size === 0 ? "tempo_esgotado" : codigos.size === 1 ? [...codigos][0] : "indisponivel";
  throw new ErroIA(codigo, resumo);
}