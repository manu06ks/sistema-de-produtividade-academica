'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import FormularioPlano from '@/components/FormularioPlano';
import UsoIA from '@/components/UsoIA';
import ListaPlanos from '@/components/ListaPlanos';
import PlanoDetalhe from '@/components/PlanoDetalhe';

const MAX_NA_LISTA = 30; // o mesmo limite da API

async function lerJson(resposta) {
  try {
    return await resposta.json();
  } catch {
    return null;
  }
}

export default function PlanosView() {
  const [dados, setDados] = useState(null); // { planos, uso, hoje } da API
  const [disciplinas, setDisciplinas] = useState(null); // [{ id, nome, cor, ... }]
  const [erro, setErro] = useState(null); // null | { sessaoExpirou: boolean }
  const [tentativa, setTentativa] = useState(0); // aumenta no botão "Tentar de novo"
  const [aberto, setAberto] = useState(null); // { id, plano, carregando, erro }
  const [aviso, setAviso] = useState('');
  const pedidoAbrir = useRef(0); // numera os pedidos de "abrir plano" para ignorar respostas atrasadas
  const vivo = useRef(true);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const carregarLista = useCallback(async () => {
    try {
      const r = await fetch('/api/planos');
      if (r.status === 401) {
        if (vivo.current) setErro({ sessaoExpirou: true });
        return;
      }
      if (!r.ok) throw new Error('falha');
      const corpo = await r.json();
      if (!vivo.current) return;
      setDados(corpo);
      setErro(null);
    } catch {
      if (vivo.current) setErro({ sessaoExpirou: false });
    }
  }, []);

  const carregarDisciplinas = useCallback(async () => {
    try {
      const r = await fetch('/api/disciplinas');
      if (r.status === 401) {
        if (vivo.current) setErro({ sessaoExpirou: true });
        return;
      }
      if (!r.ok) throw new Error('falha');
      const corpo = await r.json();
      if (!vivo.current) return;
      setDisciplinas(Array.isArray(corpo) ? corpo : []);
    } catch {
      if (vivo.current) setErro({ sessaoExpirou: false });
    }
  }, []);

  useEffect(() => {
    carregarLista();
    carregarDisciplinas();
  }, [carregarLista, carregarDisciplinas, tentativa]);

  async function abrir(id) {
    const numero = ++pedidoAbrir.current;
    setAviso('');
    setAberto({ id, plano: null, carregando: true, erro: '' });
    try {
      const r = await fetch(`/api/planos/${id}`);
      const corpo = await lerJson(r);
      if (numero !== pedidoAbrir.current || !vivo.current) return;
      if (!r.ok) {
        setAberto({ id, plano: null, carregando: false, erro: corpo?.erro ?? 'Não foi possível abrir o plano.' });
        if (r.status === 404) carregarLista(); // o plano sumiu (apagado em outra aba, por exemplo)
        return;
      }
      setAberto({ id, plano: corpo.plano, carregando: false, erro: '' });
    } catch {
      if (numero === pedidoAbrir.current && vivo.current) {
        setAberto({ id, plano: null, carregando: false, erro: 'Não foi possível abrir o plano.' });
      }
    }
  }

  function fechar() {
    pedidoAbrir.current++; // uma resposta que ainda esteja a caminho não reabre o plano
    setAberto(null);
  }

  // O plano acabou de ser gerado: já abre, entra no topo da lista e atualiza o uso.
  function aoGerar({ plano, uso }) {
    pedidoAbrir.current++;
    setAviso('');
    setAberto({ id: plano.id, plano, carregando: false, erro: '' });
    setDados((d) => ({ ...d, uso, planos: [plano, ...(d?.planos ?? []).filter((p) => p.id !== plano.id)].slice(0, MAX_NA_LISTA) }));
  }

  async function apagar(id) {
    let r;
    try {
      r = await fetch(`/api/planos/${id}`, { method: 'DELETE' });
    } catch {
      throw new Error('Não foi possível falar com o servidor. Tente de novo.');
    }
    if (!r.ok && r.status !== 404) {
      const corpo = await lerJson(r);
      throw new Error(corpo?.erro ?? 'Não foi possível apagar o plano.');
    }
    if (!vivo.current) return;
    setDados((d) => (d ? { ...d, planos: d.planos.filter((p) => p.id !== id) } : d));
    setAberto((a) => {
      if (a?.id === id) pedidoAbrir.current++;
      return a?.id === id ? null : a;
    });
    setAviso('Plano apagado. O uso da IA dele continua contando no seu limite de hoje.');
    carregarLista();
  }

  const carregando = !erro && (dados === null || disciplinas === null);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Planos de estudo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Peça à IA um plano dia a dia para uma prova, uma entrega ou qualquer meta.
        </p>
      </div>

      {erro && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive sm:flex-row sm:items-center"
        >
          <span>
            {erro.sessaoExpirou ? (
              <>
                Sua sessão expirou.{' '}
                <Link href="/" className="underline">
                  Entre de novo
                </Link>
                .
              </>
            ) : (
              'Não foi possível carregar os planos.'
            )}
          </span>
          {!erro.sessaoExpirou && (
            <button
              type="button"
              onClick={() => setTentativa((n) => n + 1)}
              className="self-start rounded-lg border border-destructive/30 px-3 py-1 text-xs font-bold hover:bg-destructive/10"
            >
              Tentar de novo
            </button>
          )}
        </div>
      )}

      {aviso && (
        <p role="status" className="rounded-xl bg-primary/5 p-3 text-xs font-medium text-foreground">
          {aviso}
        </p>
      )}

      {carregando && <p className="py-16 text-center text-sm text-muted-foreground">Carregando planos...</p>}

      {dados && disciplinas && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            <div className="min-w-0 lg:col-span-2">
              <FormularioPlano
                disciplinas={disciplinas}
                hoje={dados.hoje}
                uso={dados.uso}
                onGerado={aoGerar}
                onFalha={carregarLista}
              />
            </div>
            <UsoIA uso={dados.uso} />
          </div>

          {aberto && <PlanoDetalhe aberto={aberto} hoje={dados.hoje} onFechar={fechar} />}

          <ListaPlanos planos={dados.planos} abertoId={aberto?.id ?? null} onAbrir={abrir} onApagar={apagar} />
        </>
      )}
    </div>
  );
}