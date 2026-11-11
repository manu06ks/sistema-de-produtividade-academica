import { BookOpen } from 'lucide-react';
import { formatarMinutos } from '@/lib/ranking';

// Quanto tempo foi para cada disciplina no período, com a cor dela.
export default function BarrasDisciplinas({ disciplinas }) {
  const total = disciplinas.reduce((soma, d) => soma + d.minutos, 0);

  return (
    <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-foreground">
        <BookOpen className="h-5 w-5 text-primary" /> Por disciplina
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">Como o seu tempo se divide no período.</p>

      {disciplinas.length === 0 ? (
        <p className="rounded-xl bg-secondary/50 p-3 text-center text-sm text-muted-foreground">
          Nenhuma sessão salva neste período.
        </p>
      ) : (
        <ul className="max-h-72 space-y-4 overflow-y-auto pr-1">
          {disciplinas.map((d) => {
            const porcento = Math.round((d.minutos / total) * 100);
            const rotuloPorcento = porcento === 0 ? '<1%' : `${porcento}%`;
            return (
              <li key={d.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: d.cor }}
                    />
                    <span className="truncate">{d.nome}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <strong className="text-foreground">{formatarMinutos(d.minutos)}</strong> • {rotuloPorcento}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    data-disciplina={d.id}
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(porcento, 2)}%`, backgroundColor: d.cor }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}