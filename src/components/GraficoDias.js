import { BarChart3 } from 'lucide-react';
import { DIAS_SEMANA, diaDaSemanaDe, diaDoMes, diferencaDias } from '@/lib/calendario';
import { dataBR, formatarMinutos } from '@/lib/ranking';

const TITULOS = {
  diario: 'Últimos 7 dias',
  semanal: 'Tempo por dia da semana',
  mensal: 'Tempo por dia do mês',
};

// Barras com os minutos focados em cada dia. Não usa biblioteca: cada barra é
// uma div cuja altura é a proporção do maior dia.
export default function GraficoDias({ dias, periodo }) {
  const maior = Math.max(0, ...dias.map((d) => d.minutos));
  const poucosDias = dias.length <= 7; // até 7 barras cabe escrever o tempo em cima de cada uma
  const diaDeHoje = dias.find((d) => d.eh_hoje)?.data ?? null;

  return (
    <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm lg:col-span-2">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-foreground">
        <BarChart3 className="h-5 w-5 text-primary" /> {TITULOS[periodo]}
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Cada barra mostra o tempo focado no dia em que a sessão foi salva.
      </p>

      {maior === 0 && (
        <p className="mb-2 rounded-xl bg-secondary/50 p-3 text-center text-sm text-muted-foreground">
          Nenhum estudo registrado neste período. Inicie o timer em uma atividade para começar.
        </p>
      )}

      <div role="list" aria-label="Tempo estudado por dia" className="flex h-56 gap-1 pt-6 sm:gap-2">
        {dias.map((d, i) => {
          const dia = DIAS_SEMANA[diaDaSemanaDe(d.data)];
          const altura = d.minutos > 0 ? Math.max(4, Math.round((d.minutos / maior) * 100)) : 0;
          const descricao = `${dia.longo}, ${dataBR(d.data)}: ${
            d.futuro ? 'ainda não chegou' : formatarMinutos(d.minutos)
          }`;
          // No mês são 28 a 31 colunas: escreve só o dia 1, os múltiplos de 5 e o de hoje.
          // O vizinho de hoje fica sem número, senão dois números colam um no outro.
          const vizinhoDeHoje = diaDeHoje !== null && Math.abs(diferencaDias(diaDeHoje, d.data)) === 1;
          const mostrarNumero =
            poucosDias || d.eh_hoje || ((i === 0 || diaDoMes(d.data) % 5 === 0) && !vizinhoDeHoje);

          return (
            <div
              key={d.data}
              role="listitem"
              aria-label={descricao}
              title={descricao}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="flex min-h-0 w-full flex-1 items-end justify-center border-b border-border">
                <div
                  data-barra={d.data}
                  style={{ height: `${altura}%` }}
                  className={`relative w-full max-w-10 rounded-t-lg ${
                    d.eh_hoje ? 'bg-primary' : 'bg-primary/40'
                  }`}
                >
                  {poucosDias && d.minutos > 0 && (
                    <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-muted-foreground">
                      {formatarMinutos(d.minutos)}
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`mt-2 text-center leading-tight ${
                  d.eh_hoje
                    ? 'font-bold text-primary'
                    : d.futuro
                      ? 'text-muted-foreground/50'
                      : 'text-muted-foreground'
                }`}
              >
                {poucosDias && (
                  <span className="block text-[10px] font-semibold uppercase">{dia.curto}</span>
                )}
                <span className="block whitespace-nowrap text-[10px]">
                  {mostrarNumero ? diaDoMes(d.data) : '\u00a0'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}