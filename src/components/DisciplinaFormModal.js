'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const COR_PADRAO = '#7c3aed';

const inputClass =
  'w-full rounded-xl border border-border/60 bg-input/50 p-3.5 font-medium text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function DisciplinaFormModal({ disciplina, onFechar, onSalva }) {
  const editando = Boolean(disciplina);

  const [nome, setNome] = useState(disciplina?.nome ?? '');
  const [professor, setProfessor] = useState(disciplina?.professor ?? '');
  const [semestre, setSemestre] = useState(disciplina?.semestre_letivo ?? '');
  const [cor, setCor] = useState(disciplina?.cor ?? COR_PADRAO);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      const r = await fetch(
        editando ? `/api/disciplinas/${disciplina.id}` : '/api/disciplinas',
        {
          method: editando ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, professor, semestre_letivo: semestre, cor }),
        }
      );
      const dados = await r.json();

      if (!r.ok) {
        setErro(dados.erro || 'Algo deu errado. Tente novamente.');
        return;
      }

      onSalva(dados, editando ? 'editada' : 'criada');
      onFechar();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-form-disciplina"
        className="relative w-full max-w-md rounded-3xl border border-border/50 bg-card p-8 shadow-xl"
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
          id="titulo-form-disciplina"
          className="mb-6 text-center text-2xl font-bold tracking-tight text-foreground"
        >
          {editando ? 'Editar Disciplina' : 'Nova Disciplina'}
        </h2>

        {erro && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
            {erro}
          </div>
        )}

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <input
            type="text"
            aria-label="Nome da disciplina"
            placeholder="Nome da disciplina"
            required
            maxLength={100}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            aria-label="Professor"
            placeholder="Professor (opcional)"
            maxLength={150}
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            aria-label="Semestre letivo"
            placeholder="Semestre (ex.: 2026.1)"
            required
            maxLength={20}
            value={semestre}
            onChange={(e) => setSemestre(e.target.value)}
            className={inputClass}
          />

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-input/50 p-3.5">
            <label htmlFor="cor-disciplina" className="text-sm font-medium text-foreground">
              Cor:
            </label>
            <input
              id="cor-disciplina"
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? 'Salvando...'
              : editando
              ? 'Salvar alterações'
              : 'Criar disciplina'}
          </button>
        </form>
      </div>
    </div>
  );
}