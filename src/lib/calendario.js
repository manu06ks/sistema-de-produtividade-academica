// Nomes e pequenas contas de calendário e de tempo usadas nas telas. Sem banco: roda no navegador.

export const DIAS_SEMANA = [
  { curto: 'Dom', longo: 'domingo', quando: 'aos domingos' },
  { curto: 'Seg', longo: 'segunda-feira', quando: 'às segundas-feiras' },
  { curto: 'Ter', longo: 'terça-feira', quando: 'às terças-feiras' },
  { curto: 'Qua', longo: 'quarta-feira', quando: 'às quartas-feiras' },
  { curto: 'Qui', longo: 'quinta-feira', quando: 'às quintas-feiras' },
  { curto: 'Sex', longo: 'sexta-feira', quando: 'às sextas-feiras' },
  { curto: 'Sáb', longo: 'sábado', quando: 'aos sábados' },
];

// As quatro faixas do dia, na mesma ordem em que a API devolve os números.
export const FAIXAS_DO_DIA = [
  { nome: 'Madrugada', horas: '0h às 6h', quando: 'de madrugada' },
  { nome: 'Manhã', horas: '6h às 12h', quando: 'de manhã' },
  { nome: 'Tarde', horas: '12h às 18h', quando: 'à tarde' },
  { nome: 'Noite', horas: '18h às 24h', quando: 'à noite' },
];

// "2026-11-11" -> 3 (quarta-feira). O UTC é usado só para fazer a conta do
// calendário; não existe conversão de fuso aqui.
export function diaDaSemanaDe(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

// "2026-11-09" -> 9
export function diaDoMes(iso) {
  return Number(iso.slice(8, 10));
}

// Quantos dias separam duas datas "AAAA-MM-DD" (positivo se a segunda é depois da primeira).
export function diferencaDias(de, ate) {
  const emMs = (iso) => {
    const [ano, mes, dia] = iso.split('-').map(Number);
    return Date.UTC(ano, mes - 1, dia);
  };
  return Math.round((emMs(ate) - emMs(de)) / 86400000);
}

// Versão curta para caber em quadradinhos: 45 -> "45min", 90 -> "1h30", 120 -> "2h".
export function formatarCompacto(minutos) {
  const total = Math.max(0, Math.floor(Number(minutos) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}