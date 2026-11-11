'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const TIPOS = ['Tarefa', 'Prova', 'Trabalho'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta'];

const campoClass =
  'w-full rounded-xl border border-border/60 bg-input/50 p-3 text-sm font-medium text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30';
const rotuloClass = 'text-[10px] font-bold uppercase tracking-wide text-muted-foreground';

export default function TaskForm({ disciplinas, onCriada }) {
  const [tipo, setTipo] = useState('Tarefa');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [prioridade, setPrioridade] = useState('');
  const [peso, setPeso] = useState('');
  const [descricao, setDescricao] = useState('');
  const [compartilhar, setCompartilhar] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState(null); // { tipo: 'sucesso' | 'erro', msg }

  useEffect(() => {
    if (feedback?.tipo !== 'sucesso') return;
    const t = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(t);
  }, [feedback]);

  async function enviar(e) {
    e.preventDefault();
    setFeedback(null);
    setEnviando(true);

    try {
      const r = await fetch('/api/atividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descricao,
          data_vencimento: data,
          tipo_atividade: tipo,
          peso_nota: peso,
          disciplina_id: Number(disciplinaId),
          prioridade: prioridade || undefined,
          compartilhar,
        }),
      });
      const dados = await r.json();

      if (!r.ok) {
        setFeedback({
          tipo: 'erro',
          msg: dados.erro || 'Não foi possível salvar. Tente novamente.',
        });
        return;
      }

      const n = dados.convites_enviados;
      setFeedback({
        tipo: 'sucesso',
        msg:
          n > 0
            ? `Atividade criada e ${n} convite${n > 1 ? 's' : ''} enviado${n > 1 ? 's' : ''}!`
            : 'Atividade adicionada à agenda!',
      });

      setTitulo('');
      setData('');
      setPeso('');
      setDescricao('');
      setPrioridade('');
      setCompartilhar(false);
      onCriada(dados.atividade);
    } catch {
      setFeedback({ tipo: 'erro', msg: 'Erro de conexão. Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  const semDisciplinas = disciplinas !== null && disciplinas.length === 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm md:p-6">
      <h3 className="mb-5 text-center text-sm font-bold tracking-tight text-primary">
        Adicionar na agenda
      </h3>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${
            feedback.tipo === 'sucesso'
              ? 'bg-green-50 text-green-700'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {feedback.tipo === 'sucesso' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {feedback.msg}
        </div>
      )}

      {disciplinas === null ? (
        <p className="py-6 text-center text-xs italic text-muted-foreground">Carregando...</p>
      ) : semDisciplinas ? (
        <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
          Crie ou entre em uma disciplina para adicionar atividades.
        </p>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="tf-tipo" className={rotuloClass}>Tipo</label>
              <select
                id="tf-tipo"
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
              <label htmlFor="tf-prioridade" className={rotuloClass}>Prioridade</label>
              <select
                id="tf-prioridade"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className={campoClass}
              >
                <option value="">Automática</option>
                {PRIORIDADES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tf-disciplina" className={rotuloClass}>Disciplina</label>
            <select
              id="tf-disciplina"
              required
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              className={campoClass}
            >
              <option value="">Selecione a disciplina...</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tf-titulo" className={rotuloClass}>Título</label>
            <input
              id="tf-titulo"
              type="text"
              placeholder="Ex: Trabalho de Cálculo"
              required
              maxLength={150}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={campoClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="tf-data" className={rotuloClass}>Data de entrega</label>
              <input
                id="tf-data"
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={campoClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="tf-peso" className={rotuloClass}>Peso (%)</label>
              <input
                id="tf-peso"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Opcional"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                className={campoClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tf-descricao" className={rotuloClass}>Descrição (opcional)</label>
            <textarea
              id="tf-descricao"
              placeholder="Conteúdos, observações..."
              maxLength={2000}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={`${campoClass} h-20 resize-none`}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border/60 bg-secondary/40 p-3 text-xs text-foreground">
            <input
              type="checkbox"
              checked={compartilhar}
              onChange={(e) => setCompartilhar(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <strong className="font-bold">Compartilhar com a turma</strong>
              <br />
              <span className="text-muted-foreground">
                Os outros alunos da disciplina recebem um convite e escolhem se aceitam.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={enviando}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>Criar {tipo}</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}