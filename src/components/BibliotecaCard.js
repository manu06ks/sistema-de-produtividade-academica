'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Library, Trash2, Upload } from 'lucide-react';
import EnviarArquivoModal from '@/components/EnviarArquivoModal';
import IconeArquivo from '@/components/IconeArquivo';
import { dataCurta, formatarTamanho } from '@/lib/anexos';

export default function BibliotecaCard({ disciplinas }) {
  const [filtro, setFiltro] = useState(''); // '' = todas as disciplinas
  // Guarda a lista junto com o filtro a que ela pertence: assim a tela sabe
  // sozinha se a lista na memória ainda vale para o filtro atual.
  const [resultado, setResultado] = useState(null); // { filtro, itens, erro }
  const [mensagem, setMensagem] = useState(null); // { tipo: 'ok' | 'erro', texto }
  const [enviarAberto, setEnviarAberto] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [apagandoId, setApagandoId] = useState(null);
  const pedido = useRef(0); // número do último pedido de lista (respostas antigas são ignoradas)

  const carregando = disciplinas === null;
  const semDisciplinas = disciplinas !== null && disciplinas.length === 0;

  // Se a disciplina filtrada deixou de existir (o aluno saiu dela), volta para "Todas".
  const filtroAtual =
    disciplinas && disciplinas.some((d) => String(d.id) === filtro) ? filtro : '';

  const carregar = useCallback(async (filtroAlvo) => {
    const numero = ++pedido.current;
    try {
      const url = filtroAlvo ? `/api/materiais?disciplina_id=${filtroAlvo}` : '/api/materiais';
      const r = await fetch(url);
      if (!r.ok) throw new Error('falha');
      const itens = await r.json();
      if (numero === pedido.current) setResultado({ filtro: filtroAlvo, itens, erro: false });
    } catch {
      if (numero === pedido.current) {
        setResultado((atual) => ({
          filtro: filtroAlvo,
          itens: atual && atual.filtro === filtroAlvo ? atual.itens : [],
          erro: true,
        }));
      }
    }
  }, []);

  // Carrega ao abrir, ao trocar o filtro e quando a lista de disciplinas muda
  // (renomear ou trocar a cor de uma disciplina muda o que aparece nos itens).
  useEffect(() => {
    if (disciplinas === null || disciplinas.length === 0) return; // nada para buscar
    carregar(filtroAtual);
  }, [carregar, filtroAtual, disciplinas]);

  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(() => setMensagem(null), 8000);
    return () => clearTimeout(t);
  }, [mensagem]);

  async function apagar(item) {
    setApagandoId(item.id);
    try {
      const r = await fetch(`/api/materiais/${item.id}`, { method: 'DELETE' });
      const dados = await r.json().catch(() => ({}));

      if (r.ok) {
        setResultado((atual) =>
          atual ? { ...atual, itens: atual.itens.filter((i) => i.id !== item.id) } : atual
        );
        setMensagem({ tipo: 'ok', texto: 'Arquivo apagado.' });
      } else {
        setMensagem({ tipo: 'erro', texto: dados.erro || 'Não foi possível apagar o arquivo.' });
        if (r.status === 404) carregar(filtroAtual); // já tinha sido apagado por outra pessoa
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' });
    } finally {
      setApagandoId(null);
      setConfirmandoId(null);
    }
  }

  const valeParaOFiltro = resultado !== null && resultado.filtro === filtroAtual;
  const itens = valeParaOFiltro ? resultado.itens : [];
  const erroLista = valeParaOFiltro && resultado.erro;
  const buscando = !carregando && !semDisciplinas && !valeParaOFiltro;

  return (
    <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-primary">
          <Library className="h-4 w-4" /> Biblioteca
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filtrar por disciplina"
            value={filtroAtual}
            disabled={carregando || semDisciplinas}
            onChange={(e) => {
              setFiltro(e.target.value);
              setConfirmandoId(null);
            }}
            className="rounded-xl border border-border/60 bg-input/50 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
          >
            <option value="">Todas as disciplinas</option>
            {(disciplinas ?? []).map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setEnviarAberto(true)}
            disabled={carregando || semDisciplinas}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-3.5 w-3.5" /> Enviar arquivo
          </button>
        </div>
      </div>

      {mensagem && (
        <div
          role="status"
          className={`mb-4 rounded-xl p-3 text-sm font-medium ${
            mensagem.tipo === 'ok'
              ? 'bg-green-50 text-green-700'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      {erroLista && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          Não foi possível carregar a biblioteca.
          <button
            type="button"
            onClick={() => carregar(filtroAtual)}
            className="rounded-lg bg-destructive/10 px-3 py-1 text-xs font-semibold hover:bg-destructive/20"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {carregando || buscando ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>
      ) : semDisciplinas ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Crie ou entre em uma disciplina para compartilhar arquivos com a turma.
        </p>
      ) : itens.length === 0 && !erroLista ? (
        <div className="rounded-2xl border border-dashed border-border/60 py-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            {filtroAtual ? 'Nenhum arquivo nesta disciplina ainda.' : 'Nenhum arquivo na biblioteca ainda.'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Use “Enviar arquivo” para compartilhar um material com a turma.
          </p>
        </div>
      ) : (
        <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
          {itens.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/50 bg-secondary/30 p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground"
                  style={{ boxShadow: `inset 0 -3px 0 ${item.disciplina_cor}` }}
                >
                  <IconeArquivo tipo={item.tipo} className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground" title={item.nome}>
                    {item.nome}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.disciplina_cor }}
                    />
                    <span>{item.disciplina_nome}</span>
                    <span>• {item.tipo}</span>
                    <span>• {formatarTamanho(item.tamanho_kb)}</span>
                    <span>• {item.eh_meu ? 'Você' : item.autor_nome}</span>
                    <span>• {dataCurta(item.data_upload)}</span>
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <a
                    href={`/api/materiais/${item.id}/baixar`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir ${item.nome}`}
                    className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Abrir
                  </a>
                  {item.pode_apagar && (
                    <button
                      type="button"
                      onClick={() => setConfirmandoId(item.id)}
                      disabled={apagandoId !== null}
                      aria-label={`Apagar ${item.nome}`}
                      className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {confirmandoId === item.id && (
                <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                  <p className="mb-3 text-xs text-foreground">
                    Apagar “{item.nome}”? O arquivo some para todos os alunos da disciplina.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmandoId(null)}
                      disabled={apagandoId !== null}
                      className="flex-1 rounded-xl bg-secondary py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => apagar(item)}
                      disabled={apagandoId !== null}
                      className="flex-1 rounded-xl bg-destructive py-2 text-xs font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
                    >
                      {apagandoId === item.id ? 'Apagando...' : 'Apagar'}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {enviarAberto && (
        <EnviarArquivoModal
          disciplinas={disciplinas ?? []}
          disciplinaInicial={filtroAtual}
          onFechar={() => setEnviarAberto(false)}
          onEnviado={(item) => {
            setMensagem({
              tipo: 'ok',
              texto: `“${item.nome}” enviado para ${item.disciplina_nome}.`,
            });
            carregar(filtroAtual);
          }}
        />
      )}
    </div>
  );
}