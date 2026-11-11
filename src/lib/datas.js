const MESES_CURTOS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DIA_MS = 86400000;

function dois(n) {
  return String(n).padStart(2, '0');
}

function partes(data) {
  const [ano, mes, dia] = data.split('-').map(Number);
  return { ano, mes, dia };
}

function paraUTC(data) {
  const { ano, mes, dia } = partes(data);
  return Date.UTC(ano, mes - 1, dia);
}

function deUTC(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${dois(d.getUTCMonth() + 1)}-${dois(d.getUTCDate())}`;
}

// Data de hoje no fuso do navegador, como "AAAA-MM-DD".
// Só deve ser chamada depois que a página carregou (em eventos ou callbacks),
// nunca durante a renderização.
export function hojeLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

// Quantos dias faltam de "base" até "data" (negativo = já passou).
export function diasAte(data, base) {
  return Math.round((paraUTC(data) - paraUTC(base)) / DIA_MS);
}

// "2026-11-20" -> "20 nov"
export function formatarDiaMes(data) {
  const { mes, dia } = partes(data);
  return `${dois(dia)} ${MESES_CURTOS[mes - 1]}`;
}

export function numeroDoDia(data) {
  return partes(data).dia;
}

export function somarDias(data, n) {
  return deUTC(paraUTC(data) + n * DIA_MS);
}

// 0 = domingo ... 6 = sábado
export function diaDaSemana(data) {
  return new Date(paraUTC(data)).getUTCDay();
}

export function inicioDaSemana(data) {
  return somarDias(data, -diaDaSemana(data));
}

export function primeiroDoMes(data) {
  const { ano, mes } = partes(data);
  return `${ano}-${dois(mes)}-01`;
}

// Primeiro dia do mês que fica n meses depois (ou antes, se n for negativo).
export function somarMeses(data, n) {
  const { ano, mes } = partes(data);
  const total = ano * 12 + (mes - 1) + n;
  return `${Math.floor(total / 12)}-${dois((total % 12) + 1)}-01`;
}

export function diasNoMes(data) {
  const { ano, mes } = partes(data);
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

// "Novembro 2026"
export function nomeDoMes(data) {
  const { ano, mes } = partes(data);
  return `${MESES[mes - 1]} ${ano}`;
}

// "Semana de 8/11"
export function rotuloSemana(data) {
  const { mes, dia } = partes(inicioDaSemana(data));
  return `Semana de ${dia}/${mes}`;
}