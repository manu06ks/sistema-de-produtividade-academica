'use client';

import { useEffect, useRef } from 'react';
import { Lightbulb, X } from 'lucide-react';
import { DIAS_SEMANA, diaDaSemanaDe } from '@/lib/calendario';
import { dataBR, formatarMinutos } from '@/lib/ranking';
import { ROTULOS_TIPO, capitalizar, formatarNumero, formatarUSD } from '@/lib/planos-cliente';

function tituloDoDia(data) {
  return `${capitalizar(DIAS_SEMANA[diaDaSemanaDe(data)].longo)}, ${dataBR(data).slice(0, 5)}`;
}

// Um plano aberto: resumo, os dias com seus blocos, dicas e o custo da IA.
// "aberto" = { id, plano, carregando, erro } (vem do PlanosView).
export default function PlanoDetalhe({ aberto, hoje, onFechar }) {
  const secao = useRef(null);
  const { id, plano, carregando, erro } = aberto;

  // Ao abrir (ou trocar de plano), leva a tela até aqui e coloca o foco na seção,
  // para quem usa leitor de tela ouvir o plano.
  useEffect(() => {
    const el = secao.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView?.({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' });
  }, [id]);

  const dados = plano?.plano;
  const titulosDasAtividades = new Map((plano?.atividades ?? []).map((a) => [a.id, a.titulo]));

  return (
    <section
      ref={secao}
      tabIndex={-1}
      aria-labelledby="detalhe-titulo"
      className="scroll-mt-4 rounded-3xl border border-primary/30 bg-card p-6 shadow-sm focus:outline-none"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="detalhe-titulo" className="flex items-center gap-2 text-lg font-bold text-foreground">
            {plano && (
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: plano.disciplina_cor }}
              />
            )}
            <span className="min-w-0 break-words">{plano ? `Plano de ${plano.disciplina_nome}` : 'Plano de estudos'}</span>
          </h2>
          {plano && plano.data_alvo && (
            <p className="mt-1 text-xs text-muted-foreground">
              De {dataBR(plano.criado_em)} até {dataBR(plano.data_alvo)}
              {plano.horas_por_dia ? ` · até ${formatarMinutos(Math.round(plano.horas_por_dia * 60))} por dia` : ''}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar plano"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {carregando && <p className="py-8 text-center text-sm text-muted-foreground">Abrindo o plano...</p>}

      {erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {erro}
        </p>
      )}

      {dados && (
        <div className="space-y-5">
          <p className="break-words text-sm leading-relaxed text-foreground" data-resumo-plano>
            {dados.resumo}
          </p>

          {plano.ajustes.length > 0 && (
            <details className="rounded-xl bg-secondary/50 p-3 text-xs text-foreground">
              <summary className="cursor-pointer font-semibold">
                {plano.ajustes.length === 1
                  ? 'O app corrigiu 1 ponto do plano que a IA errou'
                  : `O app corrigiu ${plano.ajustes.length} pontos do plano que a IA errou`}
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {plano.ajustes.map((a, i) => (
                  <li key={i} className="break-words">
                    {a}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <ol className="space-y-3" aria-label="Dias do plano">
            {dados.dias.map((dia) => {
              const total = dia.blocos.reduce((s, b) => s + b.minutos, 0);
              const eHoje = dia.data === hoje;
              const passou = dia.data < hoje;
              return (
                <li
                  key={dia.data}
                  data-dia={dia.data}
                  className={`rounded-2xl border p-4 ${eHoje ? 'border-primary/60 bg-primary/5' : 'border-border/50'} ${
                    passou ? 'opacity-60' : ''
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-sm font-bold text-foreground">{tituloDoDia(dia.data)}</h3>
                    {eHoje && (
                      <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                        Hoje
                      </span>
                    )}
                    {passou && (
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        Já passou
                      </span>
                    )}
                    <span className="ml-auto text-xs font-semibold text-muted-foreground">
                      {total > 0 ? formatarMinutos(total) : 'Dia livre'}
                    </span>
                  </div>
                  {dia.foco && <p className="mb-2 break-words text-xs font-medium text-muted-foreground">{dia.foco}</p>}

                  {dia.blocos.length > 0 && (
                    <ul className="space-y-2">
                      {dia.blocos.map((b, i) => {
                        const atividade = b.atividade_id ? titulosDasAtividades.get(b.atividade_id) : null;
                        return (
                          <li key={i} className="flex gap-3 rounded-xl bg-secondary/40 p-3">
                            <p className="w-14 shrink-0 text-sm font-bold text-foreground">{formatarMinutos(b.minutos)}</p>
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-foreground">{b.titulo}</p>
                              {b.detalhes && <p className="mt-0.5 break-words text-xs text-muted-foreground">{b.detalhes}</p>}
                              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="rounded-md bg-secondary px-1.5 py-0.5 font-semibold text-secondary-foreground">
                                  {ROTULOS_TIPO[b.tipo] ?? 'Estudo'}
                                </span>
                                {atividade && (
                                  <span className="min-w-0 break-words text-muted-foreground">Atividade: {atividade}</span>
                                )}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>

          {dados.dicas.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                <Lightbulb className="h-4 w-4 text-primary" /> Dicas
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                {dados.dicas.map((d, i) => (
                  <li key={i} className="break-words">
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="border-t border-border/40 pt-3 text-[11px] text-muted-foreground" data-custo-plano>
            Gerado por {plano.modelo ?? 'IA'} · {formatarNumero(plano.tokens_entrada)} tokens de entrada ·{' '}
            {formatarNumero(plano.tokens_saida)} de saída · {formatarUSD(plano.custo)}
          </p>
        </div>
      )}
    </section>
  );
}