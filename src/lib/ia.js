
//  API REST do Gemini direto com fetch (sem SDK): é uma chamada só, e
// assim não há dependência nova para instalar nem para atualizar.

const URL_BASE = "https://generativelanguage.googleapis.com/v1beta";


const PADRAO = {
  modelo: "gemini-3.1-flash-lite",
  precoEntrada: 0.25,
  precoSaida: 1.5,
};

const TEMPO_LIMITE_MS = 90_000;     // a IA pode levar uns segundos; mais que isso é problema
const MAX_TOKENS_SAIDA = 16384;     // teto de segurança (os "tokens de pensamento" também contam aqui)
const NIVEIS_PENSAMENTO = ["minimal", "low", "medium", "high"];

// Lê a configuração a cada uso (e não ao carregar o arquivo), assim uma mudança
// no .env.local vale assim que o servidor reiniciar.
export function configuracaoIA() {
  const numero = (texto, padrao) => {
    const n = Number(String(texto ?? "").replace(",", "."));
    return texto !== undefined && texto !== "" && Number.isFinite(n) && n >= 0 ? n : padrao;
  };
  const nivel = String(process.env.GEMINI_NIVEL_PENSAMENTO ?? "").trim().toLowerCase();
  return {
    chave: String(process.env.GEMINI_API_KEY ?? "").trim(),
    modelo: String(process.env.GEMINI_MODELO ?? "").trim().replace(/^models\//, "") || PADRAO.modelo,
    precoEntrada: numero(process.env.GEMINI_PRECO_ENTRADA, PADRAO.precoEntrada),
    precoSaida: numero(process.env.GEMINI_PRECO_SAIDA, PADRAO.precoSaida),
    nivelPensamento: NIVEIS_PENSAMENTO.includes(nivel) ? nivel : null,
  };
}

export function iaConfigurada() {
  return configuracaoIA().chave !== "";
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

// Pede à IA uma resposta em JSON. Devolve { texto, tokensEntrada, tokensSaida,
// estimado, modelo, custo }. O texto ainda NÃO foi validado: quem chama confere.
export async function gerarJson({ sistema, usuario }) {
  const config = configuracaoIA();
  if (!config.chave) throw new ErroIA("sem_chave", "GEMINI_API_KEY não configurada");

  const generationConfig = {
    responseMimeType: "application/json", // a resposta vem como JSON puro, sem cercas de código
    maxOutputTokens: MAX_TOKENS_SAIDA,
  };
  // Menos "pensamento" = resposta mais rápida e mais barata. Opcional.
  if (config.nivelPensamento) generationConfig.thinkingConfig = { thinkingLevel: config.nivelPensamento };

  let resposta;
  try {
    resposta = await fetch(`${URL_BASE}/models/${encodeURIComponent(config.modelo)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": config.chave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: "user", parts: [{ text: usuario }] }],
        generationConfig,
      }),
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
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
  const uso = lerUso(dados, sistema, usuario, texto);

  if (dados?.promptFeedback?.blockReason || candidato?.finishReason === "SAFETY") {
    throw new ErroIA("bloqueado", dados?.promptFeedback?.blockReason ?? "SAFETY", uso);
  }
  if (candidato?.finishReason === "MAX_TOKENS") {
    throw new ErroIA("cortada", "a resposta passou do limite de tokens", uso);
  }
  if (!texto.trim()) throw new ErroIA("vazia", "a IA devolveu uma resposta vazia", uso);

  return { texto, ...uso, modelo: config.modelo, custo: calcularCustoUSD(uso.tokensEntrada, uso.tokensSaida, config) };
}