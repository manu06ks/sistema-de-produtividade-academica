'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { diferencaDias } from '@/lib/calendario';
import { dataBR, formatarMinutos } from '@/lib/ranking';
import { formatarUSD } from '@/lib/planos-cliente';

function linhaDoPlano(p) {
  if (!p.data_alvo) return 'Plano sem detalhes';
  const dias = diferencaDias(p.criado_em, p.data_alvo) + 1;
  const horas = p.horas_por_dia ? ` · ${formatarMinutos(Math.round(p.horas_por_dia * 60))} por dia` : '';
  return `Até ${dataBR(p.data_alvo)} · ${dias} ${dias === 1 ? 'dia' : 'dias'}${horas}`;
}

// Os planos que você já gerou. Clicar abre o plano; a lixeira apaga (com confirmação).
export default function ListaPlanos({ planos, abertoId, onAbrir, onApagar }) {
  const [confirmando, setConfirmando] = useState(null); // id do plano esperando confirmação
  const [apagando, setApagando] = useState(null);
  const [erros, setErros] = useState({}); // { [id]: mensagem }

  async function apagar(id) {
    setApagando(id);
    setErros((e) => ({ ...e, [id]: '' }));
    try {
      await onApagar(id);
      setConfirmando(null);
    } catch (e) {
      setErros((antes) => ({ ...antes, [id]: e.message || 'Não foi possível apagar o plano.' }));
    } finally {
      setApagando(null);
    }
  }

  return (
    <section aria-labelledby="lista-titulo">
      <h2 id="lista-titulo" className="mb-3 text-lg font-bold text-foreground">
        Seus planos
      </h2>

      {planos.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          Nenhum plano ainda. Preencha o formulário acima para gerar o primeiro.
        </p>
      ) : (
        <ul className="space-y-3">
          {planos.map((p) => {
            const aberto = abertoId === p.id;
            const nome = `${p.disciplina_nome}, criado em ${dataBR(p.criado_em)}`;
            return (
              <li
                key={p.id}
                data-plano={p.id}
                className={`overflow-hidden rounded-2xl border bg-card shadow-sm ${
                  aberto ? 'border-primary/50' : 'border-border/50'
                }`}
              >
                <div className="flex items-start">
                  <button
                    type="button"
                    onClick={() => onAbrir(p.id)}
                    aria-current={aberto ? 'true' : undefined}
                    className="min-w-0 flex-1 p-4 text-left transition-colors hover:bg-secondary/40"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: p.disciplina_cor }}
                      />
                      <span className="truncate text-sm font-bold text-foreground">{p.disciplina_nome}</span>
                    </span>
                    <span className="mt-1 block text-xs font-medium text-muted-foreground">{linhaDoPlano(p)}</span>
                    {p.resumo && (
                      <span className="mt-2 line-clamp-2 block break-words text-sm text-foreground/80">{p.resumo}</span>
                    )}
                    <span className="mt-2 block text-[11px] text-muted-foreground">
                      Criado em {dataBR(p.criado_em)} · {formatarUSD(p.custo)}
                    </span>
                  </button>

                  {confirmando !== p.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setErros((e) => ({ ...e, [p.id]: '' }));
                        setConfirmando(p.id);
                      }}
                      aria-label={`Apagar o plano de ${nome}`}
                      className="m-2 shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {confirmando === p.id && (
                  <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 border-t border-border/40 bg-secondary/30 px-4 py-2">
                    <span className="text-xs font-semibold text-foreground">Apagar este plano?</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => apagar(p.id)}
                        disabled={apagando === p.id}
                        className="rounded-lg bg-destructive px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-60"
                      >
                        {apagando === p.id ? 'Apagando...' : 'Sim, apagar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmando(null)}
                        disabled={apagando === p.id}
                        className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {erros[p.id] && (
                  <p role="alert" className="border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive">
                    {erros[p.id]}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}