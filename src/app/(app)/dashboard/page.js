'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/components/UserProvider';
import { hojeLocal } from '@/lib/datas';
import SubjectList from '@/components/SubjectList';
import TaskForm from '@/components/TaskForm';
import Planejamento from '@/components/Planejamento';
import AtividadeModal from '@/components/AtividadeModal';
import DisciplinaFormModal from '@/components/DisciplinaFormModal';
import DisciplinaDetalheModal from '@/components/DisciplinaDetalheModal';
import EntrarDisciplinaModal from '@/components/EntrarDisciplinaModal';
import SmartTimer from '@/components/SmartTimer';
import BibliotecaCard from '@/components/BibliotecaCard';

export default function DashboardPage() {
  const usuario = useUser();

  const [disciplinas, setDisciplinas] = useState(null);
  const [erroDisciplinas, setErroDisciplinas] = useState(false);
  const [atividades, setAtividades] = useState(null);
  const [erroAtividades, setErroAtividades] = useState(false);
  const [hoje, setHoje] = useState(null);
  const [mensagem, setMensagem] = useState(null); // { tipo: 'ok' | 'erro', texto }

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [modalEntrar, setModalEntrar] = useState(false);
  const [detalheId, setDetalheId] = useState(null);
  const [atividadeAberta, setAtividadeAberta] = useState(null);

  const avisar = (texto) => setMensagem({ tipo: 'ok', texto });
  const falhar = (texto) => setMensagem({ tipo: 'erro', texto });

  const carregarDisciplinas = useCallback(async () => {
    try {
      const r = await fetch('/api/disciplinas');
      if (!r.ok) throw new Error('falha');
      setDisciplinas(await r.json());
      setErroDisciplinas(false);
    } catch {
      setErroDisciplinas(true);
      setDisciplinas((atual) => atual ?? []);
    }
  }, []);

  const carregarAtividades = useCallback(async () => {
    try {
      const r = await fetch('/api/atividades');
      if (!r.ok) throw new Error('falha');
      setAtividades(await r.json());
      setHoje(hojeLocal());
      setErroAtividades(false);
    } catch {
      setErroAtividades(true);
      setAtividades((atual) => atual ?? []);
    }
  }, []);

  useEffect(() => {
    carregarDisciplinas();
    carregarAtividades();
  }, [carregarDisciplinas, carregarAtividades]);
  // O sino de convites avisa quando uma atividade foi aceita.
  useEffect(() => {
    window.addEventListener('unistudy:atividades', carregarAtividades);
    return () => window.removeEventListener('unistudy:atividades', carregarAtividades);
  }, [carregarAtividades]);

  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(() => setMensagem(null), 8000);
    return () => clearTimeout(t);
  }, [mensagem]);

  async function mudarStatus(id, novoStatus) {
    const statusAnterior = atividades?.find((a) => a.id === id)?.status;
    if (!statusAnterior) return;

    // Atualiza na hora; se a API falhar, volta ao status anterior.
    setAtividades((lista) =>
      lista.map((a) => (a.id === id ? { ...a, status: novoStatus } : a))
    );

    try {
      const r = await fetch(`/api/atividades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!r.ok) throw new Error('falha');
    } catch {
      setAtividades((lista) =>
        lista.map((a) => (a.id === id ? { ...a, status: statusAnterior } : a))
      );
      falhar('Não foi possível mover a atividade. Tente novamente.');
    }
  }

  async function limparConcluidas() {
    try {
      const r = await fetch('/api/atividades/limpar-concluidas', { method: 'POST' });
      if (!r.ok) throw new Error('falha');
      setAtividades((lista) => lista.filter((a) => a.status !== 'Concluído'));
      avisar('Atividades concluídas escondidas do quadro.');
    } catch {
      falhar('Não foi possível limpar o quadro. Tente novamente.');
    }
  }

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
      {(erroDisciplinas || erroAtividades) && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">
          Não foi possível carregar todos os dados. Recarregue a página.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="space-y-6 lg:col-span-1">
          <TaskForm disciplinas={disciplinas} onCriada={carregarAtividades} />
          <SmartTimer atividades={atividades} />
        </aside>

        <div className="space-y-6 lg:col-span-3">
            <Planejamento
            atividades={atividades}
            hoje={hoje}
            onMudarStatus={mudarStatus}
            onEditar={setAtividadeAberta}
            onLimpar={limparConcluidas}
          />

          <SubjectList
            disciplinas={disciplinas}
            onNova={() => {
              setEditando(null);
              setFormAberto(true);
            }}
            onEntrar={() => setModalEntrar(true)}
            onSelecionar={(d) => setDetalheId(d.id)}
          />
          <BibliotecaCard disciplinas={disciplinas} />
        </div>
      </div>

      {atividadeAberta && (
        <AtividadeModal
          key={atividadeAberta.id}
          atividade={atividadeAberta}
          onFechar={() => setAtividadeAberta(null)}
          onAtualizada={carregarAtividades}
          onRemovida={(id) => {
            setAtividades((lista) => lista.filter((a) => a.id !== id));
            avisar('Atividade removida do seu quadro.');
          }}
        />
      )}

      {formAberto && (
        <DisciplinaFormModal
          key={editando?.id ?? 'nova'}
          disciplina={editando}
          onFechar={() => setFormAberto(false)}
          onSalva={(dados, modo) => {
            avisar(
              modo === 'criada'
                ? `Disciplina criada! Código de convite: ${dados.codigo_compartilhamento}`
                : 'Disciplina atualizada.'
            );
            carregarDisciplinas();
            carregarAtividades();
          }}
        />
      )}

      {detalheId !== null && (
        <DisciplinaDetalheModal
          key={detalheId}
          disciplinaId={detalheId}
          onAbrirAtividade={(a) => {
            setDetalheId(null);
            setAtividadeAberta(a);
          }}
          onFechar={() => setDetalheId(null)}
          onEditar={(d) => {
            setDetalheId(null);
            setEditando(d);
            setFormAberto(true);
          }}
          onAlterada={(texto) => {
            avisar(texto);
            carregarDisciplinas();
            carregarAtividades();
          }}
        />
      )}

      <EntrarDisciplinaModal
        aberto={modalEntrar}
        onFechar={() => setModalEntrar(false)}
        onEntrou={(texto) => {
          avisar(texto);
          carregarDisciplinas();
        }}
      />
    </section>
  );
}