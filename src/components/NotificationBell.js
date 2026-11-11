'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Check, X, Users } from 'lucide-react';
import { formatarDiaMes } from '@/lib/datas';

const INTERVALO_MS = 60000;

export default function NotificationBell() {
  const [aberto, setAberto] = useState(false);
  const [convites, setConvites] = useState([]);
  const [erro, setErro] = useState('');
  const [respondendo, setRespondendo] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch('/api/convites');
      if (!r.ok) return;
      setConvites(await r.json());
    } catch {
      // sem conexão: mantém a lista que já estava na tela
    }
  }, []);

  // Busca ao montar e a cada minuto, para avisar de convites novos.
  useEffect(() => {
    carregar();
    const t = setInterval(carregar, INTERVALO_MS);
    return () => clearInterval(t);
  }, [carregar]);

  // Ao abrir, atualiza na hora. Escape fecha.
  useEffect(() => {
    if (!aberto) return;
    carregar();

    function aoTeclar(e) {
      if (e.key === 'Escape') setAberto(false);
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aberto, carregar]);

  async function responder(id, aceitar) {
    setErro('');
    setRespondendo(id);

    try {
      const r = await fetch(`/api/convites/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aceitar }),
      });

      // 404 = o convite já foi respondido em outro lugar: some da lista sem erro.
      if (!r.ok && r.status !== 404) {
        const dados = await r.json().catch(() => ({}));
        setErro(dados.erro || 'Não foi possível responder. Tente novamente.');
        return;
      }

      setConvites((lista) => lista.filter((c) => c.id !== id));
      if (aceitar && r.ok) window.dispatchEvent(new Event('unistudy:atividades'));
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setRespondendo(null);
    }
  }

  const total = convites.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={total > 0 ? `Notificações: ${total} pendentes` : 'Notificações'}
        aria-expanded={aberto}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-foreground active:scale-95"
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div className="absolute right-0 z-50 mt-3 w-80 origin-top-right overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <h3 className="text-sm font-bold text-foreground">Notificações</h3>
              {total > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {total} nova{total > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {erro && <p className="px-4 pt-3 text-xs font-medium text-destructive">{erro}</p>}

            <ul className="max-h-96 divide-y divide-border/50 overflow-y-auto">
              {total === 0 ? (
                <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Tudo em dia por aqui
                  </p>
                </li>
              ) : (
                convites.map((c) => (
                  <li key={c.id} className="px-4 py-3 transition-colors hover:bg-secondary/40">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-foreground">
                          <span className="font-semibold">{c.autor_nome}</span> compartilhou{' '}
                          <span className="font-semibold">“{c.titulo}”</span> em{' '}
                          <span className="font-medium text-primary">{c.disciplina_nome}</span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {c.tipo_atividade}
                          {c.data_vencimento && ` • entrega ${formatarDiaMes(c.data_vencimento)}`}
                        </p>

                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => responder(c.id, true)}
                            disabled={respondendo === c.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" /> Aceitar
                          </button>
                          <button
                            type="button"
                            onClick={() => responder(c.id, false)}
                            disabled={respondendo === c.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground transition-all hover:bg-accent active:scale-95 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" /> Recusar
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}