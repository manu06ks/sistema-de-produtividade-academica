'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, LogIn, Plus, Users } from 'lucide-react';
import GrupoFormModal from '@/components/GrupoFormModal';
import EntrarGrupoModal from '@/components/EntrarGrupoModal';

function GrupoCard({ grupo }) {
  const admin = grupo.papel === 'Administrador';

  return (
    <Link
      href={`/grupos/${grupo.id}`}
      className="flex flex-col gap-3 rounded-3xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 truncate text-lg font-bold tracking-tight text-foreground">
          {grupo.nome}
        </h2>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
            admin ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {admin && <Crown className="h-3 w-3" />}
          {grupo.papel}
        </span>
      </div>

      <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
        {grupo.descricao || 'Sem descrição.'}
      </p>

      <div className="mt-auto flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {grupo.total_membros} {grupo.total_membros === 1 ? 'membro' : 'membros'}
        </span>
        {!grupo.status_ativo && (
          <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-bold text-destructive">
            Encerrado
          </span>
        )}
      </div>
    </Link>
  );
}

export default function GruposPage() {
  const [grupos, setGrupos] = useState(null);
  const [erroLista, setErroLista] = useState(false);
  const [mensagem, setMensagem] = useState(null); // { tipo: 'ok' | 'erro', texto }
  const [formAberto, setFormAberto] = useState(false);
  const [entrarAberto, setEntrarAberto] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch('/api/grupos');
      if (!r.ok) throw new Error('falha');
      setGrupos(await r.json());
      setErroLista(false);
    } catch {
      setErroLista(true);
      setGrupos((atual) => atual ?? []);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(() => setMensagem(null), 8000);
    return () => clearTimeout(t);
  }, [mensagem]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary">Grupos de Estudo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estude com a turma e acompanhe o ranking de horas.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEntrarAberto(true)}
            className="flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent"
          >
            <LogIn className="h-4 w-4" /> Entrar com código
          </button>
          <button
            type="button"
            onClick={() => setFormAberto(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Novo grupo
          </button>
        </div>
      </div>

      {mensagem && (
        <div
          role="status"
          className={`rounded-xl p-3 text-sm font-medium ${
            mensagem.tipo === 'ok'
              ? 'bg-green-50 text-green-700'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {mensagem.texto}
        </div>
      )}
      {erroLista && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          Não foi possível carregar seus grupos. Recarregue a página.
        </div>
      )}

      {grupos === null ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>
      ) : grupos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-10 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-semibold text-foreground">Você ainda não participa de nenhum grupo.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie um grupo novo ou entre em um com o código de convite.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {grupos.map((g) => (
            <GrupoCard key={g.id} grupo={g} />
          ))}
        </div>
      )}

      {formAberto && (
        <GrupoFormModal
          onFechar={() => setFormAberto(false)}
          onSalva={(dados) => {
            setMensagem({
              tipo: 'ok',
              texto: `Grupo criado! Código de convite: ${dados.codigo_convite}`,
            });
            carregar();
          }}
        />
      )}

      {entrarAberto && (
        <EntrarGrupoModal
          onFechar={() => setEntrarAberto(false)}
          onEntrou={(texto) => {
            setMensagem({ tipo: 'ok', texto });
            carregar();
          }}
        />
      )}
    </section>
  );
}