// Regras do timer, sem React e sem relógio próprio: todas as funções recebem
// "agora" (milissegundos desde 1970, Date.now()) de fora. Assim nunca lemos o
// relógio durante a renderização e dá para testar tudo isoladamente.

const MAX_MS = 24 * 60 * 60 * 1000; // mesmo teto de 24 h da API
const MAX_PAUSA_MS = 60 * 60 * 1000; // pausa de no máximo 1 h

export const ESTADO_VAZIO = {
  sessaoId: null, // id da sessão aberta no servidor
  atividadeId: null,
  titulo: '',
  disciplinaNome: '',
  disciplinaCor: '#7c3aed',
  modo: 'foco', // 'foco' | 'pausa'
  acumuladoMs: 0, // tempo focado até a última pausa
  retomadoEm: null, // quando o foco voltou a correr (null = parado)
  pausaRestanteMs: 0, // quanto falta da pausa de descanso
  pausaFimEm: null, // quando a pausa acaba (null = parada)
};

// ---------- leitura do que está no localStorage (nunca confiar nele) ----------

const num = (v, min, max) => Number.isFinite(v) && v >= min && v <= max;
const inteiroPositivo = (v) => Number.isInteger(v) && v > 0;

export function lerEstadoSalvo(texto) {
  if (!texto) return null;
  let o;
  try {
    o = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!o || typeof o !== 'object') return null;
  if (!inteiroPositivo(o.sessaoId) || !inteiroPositivo(o.atividadeId)) return null;
  if (o.modo !== 'foco' && o.modo !== 'pausa') return null;
  if (!num(o.acumuladoMs, 0, MAX_MS)) return null;
  if (o.retomadoEm !== null && !num(o.retomadoEm, 0, Number.MAX_SAFE_INTEGER)) return null;
  if (!num(o.pausaRestanteMs, 0, MAX_PAUSA_MS)) return null;
  if (o.pausaFimEm !== null && !num(o.pausaFimEm, 0, Number.MAX_SAFE_INTEGER)) return null;

  return {
    sessaoId: o.sessaoId,
    atividadeId: o.atividadeId,
    titulo: typeof o.titulo === 'string' ? o.titulo.slice(0, 150) : '',
    disciplinaNome: typeof o.disciplinaNome === 'string' ? o.disciplinaNome.slice(0, 100) : '',
    disciplinaCor:
      typeof o.disciplinaCor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(o.disciplinaCor)
        ? o.disciplinaCor
        : ESTADO_VAZIO.disciplinaCor,
    modo: o.modo,
    acumuladoMs: o.acumuladoMs,
    retomadoEm: o.retomadoEm,
    pausaRestanteMs: o.pausaRestanteMs,
    pausaFimEm: o.pausaFimEm,
  };
}

// Ao reabrir a página o timer volta PARADO. O tempo em que a página ficou
// fechada não conta: só vale até o último instante em que ela foi vista viva.
export function congelarAoRestaurar(estado, vistoEm) {
  const e = { ...estado };
  const visto = Number.isFinite(vistoEm) ? vistoEm : null;

  if (e.retomadoEm != null) {
    const fim = visto != null && visto >= e.retomadoEm ? visto : e.retomadoEm;
    e.acumuladoMs = Math.min(MAX_MS, e.acumuladoMs + (fim - e.retomadoEm));
    e.retomadoEm = null;
  }
  if (e.pausaFimEm != null) {
    e.pausaRestanteMs =
      visto != null
        ? Math.min(e.pausaRestanteMs, Math.max(0, e.pausaFimEm - visto))
        : e.pausaRestanteMs;
    e.pausaFimEm = null;
  }
  if (e.modo === 'pausa' && e.pausaRestanteMs <= 0) {
    e.modo = 'foco';
    e.pausaRestanteMs = 0;
  }
  return e;
}

// ---------- leitura do tempo ----------

export function segundosFocados(estado, agora) {
  const correndo =
    estado.retomadoEm != null && agora != null ? Math.max(0, agora - estado.retomadoEm) : 0;
  return Math.floor(Math.min(MAX_MS, estado.acumuladoMs + correndo) / 1000);
}

export function segundosPausaRestante(estado, agora) {
  if (estado.pausaFimEm != null && agora != null) {
    return Math.ceil(Math.max(0, estado.pausaFimEm - agora) / 1000);
  }
  return Math.ceil(estado.pausaRestanteMs / 1000);
}

export function formatarTempo(totalSegundos) {
  const s = Math.max(0, Math.floor(totalSegundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  const dois = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dois(m)}:${dois(seg)}` : `${dois(m)}:${dois(seg)}`;
}

export const estaCorrendo = (e) => e.retomadoEm != null || e.pausaFimEm != null;

// ---------- transições (cada uma devolve um estado novo) ----------

export function novaSessao(dados, agora) {
  return {
    ...ESTADO_VAZIO,
    sessaoId: dados.sessaoId,
    atividadeId: dados.atividadeId,
    titulo: dados.titulo,
    disciplinaNome: dados.disciplinaNome,
    disciplinaCor: dados.disciplinaCor,
    retomadoEm: agora,
  };
}

export function pausarFoco(e, agora) {
  if (e.retomadoEm == null) return e;
  return {
    ...e,
    acumuladoMs: Math.min(MAX_MS, e.acumuladoMs + Math.max(0, agora - e.retomadoEm)),
    retomadoEm: null,
  };
}

export function retomarFoco(e, agora) {
  if (e.modo !== 'foco' || e.retomadoEm != null) return e;
  return { ...e, retomadoEm: agora };
}

export function iniciarPausa(e, minutos, agora) {
  const parado = pausarFoco(e, agora);
  const ms = minutos * 60 * 1000;
  return { ...parado, modo: 'pausa', pausaRestanteMs: ms, pausaFimEm: agora + ms };
}

export function pausarPausa(e, agora) {
  if (e.modo !== 'pausa' || e.pausaFimEm == null) return e;
  return { ...e, pausaRestanteMs: Math.max(0, e.pausaFimEm - agora), pausaFimEm: null };
}

export function retomarPausa(e, agora) {
  if (e.modo !== 'pausa' || e.pausaFimEm != null) return e;
  return { ...e, pausaFimEm: agora + e.pausaRestanteMs };
}

// Volta para o foco, parado. Vale para "Encerrar" e para o fim natural da pausa.
export function encerrarPausa(e) {
  return { ...e, modo: 'foco', pausaRestanteMs: 0, pausaFimEm: null };
}

export function pausaAcabou(e, agora) {
  return e.modo === 'pausa' && e.pausaFimEm != null && agora >= e.pausaFimEm;
}