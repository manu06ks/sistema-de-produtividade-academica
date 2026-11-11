'use client';

import { useState } from 'react';
import { X, Trash2, Users } from 'lucide-react';
import AnexoAtividade from '@/components/AnexoAtividade';

const TIPOS = ['Tarefa', 'Prova', 'Trabalho'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta'];
const STATUS = ['A Fazer', 'Fazendo', 'Concluído'];

const campoClass =
  'w-full rounded-xl border border-border/60 bg-input/50 p-3 text-sm font-medium text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60';
const rotuloClass = 'text-[10px] font-bold uppercase tracking-wide text-muted-foreground';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export default function AtividadeModal({ atividade, onFechar, onAtualizada, onRemovida }) {
  const autor = atividade.is_autor;

  const [titulo, setTitulo] = useState(atividade.titulo);
  const [descricao, setDescricao] = useState(atividade.descricao ?? '');
  const [data, setData] = useState(atividade.data_vencimento ?? '');
  const [tipo, setTipo] = useState(atividade.tipo_atividade);
  const [peso, setPeso] = useState(atividade.peso_nota ?? '');
  const [status, setStatus] = useState(atividade.status);
  const [prioridade, setPrioridade] = useState(atividade.prioridade);

  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmandoRemover, setConfirmandoRemover] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    let mudou = false;

    try {
      // Campos compartilhados: só o autor, e valem para todos.
      if (autor) {
        const r = await fetch(`/api/atividades/${atividade.id}`, {
          method: 'PUT',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            titulo,
            descricao,
            data_vencimento: data,
            tipo_atividade: tipo,
            peso_nota: peso,
          }),
        });
        const dados = await r.json();
        if (!r.ok) {
          setErro(dados.erro || 'Não foi possível salvar. Tente novamente.');
          return;
        }
        mudou = true;
      }

      // Campos pessoais: cada aluno muda os seus.
      if (status !== atividade.status || prioridade !== atividade.prioridade) {
        const r = await fetch(`/api/atividades/${atividade.id}`, {
          method: 'PATCH',
          headers: JSON_HEADERS,
          body: JSON.stringify({ status, prioridade }),
        });
        const dados = await r.json();
        if (!r.ok) {
          setErro(dados.erro || 'Não foi possível salvar. Tente novamente.');
          return;
        }
        mudou = true;
      }

      onFechar();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      if (mudou) onAtualizada();
      setEnviando(false);
    }
  }

  async function remover() {
    setErro('');
    setEnviando(true);

    try {
      const r = await fetch(`/api/atividades/${atividade.id}`, { method: 'DELETE' });
      const dados = await r.json();
      if (!r.ok) {
        setErro(dados.erro || 'Não foi possível remover. Tente novamente.');
        setConfirmandoRemover(false);
        return;
      }
      onRemovida(atividade.id);
      onFechar();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
      setConfirmandoRemover(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-atividade"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border/50 bg-card p-8 shadow-xl"
      >
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="absolute right-5 top-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h2
          id="titulo-atividade"
          className="mb-1 text-center text-2xl font-bold tracking-tight text-foreground"
        >
          Detalhes da atividade
        </h2>
        <p className="mb-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: atividade.disciplina_cor }}
          />
          {atividade.disciplina_nome}
          {!autor && (
            <>
              {' '}• <Users className="h-3 w-3" /> de {atividade.autor_nome}
            </>
          )}
        </p>

        {erro && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
            {erro}
          </div>
        )}

        <form onSubmit={salvar} className="flex flex-col gap-3">
          {!autor && (
            <p className="rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
              Esta atividade foi criada por {atividade.autor_nome}. Só ele pode alterar o
              título, a data e a descrição. Você pode ajustar o seu status e a sua prioridade.
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="at-titulo" className={rotuloClass}>Título</label>
            <input
              id="at-titulo"
              type="text"
              required
              maxLength={150}
              disabled={!autor}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={campoClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="at-tipo" className={rotuloClass}>Tipo</label>
              <select
                id="at-tipo"
                disabled={!autor}
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className={campoClass}
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="at-data" className={rotuloClass}>Data de entrega</label>
              <input
                id="at-data"
                type="date"
                required
                disabled={!autor}
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={campoClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="at-peso" className={rotuloClass}>Peso na nota (%)</label>
            <input
              id="at-peso"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Opcional"
              disabled={!autor}
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className={campoClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="at-descricao" className={rotuloClass}>Descrição</label>
            <textarea
              id="at-descricao"
              maxLength={2000}
              disabled={!autor}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={`${campoClass} h-24 resize-none`}
            />
          </div>
          <AnexoAtividade atividadeId={atividade.id} souCriador={autor} />
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/50 bg-secondary/30 p-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="at-status" className={rotuloClass}>Meu status</label>
              <select
                id="at-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={campoClass}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="at-prioridade" className={rotuloClass}>Minha prioridade</label>
              <select
                id="at-prioridade"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className={campoClass}
              >
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {confirmandoRemover ? (
            <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <p className="mb-3 text-xs text-foreground">
                Remover esta atividade do seu quadro? Ela some só para você: para os outros
                alunos nada muda, e o seu histórico de horas de estudo é mantido.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmandoRemover(false)}
                  disabled={enviando}
                  className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={remover}
                  disabled={enviando}
                  className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
                >
                  {enviando ? 'Aguarde...' : 'Remover'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex gap-2">
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoRemover(true)}
                disabled={enviando}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive/10 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Remover do meu quadro
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}