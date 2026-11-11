import { CalendarClock } from 'lucide-react';
import { DIAS_SEMANA, FAIXAS_DO_DIA, formatarCompacto } from '@/lib/calendario';
import { formatarMinutos } from '@/lib/ranking';

// Quadro "dia da semana x parte do dia": quanto mais forte a cor, mais minutos.
// Mostra os últimos 90 dias, qualquer que seja o período escolhido no topo.
export default function MapaHorarios({ padroes }) {
  const { matriz, total_minutos: total, melhor_dia_semana: melhorDia, melhor_faixa: melhorFaixa } = padroes;
  const maior = Math.max(0, ...matriz.flat());

  return (
    <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-foreground">
        <CalendarClock className="h-5 w-5 text-primary" /> Quando você mais estuda
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Últimos {padroes.dias_considerados} dias, pelo horário em que cada sessão começou.
      </p>

      {total === 0 ? (
        <p className="rounded-xl bg-secondary/50 p-3 text-center text-sm text-muted-foreground">
          Ainda não há estudo registrado nos últimos {padroes.dias_considerados} dias.
        </p>
      ) : (
        <>
          <p className="mb-4 rounded-xl bg-primary/5 p-3 text-sm text-foreground">
            Você estuda mais <strong>{DIAS_SEMANA[melhorDia].quando}</strong>, principalmente{' '}
            <strong>{FAIXAS_DO_DIA[melhorFaixa].quando}</strong> ({FAIXAS_DO_DIA[melhorFaixa].horas}).
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-center">
              <caption className="sr-only">Minutos estudados por dia da semana e parte do dia</caption>
              <thead>
                <tr>
                  <td />
                  {FAIXAS_DO_DIA.map((f) => (
                    <th key={f.nome} scope="col" className="px-0.5 pb-1 text-[10px] font-semibold text-muted-foreground sm:px-1 sm:text-[11px]">
                      {f.nome}
                      <span className="block text-[10px] font-normal">{f.horas}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIAS_SEMANA.map((dia, d) => (
                  <tr key={dia.curto}>
                    <th scope="row" className="pr-2 text-right text-xs font-semibold text-muted-foreground">
                      {dia.curto}
                    </th>
                    {FAIXAS_DO_DIA.map((faixa, f) => {
                      const minutos = matriz[d][f];
                      const forca = maior > 0 ? minutos / maior : 0;
                      return (
                        <td key={faixa.nome} className="p-0">
                          <div
                            data-celula={`${d}-${f}`}
                            title={`${dia.longo}, ${faixa.nome.toLowerCase()}: ${formatarMinutos(minutos)}`}
                            className="relative flex h-10 items-center justify-center overflow-hidden rounded-lg bg-secondary/40 text-[11px] font-semibold"
                          >
                            {minutos > 0 && (
                              <span
                                aria-hidden="true"
                                className="absolute inset-0 rounded-lg bg-primary"
                                style={{ opacity: 0.15 + 0.85 * forca }}
                              />
                            )}
                            <span className={`relative ${forca > 0.5 ? 'text-primary-foreground' : 'text-foreground'}`}>
                              {minutos > 0 ? formatarCompacto(minutos) : <span className="sr-only">sem estudo</span>}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}