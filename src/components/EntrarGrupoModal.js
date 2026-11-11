'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const inputClass =
  'w-full rounded-xl border border-border/60 bg-input/50 p-3.5 text-center font-mono text-xl font-bold uppercase tracking-[0.4em] text-foreground transition-all placeholder:text-sm placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function EntrarGrupoModal({ onFechar, onEntrou }) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      const r = await fetch('/api/grupos/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      });
      const dados = await r.json().catch(() => ({}));

      if (!r.ok) {
        setErro(dados.erro || 'Algo deu errado. Tente novamente.');
        return;
      }

      onEntrou(dados.mensagem, dados.grupo);
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
        aria-labelledby="titulo-entrar-grupo"
        className="relative w-full max-w-sm rounded-3xl border border-border/50 bg-card p-8 shadow-xl"
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
          id="titulo-entrar-grupo"
          className="mb-2 text-center text-2xl font-bold tracking-tight text-foreground"
        >
          Entrar em um Grupo
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Digite o código de 6 caracteres que o administrador do grupo te passou.
        </p>

        {erro && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
            {erro}
          </div>
        )}

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <input
            type="text"
            aria-label="Código do grupo"
            placeholder="Código do grupo"
            required
            maxLength={6}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            className={inputClass}
          />

          <button
            type="submit"
            disabled={enviando || codigo.length !== 6}
            className="w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Entrando...' : 'Entrar no grupo'}
          </button>
        </form>
      </div>
    </div>
  );
}