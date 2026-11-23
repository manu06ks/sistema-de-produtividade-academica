'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { botaoPrimario, classeCampo, classeCartao, formatarNumero } from './api';

function hojeMais(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const dataBR = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

function PlanoGerado({ resposta }) {
  const p = resposta.plano;
  const dados = p?.plano;
  if (!dados) return null;
  return (
    <section className={`${classeCartao} border-primary/30`}>
      <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        Plano de {p.disciplina_nome}
      </h3>
      <p className="mt-2 text-sm text-foreground">{dados.resumo}</p>

      <div className="mt-4 space-y-3">
        {dados.dias.map((dia) => (
          <div key={dia.data} className="rounded-2xl bg-muted p-4">
            <p className="text-sm font-bold text-foreground">
              {dataBR(dia.data)} · <span className="font-medium">{dia.foco}</span>
            </p>
            {dia.blocos.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">Dia livre.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {dia.blocos.map((b, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-14 shrink-0 font-bold tabular-nums text-foreground">{b.minutos} min</span>
                    <span className="min-w-0 break-words text-foreground">
                      {b.titulo}
                      {b.detalhes && <span className="block text-xs text-muted-foreground">{b.detalhes}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {dados.dicas?.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {dados.dicas.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Consumo desta chamada: {formatarNumero(p.tokens_entrada ?? 0, 0)} tokens de entrada,{' '}
        {formatarNumero(p.tokens_saida ?? 0, 0)} de saída · custo US$ {Number(p.custo ?? 0).toFixed(6)}
      </p>
    </section>
  );
}

export default function PainelIA({ api, demo }) {
  const [info, setInfo] = useState(null);
  const [erroInfo, setErroInfo] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [dataAlvo, setDataAlvo] = useState(hojeMais(3));
  const [horas, setHoras] = useState('1.5');
  const [conteudos, setConteudos] = useState('');
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [resposta, setResposta] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setInfo(await api('/ia'));
      setErroInfo('');
    } catch (e) {
      setErroInfo(e.message);
    }
  }, [api]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const disciplinas = useMemo(
    () => (info?.matriculas ?? []).filter((m) => String(m.usuario_id) === String(usuarioId)),
    [info, usuarioId]
  );

  async function gerar(e) {
    e.preventDefault();
    setGerando(true);
    setErro('');
    setResposta(null);
    try {
      const r = await api('/ia', {
        metodo: 'POST',
        corpo: {
          usuario_id: Number(usuarioId),
          disciplina_id: Number(disciplinaId),
          data_alvo: dataAlvo,
          horas_por_dia: Number(horas),
          conteudos,
        },
      });
      setResposta(r);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setGerando(false);
    }
  }

  if (erroInfo) {
    return (
      <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        {erroInfo}
      </p>
    );
  }
  if (!info) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">IA generativa</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          O UniStudy usa um modelo de linguagem (Google Gemini) para montar um plano de estudos dia a dia, a partir da
          disciplina, da data-alvo, das horas por dia, dos conteúdos e das atividades pendentes do estudante. Cada
          chamada tem os tokens e o custo gravados na tabela Historico_Tokens_IA.
        </p>
      </div>

      <section className={classeCartao}>
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Situação</dt>
            <dd className={`font-bold ${info.configurada ? 'text-emerald-700' : 'text-destructive'}`}>
              {info.configurada ? 'Configurada' : 'Sem GEMINI_API_KEY'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Modelo</dt>
            <dd className="font-mono font-bold text-foreground">{info.modelo}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Chamadas registradas</dt>
            <dd className="font-bold tabular-nums text-foreground">{info.uso.chamadas}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Custo acumulado</dt>
            <dd className="font-bold tabular-nums text-foreground">US$ {Number(info.uso.custo).toFixed(6)}</dd>
          </div>
        </dl>
      </section>

      <section className={classeCartao}>
        <h3 className="mb-4 text-base font-bold text-foreground">Gerar plano de estudos</h3>
        <form onSubmit={gerar} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ia-usuario" className="mb-1 block text-xs font-semibold text-foreground/80">
              Estudante
            </label>
            <select
              id="ia-usuario"
              required
              className={classeCampo}
              value={usuarioId}
              onChange={(e) => {
                setUsuarioId(e.target.value);
                setDisciplinaId('');
              }}
            >
              <option value="">Escolha...</option>
              {info.usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ia-disciplina" className="mb-1 block text-xs font-semibold text-foreground/80">
              Disciplina
            </label>
            <select
              id="ia-disciplina"
              required
              className={classeCampo}
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              disabled={!usuarioId}
            >
              <option value="">{usuarioId ? 'Escolha...' : 'Escolha o estudante primeiro'}</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ia-data" className="mb-1 block text-xs font-semibold text-foreground/80">
              Data-alvo
            </label>
            <input id="ia-data" type="date" required className={classeCampo} value={dataAlvo} onChange={(e) => setDataAlvo(e.target.value)} />
          </div>
          <div>
            <label htmlFor="ia-horas" className="mb-1 block text-xs font-semibold text-foreground/80">
              Horas por dia (0,5 a 12)
            </label>
            <input
              id="ia-horas"
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              required
              className={classeCampo}
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="ia-conteudos" className="mb-1 block text-xs font-semibold text-foreground/80">
              Conteúdos a estudar (opcional)
            </label>
            <textarea
              id="ia-conteudos"
              rows={3}
              className={classeCampo}
              value={conteudos}
              onChange={(e) => setConteudos(e.target.value)}
              placeholder="Ex.: modelo relacional, álgebra relacional e consultas SQL com GROUP BY"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={botaoPrimario} disabled={gerando || !info.configurada}>
              {gerando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
              {gerando ? 'Gerando com a IA...' : 'Gerar plano com IA'}
            </button>
            {!info.configurada && (
              <p className="mt-2 text-xs text-muted-foreground">Defina GEMINI_API_KEY no servidor para habilitar a geração.</p>
            )}
          </div>
        </form>
        {erro && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {erro}
          </p>
        )}
      </section>

      {resposta && <PlanoGerado resposta={resposta} />}

      <section className={classeCartao}>
        <h3 className="mb-3 text-base font-bold text-foreground">Últimas chamadas à IA (Historico_Tokens_IA)</h3>
        {info.ultimas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma chamada registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-semibold">Quando</th>
                  <th className="px-3 py-2 font-semibold">Estudante</th>
                  <th className="px-3 py-2 font-semibold">Tokens (entrada / saída)</th>
                  <th className="px-3 py-2 font-semibold">Custo (US$)</th>
                  <th className="px-3 py-2 font-semibold">Gerou plano</th>
                </tr>
              </thead>
              <tbody>
                {info.ultimas.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-3 py-2 tabular-nums">{u.quando}</td>
                    <td className="px-3 py-2">{u.usuario}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {u.tokens_entrada} / {u.tokens_saida}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{Number(u.custo).toFixed(6)}</td>
                    <td className="px-3 py-2">{u.gerou_plano ? 'Sim' : 'Não'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        No sistema, o estudante usa a IA na página Planos:{' '}
        <a href="/planos" className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline">
          abrir Planos <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        {demo && (
          <>
            {' '}
            (login de demonstração: <strong>{demo.email}</strong> · senha <strong>{demo.senha}</strong>).
          </>
        )}
      </p>
    </div>
  );
}
