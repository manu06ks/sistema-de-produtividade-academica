'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import { GraficoBarrasDuplas, GraficoBarrasGrupos, GraficoPizza } from './Graficos';
import { botaoPrimario, classeCartao, formatarNumero } from './api';

const COM_UMA_CASA = new Set(['horas_estudadas', 'percentual_concluido']);

const ABAS = [
  { id: 1, rotulo: 'Consulta 1', resumo: 'Tempo de estudo por disciplina' },
  { id: 2, rotulo: 'Consulta 2', resumo: 'Minutos por membro de cada grupo' },
  { id: 3, rotulo: 'Consulta 3', resumo: 'Conclusão das atividades' },
];

function Grafico({ resultado }) {
  const { grafico, linhas } = resultado;
  if (linhas.length === 0) {
    return <p className="text-sm text-muted-foreground">A consulta não devolveu linhas. Carregue os dados em Banco de dados.</p>;
  }
  if (grafico === 'pizza') {
    return (
      <GraficoPizza
        itens={linhas.map((l) => ({ rotulo: l.disciplina, valor: l.horas_estudadas }))}
        unidade=" h"
      />
    );
  }
  if (grafico === 'barras-grupos') {
    const grupos = [];
    for (const l of linhas) {
      let g = grupos.find((x) => x.nome === l.grupo);
      if (!g) grupos.push((g = { nome: l.grupo, itens: [] }));
      g.itens.push({ rotulo: l.membro, valor: l.minutos_estudados });
    }
    return <GraficoBarrasGrupos grupos={grupos} unidade=" min" />;
  }
  return (
    <GraficoBarrasDuplas
      itens={linhas.map((l) => ({
        rotulo: l.disciplina,
        a: l.atividades_aceitas,
        b: l.concluidas,
        percentual: l.percentual_concluido,
      }))}
      rotuloA="Atividades aceitas"
      rotuloB="Concluídas"
    />
  );
}

function Tabela({ resultado }) {
  const { colunas, linhas } = resultado;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {colunas.map((c) => (
              <th key={c} className="px-4 py-2.5 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-t border-border">
              {colunas.map((c) => (
                <td key={c} className="px-4 py-2 tabular-nums">
                  {typeof l[c] === 'number' ? formatarNumero(l[c], 1, COM_UMA_CASA.has(c)) : l[c]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PainelConsultas({ api }) {
  const [selecionada, setSelecionada] = useState(1);
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const executar = useCallback(
    async (id) => {
      setCarregando(true);
      setErro('');
      try {
        setResultado(await api(`/consultas/${id}`));
      } catch (e) {
        setResultado(null);
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    },
    [api]
  );

  useEffect(() => {
    executar(selecionada);
  }, [selecionada, executar]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Consultas do relatório</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada consulta é executada no banco e mostrada em tabela e em gráfico.
        </p>
      </div>

      <div role="tablist" aria-label="Consultas" className="flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={selecionada === a.id}
            onClick={() => setSelecionada(a.id)}
            className={`rounded-xl border px-4 py-2 text-left text-sm transition-colors ${
              selecionada === a.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground hover:bg-accent'
            }`}
          >
            <span className="block font-bold">{a.rotulo}</span>
            <span className="block text-xs opacity-80">{a.resumo}</span>
          </button>
        ))}
      </div>

      {erro && (
        <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {erro}
        </p>
      )}

      {carregando && !resultado && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Executando a consulta...
        </p>
      )}

      {resultado && (
        <div className="space-y-6">
          <section className={classeCartao}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-foreground">{resultado.titulo}</h3>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{resultado.descricao}</p>
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  Tabelas:
                  {resultado.tabelas.map((t) => (
                    <span key={t} className="rounded-md bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
                      {t}
                    </span>
                  ))}
                </p>
              </div>
              <button className={botaoPrimario} onClick={() => executar(selecionada)} disabled={carregando}>
                {carregando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
                Executar consulta
              </button>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-muted p-4 font-mono text-xs leading-relaxed text-foreground">
              {resultado.sql}
            </pre>
          </section>

          <section className={classeCartao}>
            <h3 className="mb-3 text-base font-bold text-foreground">Resultado em tabela</h3>
            <Tabela resultado={resultado} />
          </section>

          <section className={classeCartao}>
            <h3 className="mb-4 text-base font-bold text-foreground">Resultado em gráfico</h3>
            <Grafico resultado={resultado} />
          </section>
        </div>
      )}
    </div>
  );
}
