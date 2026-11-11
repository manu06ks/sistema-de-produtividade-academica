'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const inputClass =
  'w-full rounded-xl border border-border/60 bg-input/50 p-3.5 font-medium text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30';

const MAX_DESCRICAO = 500;

export default function GrupoFormModal({ grupo, onFechar, onSalva }) {
  const editando = Boolean(grupo);

  const [nome, setNome] = useState(grupo?.nome ?? '');
  const [descricao, setDescricao] = useState(grupo?.descricao ?? '');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      const r = await fetch(editando ? `/api/grupos/${grupo.id}` : '/api/grupos', {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, descricao }),
      });
      const dados = await r.json().catch(() => ({}));

      if (!r.ok) {
        setErro(dados.erro || 'Algo deu errado. Tente novamente.');
        return;
      }

      onSalva(dados, editando ? 'editado' : 'criado');
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
        aria-labelledby="titulo-form-grupo"
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
          id="titulo-form-grupo"
          className="mb-6 text-center text-2xl font-bold tracking-tight text-foreground"
        >
          {editando ? 'Editar Grupo' : 'Novo Grupo'}
        </h2>

        {erro && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
            {erro}
          </div>
        )}

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <input
            type="text"
            aria-label="Nome do grupo"
            placeholder="Nome do grupo"
            required
            maxLength={100}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={inputClass}
          />

          <div>
            <textarea
              aria-label="Descrição"
              placeholder="Descrição (opcional)"
              rows={4}
              maxLength={MAX_DESCRICAO}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={`${inputClass} resize-none`}
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">
              {descricao.length}/{MAX_DESCRICAO}
            </p>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar grupo'}
          </button>
        </form>
      </div>
    </div>
  );
}