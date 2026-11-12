'use client';

import { Gauge } from 'lucide-react';
import { formatarNumero, formatarUSD } from '@/lib/planos-cliente';

// Quanto da IA você já usou: o limite de hoje e o consumo do mês.
export default function UsoIA({ uso }) {
  const { usados, limite } = uso.hoje;
  const porcento = limite > 0 ? Math.min(100, Math.round((usados / limite) * 100)) : 100;
  const esgotado = usados >= limite;
  const mes = uso.mes;
  const tokens = mes.tokens_entrada + mes.tokens_saida;

  return (
    <section aria-labelledby="uso-titulo" className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
      <h2 id="uso-titulo" className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
        <Gauge className="h-5 w-5 text-primary" /> Uso da IA
      </h2>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Planos de hoje</p>
      <p className="mt-1 text-2xl font-bold text-foreground">
        {usados} de {limite}
      </p>
      <div
        role="progressbar"
        aria-label="Planos usados hoje"
        aria-valuemin={0}
        aria-valuemax={limite}
        aria-valuenow={Math.min(usados, limite)}
        aria-valuetext={`${usados} de ${limite} planos`}
        className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
      >
        <div
          data-uso-barra
          style={{ width: `${porcento}%` }}
          className={`h-full rounded-full ${esgotado ? 'bg-destructive' : 'bg-primary'}`}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {esgotado
          ? 'Você usou todos os planos de hoje. O contador zera à meia-noite (horário de Brasília).'
          : `Restam ${limite - usados} ${limite - usados === 1 ? 'plano' : 'planos'} hoje.`}
      </p>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Neste mês</p>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Pedidos à IA</dt>
          <dd className="font-semibold text-foreground">{formatarNumero(mes.requisicoes)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Tokens</dt>
          <dd className="font-semibold text-foreground">{formatarNumero(tokens)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Custo estimado</dt>
          <dd className="font-semibold text-foreground">{formatarUSD(mes.custo)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Todo pedido que chega a usar a IA conta no limite, mesmo que o plano venha incompleto. Apagar um plano não
        devolve o limite nem o custo.
      </p>
    </section>
  );
}