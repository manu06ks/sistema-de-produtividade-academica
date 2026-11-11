// Funções puras do ranking, sem React e sem banco: rodam no navegador.
// (Não importe aqui o lib/grupos.js: ele usa o banco e só funciona no servidor.)

export const PERIODOS_RANKING = [
  { valor: 'diario', rotulo: 'Hoje' },
  { valor: 'semanal', rotulo: 'Semana' },
  { valor: 'mensal', rotulo: 'Mês' },
];

// 0 -> "0min", 45 -> "45min", 60 -> "1h", 125 -> "2h 5min"
export function formatarMinutos(minutos) {
  const total = Math.max(0, Math.floor(Number(minutos) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Posição de cada linha, a partir da lista já ordenada por minutos (maior primeiro).
// Empate divide a posição ("1, 1, 3"). Quem tem 0 minutos fica sem posição (null).
export function calcularPosicoes(linhas) {
  let posicao = 0;
  let anterior = null;
  return linhas.map((linha, i) => {
    if (!(linha.total_minutos > 0)) return null;
    if (linha.total_minutos !== anterior) {
      posicao = i + 1;
      anterior = linha.total_minutos;
    }
    return posicao;
  });
}

// "2026-11-06" -> "06/11/2026" (sem usar Date, para não esbarrar em fuso horário)
export function dataBR(iso) {
  const partes = String(iso ?? '').split('-');
  if (partes.length !== 3) return '';
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}