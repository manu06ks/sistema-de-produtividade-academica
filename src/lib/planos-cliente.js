// Pequenas funções e constantes das telas de planos. Rodam no navegador: sem
// banco e sem Date() do relógio (a data de "hoje" vem sempre da API).
//
// MAX_DIAS_PLANO e MAX_CONTEUDOS repetem os valores de lib/planos.js (o servidor
// é quem manda; aqui só evitamos uma ida à API por causa de um erro óbvio).

import { formatarMinutos } from '@/lib/ranking';

export const MAX_DIAS_PLANO = 30;
export const MAX_CONTEUDOS = 2000;

// De meia em meia hora, de 0,5 a 12: [0.5, 1, 1.5, ... 12]
export const OPCOES_HORAS = Array.from({ length: 24 }, (_, i) => (i + 1) / 2);

// Atalhos para a data-alvo: quantos dias o plano tem, contando hoje.
export const ATALHOS_DATA = [
  { rotulo: '3 dias', dias: 3 },
  { rotulo: '1 semana', dias: 7 },
  { rotulo: '2 semanas', dias: 14 },
  { rotulo: '1 mês', dias: 30 },
];

export const ROTULOS_TIPO = {
  estudo: 'Estudo',
  revisao: 'Revisão',
  exercicios: 'Exercícios',
  simulado: 'Simulado',
  producao: 'Produção',
};

// "2026-11-11" + 6 -> "2026-11-17". O UTC é só para a conta do calendário.
export function somarDias(iso, n) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + n)).toISOString().slice(0, 10);
}

export function dataCompleta(texto) {
  return typeof texto === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(texto);
}

// 0.5 -> "30min", 2 -> "2h", 1.5 -> "1h 30min"
export function rotuloHoras(horas) {
  return formatarMinutos(Math.round(horas * 60));
}

// 12345 -> "12.345"
export function formatarNumero(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// 0.0123 -> "US$ 0,0123"; 1.5 -> "US$ 1,50"; 0 -> "US$ 0,00"
export function formatarUSD(valor) {
  const v = Number(valor) || 0;
  if (v > 0 && v < 0.0001) return '< US$ 0,0001';
  const casas = v >= 1 || v === 0 ? 2 : 4;
  return `US$ ${v.toFixed(casas).replace('.', ',')}`;
}

// "quarta-feira" -> "Quarta-feira"
export function capitalizar(texto) {
  return texto ? texto[0].toUpperCase() + texto.slice(1) : texto;
}