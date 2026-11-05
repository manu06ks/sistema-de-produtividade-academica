'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function InviteBadge({ codigo }) {
  const [copiado, setCopiado] = useState(false);

  if (!codigo) return null;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // sem acesso à área de transferência: o código continua visível
    }
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background py-1 pl-3 pr-1 shadow-sm">
      <span className="text-[11px] font-medium text-muted-foreground">Código:</span>
      <span className="font-mono text-sm font-bold tracking-widest text-foreground">
        {codigo}
      </span>
      <button
        type="button"
        onClick={copiar}
        aria-label="Copiar código"
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-90 ${
          copiado
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}
      >
        {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}