'use client';

import { useEffect, useState } from 'react';
import { X, Users, Pencil, Trash2, LogOut } from 'lucide-react';
import InviteBadge from '@/components/InviteBadge';

const btnBase =
  'flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export default function DisciplinaDetalheModal({
  disciplinaId,
  onFechar,
  onEditar,
  onAlterada,
}) {
  const [d, setD] = useState(null);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(null); // 'apagar' | 'sair' | null
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const r = await fetch(`/api/disciplinas/${disciplinaId}`);
        const dados = await r.json();
        if (!ativo) return;
        if (!r.ok) {
          setErro(dados.erro || 'Não foi possível carregar a disciplina.');
          return;
        }
        setD(dados);
      } catch {
        if (ativo) setErro('Erro de conexão. Tente novamente.');
      }
    })();

    return () => {
      ativo = false;
    };
  }, [disciplinaId]);

  async function executar(acao) {
    setProcessando(true);
    setErro('');

    try {
      const r =
        acao === 'apagar'
          ? await fetch(`/api/disciplinas/${disciplinaId}`, { method: 'DELETE' })
          : await fetch(`/api/disciplinas/${disciplinaId}/sair`, { method: 'POST' });
      const dados = await r.json();

      if (!r.ok) {
        setErro(dados.erro || 'Algo deu errado. Tente novamente.');
        setConfirmando(null);
        return;
      }

      onAlterada(acao === 'apagar' ? 'Disciplina apagada.' : 'Você saiu da disciplina.');
      onFechar();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
      setConfirmando(null);
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes da disciplina"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border/50 bg-card p-8 shadow-xl"
      >
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          className="absolute right-5 top-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {!d && !erro && (
          <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>
        )}

        {erro && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive">
            {erro}
          </div>
        )}

        {d && (
          <>
            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border/50 pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div
                  className="h-6 w-6 shrink-0 rounded-full"
                  style={{ backgroundColor: d.cor }}
                />
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {d.nome}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Prof: {d.professor || 'N/A'} • {d.semestre_letivo} •{' '}
                    <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 font-bold text-primary">
                      Criador: {d.criador_nome}
                    </span>
                  </p>
                </div>
              </div>
              <InviteBadge codigo={d.codigo_compartilhamento} />
            </div>

            <div className="mb-6 rounded-2xl border border-border/50 bg-secondary/30 p-3">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Users className="h-3 w-3 text-primary" /> Membros ({d.membros.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {d.membros.map((m) => (
                  <span
                    key={m.id}
                    className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-[10px] font-semibold shadow-sm"
                  >
                    {m.nome} {m.is_criador && '👑'}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-border/50 pt-4">
              {confirmando ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {confirmando === 'apagar'
                      ? 'Apagar esta disciplina definitivamente?'
                      : 'Sair desta disciplina? Suas atividades dela saem do seu quadro, mas o histórico de horas de estudo é mantido.'}
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      disabled={processando}
                      className={`${btnBase} bg-secondary text-secondary-foreground hover:bg-accent`}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => executar(confirmando)}
                      disabled={processando}
                      className={`${btnBase} bg-destructive text-white hover:bg-destructive/90`}
                    >
                      {processando ? 'Aguarde...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              ) : d.is_criador ? (
                <div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onEditar(d)}
                      className={`${btnBase} bg-secondary text-secondary-foreground hover:bg-accent`}
                    >
                      <Pencil className="h-4 w-4" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando('apagar')}
                      disabled={!d.vazia}
                      className={`${btnBase} bg-destructive/10 text-destructive hover:bg-destructive/20`}
                    >
                      <Trash2 className="h-4 w-4" /> Apagar
                    </button>
                  </div>
                  {!d.vazia && (
                    <p className="mt-2 text-right text-[11px] text-muted-foreground">
                      Só é possível apagar disciplinas sem outros alunos, atividades,
                      materiais ou planos de estudo.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmando('sair')}
                    className={`${btnBase} bg-destructive/10 text-destructive hover:bg-destructive/20`}
                  >
                    <LogOut className="h-4 w-4" /> Sair da disciplina
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}