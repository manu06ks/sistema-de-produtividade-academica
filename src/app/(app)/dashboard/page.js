'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider';
import SubjectList from '@/components/SubjectList';
import DisciplinaFormModal from '@/components/DisciplinaFormModal';
import DisciplinaDetalheModal from '@/components/DisciplinaDetalheModal';
import EntrarDisciplinaModal from '@/components/EntrarDisciplinaModal';

export default function DashboardPage() {
  const usuario = useUser();

  const [disciplinas, setDisciplinas] = useState(null);
  const [erroLista, setErroLista] = useState(false);
  const [aviso, setAviso] = useState('');

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [modalEntrar, setModalEntrar] = useState(false);
  const [detalheId, setDetalheId] = useState(null);

  const carregarDisciplinas = useCallback(async () => {
    try {
      const r = await fetch('/api/disciplinas');
      if (!r.ok) throw new Error('falha');
      setDisciplinas(await r.json());
      setErroLista(false);
    } catch {
      setErroLista(true);
      setDisciplinas((atual) => atual ?? []);
    }
  }, []);

  useEffect(() => {
    carregarDisciplinas();
  }, [carregarDisciplinas]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 8000);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {usuario ? `Olá, ${usuario.nome}` : 'Olá!'}
        </h1>
        <p className="mt-1 h-5 text-sm text-muted-foreground">
          {usuario && `${usuario.curso} • ${usuario.instituicao}`}
        </p>
      </div>

      {aviso && (
        <div className="rounded-xl bg-green-50 p-3 text-sm font-medium text-green-700">
          {aviso}
        </div>
      )}
      {erroLista && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          Não foi possível carregar suas disciplinas. Recarregue a página.
        </div>
      )}

      <SubjectList
        disciplinas={disciplinas}
        onNova={() => {
          setEditando(null);
          setFormAberto(true);
        }}
        onEntrar={() => setModalEntrar(true)}
        onSelecionar={(d) => setDetalheId(d.id)}
      />

      {formAberto && (
        <DisciplinaFormModal
          key={editando?.id ?? 'nova'}
          disciplina={editando}
          onFechar={() => setFormAberto(false)}
          onSalva={(dados, modo) => {
            setAviso(
              modo === 'criada'
                ? `Disciplina criada! Código de convite: ${dados.codigo_compartilhamento}`
                : 'Disciplina atualizada.'
            );
            carregarDisciplinas();
          }}
        />
      )}

      {detalheId !== null && (
        <DisciplinaDetalheModal
          key={detalheId}
          disciplinaId={detalheId}
          onFechar={() => setDetalheId(null)}
          onEditar={(d) => {
            setDetalheId(null);
            setEditando(d);
            setFormAberto(true);
          }}
          onAlterada={(mensagem) => {
            setAviso(mensagem);
            carregarDisciplinas();
          }}
        />
      )}

      <EntrarDisciplinaModal
        aberto={modalEntrar}
        onFechar={() => setModalEntrar(false)}
        onEntrou={(mensagem) => {
          setAviso(mensagem);
          carregarDisciplinas();
        }}
      />
    </section>
  );
}