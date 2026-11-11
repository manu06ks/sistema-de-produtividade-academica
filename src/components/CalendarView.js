'use client';

import { AlertCircle } from 'lucide-react';
import {
  DIAS_SEMANA,
  somarDias,
  inicioDaSemana,
  primeiroDoMes,
  diasNoMes,
  diaDaSemana,
  numeroDoDia,
} from '@/lib/datas';
import { corLegivel } from '@/lib/cores';

function agruparPorDia(atividades) {
  const mapa = new Map();
  for (const a of atividades ?? []) {
    if (!a.data_vencimento) continue;
    if (!mapa.has(a.data_vencimento)) mapa.set(a.data_vencimento, []);
    mapa.get(a.data_vencimento).push(a);
  }
  return mapa;
}

function Semana({ referencia, hoje, porDia, onEditar }) {
  const inicio = inicioDaSemana(referencia);
  const dias = Array.from({ length: 7 }, (_, i) => somarDias(inicio, i));

  return (
    <div className="overflow-x-auto rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
      <div className="grid min-w-[700px] grid-cols-7 gap-2">
        {dias.map((dia, i) => {
          const ehHoje = dia === hoje;
          const itens = porDia.get(dia) ?? [];

          return (
            <div
              key={dia}
              className={`flex min-h-[250px] flex-col overflow-hidden rounded-2xl border ${
                ehHoje ? 'border-primary bg-primary/5' : 'border-border/50 bg-secondary/30'
              }`}
            >
              <div
                className={`border-b py-2 text-center ${
                  ehHoje
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/50'
                }`}
              >
                <div
                  className={`text-[10px] font-bold uppercase ${
                    ehHoje ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {DIAS_SEMANA[i]}
                </div>
                <div
                  className={`text-lg font-extrabold ${
                    ehHoje ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {numeroDoDia(dia)}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                {itens.map((a) => {
                  const concluida = a.status === 'Concluído';
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onEditar(a)}
                      className={`flex flex-col gap-1 rounded-lg border-l-2 p-2 text-left text-xs shadow-sm transition-opacity hover:opacity-80 ${
                        concluida ? 'bg-secondary/50 opacity-50' : 'bg-card'
                      }`}
                      style={{ borderLeftColor: concluida ? undefined : a.disciplina_cor }}
                    >
                      <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: a.disciplina_cor }}
                        />
                        <span className="truncate">{a.disciplina_nome}</span>
                      </span>
                      <span
                        className={`flex items-center gap-1 font-semibold leading-tight ${
                          concluida ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}
                      >
                        {a.tipo_atividade === 'Prova' && (
                          <AlertCircle className="h-3 w-3 shrink-0 text-destructive" />
                        )}
                        <span className="line-clamp-2">{a.titulo}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mes({ referencia, hoje, porDia, onEditar }) {
  const primeiro = primeiroDoMes(referencia);
  const total = diasNoMes(primeiro);
  const vazios = diaDaSemana(primeiro);
  const dias = Array.from({ length: total }, (_, i) => somarDias(primeiro, i));

  return (
    <div className="overflow-x-auto rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
      <div className="min-w-[700px]">
        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-muted-foreground">
          {DIAS_SEMANA.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: vazios }, (_, i) => (
            <div key={`vazio-${i}`} className="min-h-[90px] rounded-xl bg-secondary/30" />
          ))}

          {dias.map((dia) => {
            const ehHoje = dia === hoje;
            const itens = porDia.get(dia) ?? [];

            return (
              <div
                key={dia}
                className={`flex min-h-[90px] flex-col rounded-xl border p-1.5 shadow-sm transition-colors ${
                  ehHoje
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 bg-card hover:border-primary/30'
                }`}
              >
                <span
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                    ehHoje ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {numeroDoDia(dia)}
                </span>

                <div className="flex flex-col gap-1 overflow-y-auto">
                  {itens.map((a) => {
                    const concluida = a.status === 'Concluído';
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onEditar(a)}
                        title={`${a.disciplina_nome}: ${a.titulo}`}
                        className={`flex w-full items-center gap-1 rounded px-1.5 py-0.5 text-left text-[9px] font-bold transition-opacity hover:opacity-80 ${
                          concluida ? 'bg-secondary text-muted-foreground line-through' : ''
                        }`}
                        style={
                          concluida
                            ? undefined
                            : {
                                backgroundColor: a.disciplina_cor,
                                color: corLegivel(a.disciplina_cor),
                              }
                        }
                      >
                        {a.tipo_atividade === 'Prova' && (
                          <AlertCircle className="h-2.5 w-2.5 shrink-0" />
                        )}
                        <span className="truncate">{a.titulo}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CalendarView({ atividades, referencia, hoje, modo, onEditar }) {
  if (!referencia) {
    return (
      <div className="rounded-3xl border border-border/50 bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
        Carregando calendário...
      </div>
    );
  }

  const porDia = agruparPorDia(atividades);
  const Visao = modo === 'mes' ? Mes : Semana;

  return <Visao referencia={referencia} hoje={hoje} porDia={porDia} onEditar={onEditar} />;
}