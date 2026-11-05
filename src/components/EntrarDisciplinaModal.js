'use client';

import { useState } from 'react';
import { X, Users, LogIn } from 'lucide-react';

export default function EntrarDisciplinaModal({ aberto, onFechar, onEntrou }) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!aberto) return null;

  function fechar() {
    setCodigo('');
    setErro('');
    onFechar();
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);

    try {
      const r = await fetch('/api/disciplinas/entrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo }),
      });
      const dados = await r.json();

      if (!r.ok) {
        setErro(dados.erro || 'Erro ao entrar na disciplina.');
        return;
      }

      onEntrou(dados.mensagem);
      fechar();
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
        aria-labelledby="titulo-entrar-disciplina"
        className="w-full max-w-sm rounded-3xl border border-border/50 bg-card p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="titulo-entrar-disciplina"
                className="text-lg font-bold tracking-tight text-foreground"
              >
                Entrar em Disciplina
              </h2>
              <p className="text-xs text-muted-foreground">Insira o código compartilhado</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {erro && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
            {erro}
          </div>
        )}

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <input
            type="text"
            aria-label="Código de compartilhamento"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ex: A1B2C3"
            maxLength={6}
            minLength={6}
            required
            disabled={enviando}
            className="w-full rounded-xl border border-border/60 bg-input/50 px-4 py-3.5 text-center text-lg font-bold uppercase tracking-[0.4em] text-foreground transition-all placeholder:font-medium placeholder:tracking-[0.3em] placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" /> {enviando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}