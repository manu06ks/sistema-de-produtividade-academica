'use client';

import { BookOpen, User, Plus, GraduationCap } from 'lucide-react';

export default function SubjectList({ disciplinas, onNova, onEntrar, onSelecionar }) {
  return (
    <div className="flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <GraduationCap className="h-4 w-4 text-primary" /> Minhas Disciplinas
        </h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEntrar}
            className="flex items-center gap-1 whitespace-nowrap rounded-xl border border-border/60 bg-secondary px-3 py-1.5 text-[11px] font-bold text-secondary-foreground transition-all hover:bg-accent active:scale-95"
          >
            Entrar com Código
          </button>
          <button
            type="button"
            onClick={onNova}
            className="flex items-center gap-1 whitespace-nowrap rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-95"
          >
            <Plus className="h-3 w-3" /> Criar
          </button>
        </div>
      </div>

      <div className="flex w-full gap-3 overflow-x-auto pb-3">
        {disciplinas === null ? (
          <p className="w-full py-4 text-center text-xs italic text-muted-foreground">
            Carregando disciplinas...
          </p>
        ) : disciplinas.length === 0 ? (
          <div className="w-full rounded-xl border border-dashed border-border/60 py-4 text-center">
            <p className="text-xs italic text-muted-foreground">
              Nenhuma disciplina cadastrada ou vinculada.
            </p>
          </div>
        ) : (
          disciplinas.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelecionar?.(d)}
              className="group relative flex w-[150px] min-w-[150px] shrink-0 cursor-pointer flex-col items-start overflow-hidden rounded-xl border border-border/40 bg-background p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className="absolute left-0 right-0 top-0 h-1"
                style={{ backgroundColor: d.cor }}
              />

              <span className="mb-1.5 flex w-full items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: d.cor }} />
                <strong className="w-full truncate pr-1 text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                  {d.nome}
                </strong>
              </span>

              <span className="flex w-full items-center gap-1 truncate text-[10px] text-muted-foreground">
                <User className="h-3 w-3 shrink-0" /> {d.professor || 'Não informado'}
              </span>
              <span className="mt-1 text-[10px] font-semibold text-muted-foreground/80">
                {d.semestre_letivo}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}