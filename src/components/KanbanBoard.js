'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Pencil,
  Circle,
  Clock,
  CheckCircle2,
  GripVertical,
  CalendarClock,
  Inbox,
  FileText,
  Users,
} from 'lucide-react';
import { diasAte, formatarDiaMes } from '@/lib/datas';

const COLUNAS = [
  { status: 'A Fazer', Icone: Circle, ponto: 'bg-muted-foreground', destaque: 'text-muted-foreground' },
  { status: 'Fazendo', Icone: Clock, ponto: 'bg-primary', destaque: 'text-primary' },
  { status: 'Concluído', Icone: CheckCircle2, ponto: 'bg-emerald-500', destaque: 'text-emerald-600' },
];

const coresPrazo = {
  atrasado: 'border border-destructive bg-destructive/10',
  urgente: 'border border-orange-500 bg-orange-500/10',
  normal: 'border border-border/50 bg-card',
  concluido: 'border border-border bg-secondary/50 opacity-60',
};

function situacaoPrazo(atividade, hoje) {
  if (atividade.status === 'Concluído') return 'concluido';
  if (!atividade.data_vencimento || !hoje) return 'normal';
  const dias = diasAte(atividade.data_vencimento, hoje);
  if (dias < 0) return 'atrasado';
  if (dias <= 2) return 'urgente';
  return 'normal';
}

export default function KanbanBoard({ atividades, hoje, onMudarStatus, onEditar }) {
  const [arrastandoId, setArrastandoId] = useState(null);
  const [colunaAlvo, setColunaAlvo] = useState(null);

  const carregando = atividades === null;
  const lista = atividades ?? [];

  function iniciarArraste(e, id) {
    e.dataTransfer.setData('text/plain', String(id));
    e.dataTransfer.effectAllowed = 'move';
    setArrastandoId(id);
  }

  function terminarArraste() {
    setArrastandoId(null);
    setColunaAlvo(null);
  }

  function sairDaColuna(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setColunaAlvo(null);
  }

  function soltar(e, status) {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData('text/plain'));
    setArrastandoId(null);
    setColunaAlvo(null);

    const atividade = lista.find((a) => a.id === id);
    if (atividade && atividade.status !== status) onMudarStatus(id, status);
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
      {COLUNAS.map(({ status, Icone, ponto, destaque }) => {
        const itens = lista.filter((a) => a.status === status);
        const alvoAtivo = colunaAlvo === status && arrastandoId !== null;

        return (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setColunaAlvo(status)}
            onDragLeave={sairDaColuna}
            onDrop={(e) => soltar(e, status)}
            className={`flex min-h-[280px] flex-col rounded-3xl p-3 transition-all duration-200 ${
              alvoAtivo
                ? 'border-2 border-dashed border-primary/50 bg-primary/5 ring-4 ring-primary/5'
                : 'border border-border/50 bg-secondary/40'
            }`}
          >
            <div className="mb-4 flex items-center justify-between px-2 pt-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${ponto}`} />
                <Icone className={`h-4 w-4 ${destaque}`} />
                <h4 className="text-sm font-bold text-foreground">{status}</h4>
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full border border-border/50 bg-card px-1.5 text-[11px] font-bold text-muted-foreground">
                  {itens.length}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 px-1">
              {itens.length === 0 && (
                <div
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 text-center transition-colors ${
                    alvoAtivo
                      ? 'border-primary/40 text-primary'
                      : 'border-border/60 text-muted-foreground/70'
                  }`}
                >
                  <Inbox className="h-6 w-6" />
                  <span className="text-[11px] font-semibold">
                    {alvoAtivo ? 'Solte aqui' : carregando ? 'Carregando...' : 'Nenhuma atividade'}
                  </span>
                </div>
              )}

              {itens.map((a) => {
                const prazo = situacaoPrazo(a, hoje);
                const concluida = a.status === 'Concluído';
                const entrega = a.data_vencimento ? formatarDiaMes(a.data_vencimento) : null;
                const corDisciplina = concluida ? undefined : a.disciplina_cor;

                return (
                  <div
                    key={a.id}
                    draggable
                    onDragStart={(e) => iniciarArraste(e, a.id)}
                    onDragEnd={terminarArraste}
                    className={`group relative cursor-grab overflow-hidden rounded-2xl p-3 pl-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing ${
                      arrastandoId === a.id ? 'rotate-1 scale-95 opacity-40' : ''
                    } ${coresPrazo[prazo]}`}
                  >
                    <span
                      className="absolute bottom-0 left-0 top-0 w-1.5"
                      style={{ backgroundColor: corDisciplina }}
                    />

                    <div className="mb-2 flex items-start justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: corDisciplina }}
                        />
                        <span
                          className={`truncate text-[10px] font-bold uppercase tracking-wide ${
                            concluida ? 'text-muted-foreground' : ''
                          }`}
                          style={{ color: corDisciplina }}
                        >
                          {a.disciplina_nome}
                        </span>
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditar(a)}
                          aria-label={`Abrir detalhes de ${a.titulo}`}
                          className="rounded-md border border-border/50 bg-card p-1 text-muted-foreground transition-all hover:bg-secondary hover:text-primary focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
                      </div>
                    </div>

                    <p
                      className={`text-pretty text-sm font-semibold leading-snug ${
                        concluida ? 'text-muted-foreground line-through' : 'text-foreground'
                      }`}
                    >
                      {a.titulo}
                    </p>

                    {!a.is_autor && (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Users className="h-3 w-3" /> de {a.autor_nome}
                      </p>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {a.tipo_atividade === 'Prova' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                          <AlertCircle className="h-2.5 w-2.5" /> PROVA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                          <FileText className="h-2.5 w-2.5" /> {a.tipo_atividade.toUpperCase()}
                        </span>
                      )}
                      {entrega && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                            prazo === 'atrasado'
                              ? 'bg-destructive/10 text-destructive'
                              : prazo === 'urgente'
                              ? 'bg-orange-500/10 text-orange-600'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          <CalendarClock className="h-2.5 w-2.5" /> {entrega}
                        </span>
                      )}
                      {a.prioridade === 'Alta' && !concluida && (
                        <span className="rounded-md border border-orange-500/40 px-1.5 py-0.5 text-[9px] font-bold text-orange-600">
                          ALTA
                        </span>
                      )}
                      {prazo === 'atrasado' && (
                        <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                          ATRASADO
                        </span>
                      )}
                      {prazo === 'urgente' && (
                        <span className="rounded-md bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-bold text-orange-600">
                          URGENTE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}