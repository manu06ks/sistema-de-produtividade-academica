'use client';

import { formatarNumero } from './api';

// Gráficos feitos à mão em SVG/CSS (o projeto não usa biblioteca de gráficos).
const CORES = ['#2f6fdc', '#f06a2f', '#1fa971', '#e8a000', '#e66fa6', '#0a8f08', '#6552d6', '#e04545'];

function pontoNoCirculo(cx, cy, r, angulo) {
  return [cx + r * Math.cos(angulo), cy + r * Math.sin(angulo)];
}

// itens: [{ rotulo, valor }]. Pizza com legenda: nome, valor e percentual.
export function GraficoPizza({ itens, unidade = '', casas = 1 }) {
  const total = itens.reduce((s, i) => s + i.valor, 0);
  if (!(total > 0)) return <p className="text-sm text-muted-foreground">Sem dados para o gráfico.</p>;

  const cx = 100;
  const cy = 100;
  const r = 92;
  let inicio = -Math.PI / 2;
  const fatias = itens.map((item, i) => {
    const fracao = item.valor / total;
    const fim = inicio + fracao * 2 * Math.PI;
    const [x1, y1] = pontoNoCirculo(cx, cy, r, inicio);
    const [x2, y2] = pontoNoCirculo(cx, cy, r, fim);
    const grande = fracao > 0.5 ? 1 : 0;
    const caminho =
      fracao >= 0.9999
        ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
        : `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${grande} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    inicio = fim;
    return { ...item, caminho, cor: CORES[i % CORES.length], percentual: fracao * 100 };
  });

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
      <svg viewBox="0 0 200 200" role="img" aria-label="Gráfico de pizza" className="h-64 w-64 shrink-0">
        {fatias.map((f) => (
          <path key={f.rotulo} d={f.caminho} fill={f.cor} stroke="#ffffff" strokeWidth="1.5">
            <title>{`${f.rotulo}: ${formatarNumero(f.valor, casas, true)}${unidade} (${formatarNumero(f.percentual, 1, true)}%)`}</title>
          </path>
        ))}
      </svg>
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {fatias.map((f) => (
          <li key={f.rotulo} className="flex items-center gap-3 text-sm">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: f.cor }} />
            <span className="min-w-0 flex-1 break-words font-medium text-foreground">{f.rotulo}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatarNumero(f.valor, casas, true)}
              {unidade} · {formatarNumero(f.percentual, 1, true)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// grupos: [{ nome, itens: [{ rotulo, valor }] }]. Um bloco de barras horizontais por grupo.
export function GraficoBarrasGrupos({ grupos, unidade = '' }) {
  const maximo = Math.max(1, ...grupos.flatMap((g) => g.itens.map((i) => i.valor)));
  return (
    <div className="space-y-6">
      {grupos.map((g) => (
        <div key={g.nome}>
          <h4 className="mb-2 text-sm font-bold text-foreground">{g.nome}</h4>
          <ul className="space-y-1.5">
            {g.itens.map((item) => (
              <li key={item.rotulo} className="grid grid-cols-[8.5rem_1fr_3rem] items-center gap-3 text-xs sm:grid-cols-[11rem_1fr_3.5rem]">
                <span className="truncate text-right text-muted-foreground" title={item.rotulo}>
                  {item.rotulo}
                </span>
                <div className="h-4 rounded-sm bg-muted">
                  <div
                    className="h-4 rounded-sm"
                    style={{ width: `${(item.valor / maximo) * 100}%`, backgroundColor: CORES[0] }}
                    role="img"
                    aria-label={`${item.rotulo}: ${item.valor}${unidade}`}
                  />
                </div>
                <span className="tabular-nums font-semibold text-foreground">{item.valor}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Minutos estudados (soma das sessões encerradas)</p>
    </div>
  );
}

// itens: [{ rotulo, a, b, percentual }]. Barras duplas (aceitas x concluídas) com o percentual no topo.
export function GraficoBarrasDuplas({ itens, rotuloA, rotuloB }) {
  const maximo = Math.max(1, ...itens.map((i) => Math.max(i.a, i.b)));
  const ALTURA = 200;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ backgroundColor: CORES[0] }} />
          {rotuloA}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ backgroundColor: CORES[1] }} />
          {rotuloB}
        </span>
        <span>O número no topo é o percentual de conclusão.</span>
      </div>
      <div className="flex items-end gap-2 overflow-x-auto pb-2">
        {itens.map((item) => (
          <div key={item.rotulo} className="flex min-w-[4.5rem] flex-1 flex-col items-center">
            <span className="mb-1 text-xs font-bold tabular-nums text-foreground">
              {formatarNumero(item.percentual, 1, true)}%
            </span>
            <div className="flex items-end gap-1" style={{ height: ALTURA }}>
              {[
                [item.a, CORES[0]],
                [item.b, CORES[1]],
              ].map(([valor, cor], idx) => (
                <div key={idx} className="flex h-full flex-col items-center justify-end">
                  <span className="mb-0.5 text-[11px] tabular-nums text-muted-foreground">{valor}</span>
                  <div
                    className="w-6 rounded-t-md"
                    style={{ height: `${(valor / maximo) * (ALTURA - 20)}px`, backgroundColor: cor }}
                  />
                </div>
              ))}
            </div>
            <span className="mt-2 break-words text-center text-[11px] leading-tight text-muted-foreground">
              {item.rotulo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
