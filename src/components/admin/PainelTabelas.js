'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { botaoPerigo, botaoPrimario, botaoSecundario, classeCampo, classeCartao } from './api';

const tituloDe = (tabelas, nome) => tabelas.find((t) => t.nome === nome)?.titulo ?? nome;
const chaveDaLinha = (meta, linha) => Object.fromEntries(meta.chave.map((c) => [c, linha[c]]));

// ---------------------------------------------------------------------
// Um campo do formulário, de acordo com o tipo da coluna
// ---------------------------------------------------------------------
function Campo({ coluna, valor, aoMudar, opcoes, modo, tabelas }) {
  const id = `campo-${coluna.nome}`;
  const desabilitado = coluna.automatica;
  let controle;

  if (coluna.fk?.simples) {
    const lista = opcoes ?? [];
    const tem = valor === '' || lista.some((o) => o.valor === valor);
    controle = (
      <select id={id} className={classeCampo} value={valor} onChange={(e) => aoMudar(e.target.value)}>
        <option value="">{coluna.obrigatoria ? 'Escolha...' : '(vazio)'}</option>
        {!tem && <option value={valor}>{valor}</option>}
        {lista.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.valor} — {o.rotulo}
          </option>
        ))}
      </select>
    );
  } else if (coluna.entrada === 'booleano') {
    controle = (
      <select id={id} className={classeCampo} value={valor} onChange={(e) => aoMudar(e.target.value)}>
        <option value="">{coluna.padrao ? `(padrão: ${coluna.padrao})` : '(vazio)'}</option>
        <option value="true">Sim (true)</option>
        <option value="false">Não (false)</option>
      </select>
    );
  } else if (coluna.entrada === 'textolongo') {
    controle = (
      <textarea id={id} rows={3} className={classeCampo} value={valor} onChange={(e) => aoMudar(e.target.value)} />
    );
  } else {
    const tipo = coluna.entrada === 'inteiro' ? 'number' : coluna.entrada === 'data' ? 'date' : 'text';
    controle = (
      <input
        id={id}
        type={tipo}
        step={tipo === 'number' ? 1 : undefined}
        inputMode={coluna.entrada === 'decimal' ? 'decimal' : undefined}
        className={classeCampo}
        value={valor}
        disabled={desabilitado}
        placeholder={
          desabilitado
            ? modo === 'novo'
              ? 'automático'
              : ''
            : coluna.entrada === 'datahora'
              ? 'AAAA-MM-DD HH:MM:SS'
              : coluna.padrao
                ? `padrão: ${coluna.padrao}`
                : ''
        }
        onChange={(e) => aoMudar(e.target.value)}
      />
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-foreground/80">
        <span className="font-mono">{coluna.nome}</span>
        {coluna.obrigatoria && !coluna.automatica && !coluna.padrao && <span className="text-destructive">*</span>}
        <span className="font-normal text-muted-foreground">{coluna.tipo}</span>
        {coluna.pk && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">PK</span>}
        {coluna.fk && (
          <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
            FK → {tituloDe(tabelas, coluna.fk.tabela_ref)}
            {coluna.fk.simples ? '' : ' (composta)'}
          </span>
        )}
      </label>
      {controle}
      {coluna.fk && !coluna.fk.simples && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Chave estrangeira composta: o par ({coluna.fk.colunas.join(', ')}) deve existir em{' '}
          {tituloDe(tabelas, coluna.fk.tabela_ref)}.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Painel
// ---------------------------------------------------------------------
export default function PainelTabelas({ api, aoAtualizar }) {
  const [tabelas, setTabelas] = useState(null);
  const [erroGeral, setErroGeral] = useState('');
  const [selecionada, setSelecionada] = useState(null);
  const [dadosBrutos, setDados] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [form, setForm] = useState(null);
  const [excluindo, setExcluindo] = useState(null); // chave (texto) da linha em confirmação
  const [salvando, setSalvando] = useState(false);

  const meta = useMemo(() => tabelas?.find((t) => t.nome === selecionada) ?? null, [tabelas, selecionada]);
  // Só mostra linhas da tabela escolhida (uma resposta atrasada de outra tabela é ignorada).
  const dados = dadosBrutos?.tabela === selecionada ? dadosBrutos : null;

  const carregarTabelas = useCallback(async () => {
    try {
      const r = await api('/tabelas');
      setTabelas(r.tabelas);
      setErroGeral('');
      return r.tabelas;
    } catch (e) {
      setErroGeral(e.message);
      return null;
    }
  }, [api]);

  const carregarLinhas = useCallback(
    async (nome, p) => {
      setCarregando(true);
      try {
        const r = await api(`/tabelas/${nome}?pagina=${p}`);
        setDados({ ...r, tabela: nome });
        setPagina(r.pagina);
      } catch (e) {
        setDados(null);
        setMensagem({ tipo: 'erro', texto: e.message });
      } finally {
        setCarregando(false);
      }
    },
    [api]
  );

  useEffect(() => {
    carregarTabelas().then((lista) => {
      if (lista) setSelecionada((atual) => atual ?? lista.find((t) => t.existe)?.nome ?? null);
    });
  }, [carregarTabelas]);

  useEffect(() => {
    if (selecionada) carregarLinhas(selecionada, 1);
  }, [selecionada, carregarLinhas]);

  function escolher(nome) {
    setSelecionada(nome);
    setForm(null);
    setExcluindo(null);
    setMensagem(null);
    setDados(null);
  }

  async function abrirForm(modo, linha) {
    setMensagem(null);
    setExcluindo(null);
    const valores = {};
    for (const c of meta.colunas) valores[c.nome] = linha?.[c.nome] ?? '';
    const opcoes = {};
    await Promise.all(
      meta.colunas
        .filter((c) => c.fk?.simples)
        .map(async (c) => {
          try {
            opcoes[c.nome] = (await api(`/tabelas/${meta.nome}/opcoes?coluna=${c.nome}`)).opcoes;
          } catch {
            opcoes[c.nome] = [];
          }
        })
    );
    setForm({ modo, valores, opcoes, chave: linha ? chaveDaLinha(meta, linha) : null });
  }

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    try {
      const valores = {};
      for (const c of meta.colunas) if (!c.automatica) valores[c.nome] = form.valores[c.nome];
      if (form.modo === 'novo') {
        await api(`/tabelas/${meta.nome}`, { metodo: 'POST', corpo: { valores } });
        setMensagem({ tipo: 'ok', texto: 'Registro incluído.' });
      } else {
        await api(`/tabelas/${meta.nome}`, { metodo: 'PUT', corpo: { chave: form.chave, valores } });
        setMensagem({ tipo: 'ok', texto: 'Registro alterado.' });
      }
      setForm(null);
      await Promise.all([carregarLinhas(meta.nome, form.modo === 'novo' ? 1 : pagina), carregarTabelas()]);
      aoAtualizar();
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(linha) {
    setMensagem(null);
    try {
      await api(`/tabelas/${meta.nome}`, { metodo: 'DELETE', corpo: { chave: chaveDaLinha(meta, linha) } });
      setMensagem({ tipo: 'ok', texto: 'Registro excluído.' });
      setExcluindo(null);
      await Promise.all([carregarLinhas(meta.nome, pagina), carregarTabelas()]);
      aoAtualizar();
    } catch (err) {
      setExcluindo(null);
      setMensagem({ tipo: 'erro', texto: err.message });
    }
  }

  if (erroGeral) {
    return (
      <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        {erroGeral}
      </p>
    );
  }
  if (!tabelas) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando as tabelas...
      </p>
    );
  }

  const referenciadaPor = meta
    ? tabelas
        .filter((t) => t.existe && t.fks.some((f) => f.tabela_ref === meta.nome))
        .map((t) => `${t.titulo} (${t.fks.find((f) => f.tabela_ref === meta.nome).ao_excluir})`)
    : [];
  const dependeDe = meta
    ? meta.fks.map((f) => `${tituloDe(tabelas, f.tabela_ref)} (${f.ao_excluir})`)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Tabelas: inserir, alterar, excluir e consultar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma tabela. As chaves estrangeiras são respeitadas: o banco recusa referências inexistentes e
          exclusões de quem ainda tem dependentes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="Tabelas" className="rounded-3xl border border-border bg-card p-3">
          <ul className="space-y-1">
            {tabelas.map((t) => (
              <li key={t.nome}>
                <button
                  onClick={() => t.existe && escolher(t.nome)}
                  disabled={!t.existe}
                  aria-current={selecionada === t.nome ? 'true' : undefined}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    selecionada === t.nome ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <span className="min-w-0 truncate font-semibold">{t.titulo}</span>
                  <span className="ml-2 shrink-0 text-xs tabular-nums opacity-80">{t.existe ? t.total : '—'}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4">
          {!meta && (
            <p className="rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
              Nenhuma tabela existe ainda. Use <strong>Banco de dados → Criar tabelas</strong>.
            </p>
          )}

          {meta && (
            <>
              <div className={classeCartao}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-foreground">{meta.titulo}</h3>
                    <p className="text-xs text-muted-foreground">
                      {meta.total} registros · chave primária: {meta.chave.join(', ')}
                    </p>
                  </div>
                  <button className={botaoPrimario} onClick={() => abrirForm('novo')}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Novo registro
                  </button>
                </div>
                {(dependeDe.length > 0 || referenciadaPor.length > 0) && (
                  <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {dependeDe.length > 0 && (
                      <div>
                        <dt className="inline font-semibold text-foreground/80">Depende de (FK): </dt>
                        <dd className="inline">{dependeDe.join(', ')}</dd>
                      </div>
                    )}
                    {referenciadaPor.length > 0 && (
                      <div>
                        <dt className="inline font-semibold text-foreground/80">Referenciada por (regra ao excluir): </dt>
                        <dd className="inline">{referenciadaPor.join(', ')}</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>

              {mensagem && (
                <div
                  role={mensagem.tipo === 'erro' ? 'alert' : 'status'}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
                    mensagem.tipo === 'erro'
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  }`}
                >
                  {mensagem.tipo === 'erro' ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <p className="min-w-0 break-words">{mensagem.texto}</p>
                </div>
              )}

              {form && (
                <form onSubmit={salvar} className={`${classeCartao} border-primary/30`}>
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-base font-bold text-foreground">
                      {form.modo === 'novo' ? `Novo registro em ${meta.titulo}` : `Alterar registro de ${meta.titulo}`}
                    </h4>
                    <button type="button" onClick={() => setForm(null)} aria-label="Fechar formulário" className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent">
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {meta.colunas.map((c) => (
                      <div key={c.nome} className={c.entrada === 'textolongo' ? 'sm:col-span-2' : ''}>
                        <Campo
                          coluna={c}
                          valor={form.valores[c.nome]}
                          opcoes={form.opcoes[c.nome]}
                          modo={form.modo}
                          tabelas={tabelas}
                          aoMudar={(v) => setForm((f) => ({ ...f, valores: { ...f.valores, [c.nome]: v } }))}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Campos em branco usam o valor padrão (ou ficam vazios). * = obrigatório.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button type="submit" className={botaoPrimario} disabled={salvando}>
                      {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                      Salvar
                    </button>
                    <button type="button" className={botaoSecundario} onClick={() => setForm(null)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto rounded-3xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted text-xs text-muted-foreground">
                    <tr>
                      {meta.colunas.map((c) => (
                        <th key={c.nome} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                          <span className="font-mono">{c.nome}</span>
                          {c.pk && <span className="ml-1 rounded bg-primary/10 px-1 text-[10px] font-bold text-primary">PK</span>}
                          {c.fk && <span className="ml-1 rounded bg-accent px-1 text-[10px] font-bold text-accent-foreground">FK</span>}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carregando && !dados && (
                      <tr>
                        <td colSpan={meta.colunas.length + 1} className="px-3 py-6 text-center text-muted-foreground">
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden="true" />
                        </td>
                      </tr>
                    )}
                    {dados && dados.linhas.length === 0 && (
                      <tr>
                        <td colSpan={meta.colunas.length + 1} className="px-3 py-6 text-center text-muted-foreground">
                          Tabela vazia.
                        </td>
                      </tr>
                    )}
                    {dados?.linhas.map((linha) => {
                      const chave = JSON.stringify(chaveDaLinha(meta, linha));
                      return (
                        <tr key={chave} className="border-t border-border align-top">
                          {meta.colunas.map((c) => (
                            <td key={c.nome} className="max-w-[16rem] truncate px-3 py-2 tabular-nums" title={linha[c.nome] ?? ''}>
                              {linha[c.nome] === null ? <span className="italic text-muted-foreground">—</span> : linha[c.nome]}
                            </td>
                          ))}
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                            {excluindo === chave ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-destructive">Excluir?</span>
                                <button className={`${botaoPerigo} !px-2.5 !py-1 !text-xs`} onClick={() => excluir(linha)}>
                                  Sim
                                </button>
                                <button className={`${botaoSecundario} !px-2.5 !py-1 !text-xs`} onClick={() => setExcluindo(null)}>
                                  Não
                                </button>
                              </span>
                            ) : (
                              <span className="inline-flex gap-1">
                                <button
                                  onClick={() => abrirForm('editar', linha)}
                                  aria-label="Alterar registro"
                                  title="Alterar"
                                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                                >
                                  <Pencil className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <button
                                  onClick={() => {
                                    setMensagem(null);
                                    setExcluindo(chave);
                                  }}
                                  aria-label="Excluir registro"
                                  title="Excluir"
                                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {dados && dados.paginas > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Página {dados.pagina} de {dados.paginas} · {dados.total} registros
                  </span>
                  <span className="flex gap-2">
                    <button className={botaoSecundario} disabled={dados.pagina <= 1} onClick={() => carregarLinhas(meta.nome, dados.pagina - 1)}>
                      Anterior
                    </button>
                    <button className={botaoSecundario} disabled={dados.pagina >= dados.paginas} onClick={() => carregarLinhas(meta.nome, dados.pagina + 1)}>
                      Próxima
                    </button>
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
