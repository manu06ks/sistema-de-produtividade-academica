'use client';

import { useState } from 'react';
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Kanban,
  CalendarDays,
  LayoutGrid,
} from 'lucide-react';
import KanbanBoard from '@/components/KanbanBoard';
import CalendarView from '@/components/CalendarView';
import { somarDias, somarMeses, nomeDoMes, rotuloSemana } from '@/lib/datas';

const MODOS = [
  { id: 'kanban', rotulo: 'Kanban', Icone: Kanban },
  { id: 'semana', rotulo: 'Semana', Icone: CalendarDays },
  { id: 'mes', rotulo: 'Mês', Icone: LayoutGrid },
];

export default function Planejamento({
  atividades,
  hoje,
  onMudarStatus,
  onEditar,
  onLimpar,
}) {
  const [modo, setModo] = useState('kanban');
  const [escolhida, setEscolhida] = useState(null); // null = hoje
  const [confirmandoLimpar, setConfirmandoLimpar] = useState(false);
  const [limpando, setLimpando] = useState(false);

  const referencia = escolhida ?? hoje;
  const concluidas = (atividades ?? []).filter((a) => a.status === 'Concluído').length;

  function mover(direcao) {
    if (!referencia) return;
    setEscolhida(
      modo === 'mes'
        ? somarMeses(referencia, direcao)
        : somarDias(referencia, 7 * direcao)
    );
  }

  function escolherModo(id) {
    setModo(id);
    setConfirmandoLimpar(false);
  }

  async function limpar() {
    setLimpando(true);
    try {
      await onLimpar();
    } finally {
      setLimpando(false);
      setConfirmandoLimpar(false);
    }
  }

  const rotulo = !referencia
    ? ''
    : modo === 'mes'
    ? nomeDoMes(referencia)
    : rotuloSemana(referencia);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-sm font-bold text-primary">Planejamento</h3>

        {modo !== 'kanban' && (
          <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-2 py-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => mover(-1)}
              aria-label="Período anterior"
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="w-36 text-center text-xs font-bold text-foreground">{rotulo}</span>
            <button
              type="button"
              onClick={() => mover(1)}
              aria-label="Próximo período"
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="mx-1 h-4 w-px bg-border" />
            <button
              type="button"
              onClick={() => setEscolhida(null)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              <Calendar className="h-3.5 w-3.5" /> Hoje
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {modo === 'kanban' &&
            (confirmandoLimpar && concluidas > 0 ? (
              <div
                role="group"
                aria-label="Confirmar a limpeza do quadro"
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-1.5 text-xs shadow-sm"
              >
                <span className="font-semibold text-foreground">
                  Esconder {concluidas} {concluidas === 1 ? 'concluída' : 'concluídas'}?
                </span>
                <button
                  type="button"
                  onClick={limpar}
                  disabled={limpando}
                  className="rounded-lg bg-destructive/10 px-2.5 py-1 font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
                >
                  {limpando ? 'Limpando...' : 'Sim'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoLimpar(false)}
                  disabled={limpando}
                  className="rounded-lg bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-60"
                >
                  Não
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmandoLimpar(true)}
                disabled={concluidas === 0}
                title={
                  concluidas === 0
                    ? 'Nenhuma atividade concluída para limpar'
                    : 'Esconder todas as concluídas do quadro'
                }
                className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-2 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/50 disabled:hover:bg-card disabled:hover:text-muted-foreground"
              >
                <Archive className="h-4 w-4" />
                Limpar concluídas{concluidas > 0 && ` (${concluidas})`}
              </button>
            ))}

          <div className="flex gap-1 rounded-xl bg-secondary p-1">
            {MODOS.map(({ id, rotulo: nome, Icone }) => (
              <button
                key={id}
                type="button"
                onClick={() => escolherModo(id)}
                aria-pressed={modo === id}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                  modo === id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icone className="h-4 w-4" /> {nome}
              </button>
            ))}
          </div>
        </div>
      </div>

      {modo === 'kanban' ? (
        <KanbanBoard
          atividades={atividades}
          hoje={hoje}
          onMudarStatus={onMudarStatus}
          onEditar={onEditar}
        />
      ) : (
        <CalendarView
          atividades={atividades}
          referencia={referencia}
          hoje={hoje}
          modo={modo}
          onEditar={onEditar}
        />
      )}
    </div>
  );
}