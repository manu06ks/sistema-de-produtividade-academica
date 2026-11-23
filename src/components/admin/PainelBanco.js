'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Database, Loader2, Play, Plus, Trash2 } from 'lucide-react';
import { botaoPerigo, botaoPrimario, botaoSecundario, classeCartao } from './api';

const ACOES = {
  criar: { rotulo: 'Criar tabelas', executando: 'Criando as tabelas...' },
  carregar: { rotulo: 'Carregar dados', executando: 'Carregando os dados...' },
  eliminar: { rotulo: 'Eliminar todas as tabelas', executando: 'Eliminando as tabelas...' },
  recriar: { rotulo: 'Recriar do zero', executando: 'Recriando o banco...' },
};

export default function PainelBanco({ api, status, demo, aoAtualizar }) {
  const [executando, setExecutando] = useState(null);
  const [confirmando, setConfirmando] = useState(null); // 'eliminar' | 'recriar'
  const [mensagem, setMensagem] = useState(null); // { tipo: 'ok' | 'erro', texto }

  const banco = status?.banco;
  const nenhuma = banco?.criadas === 0;
  const completo = banco?.criadas === banco?.total;
  const vazio = banco?.totalLinhas === 0;

  async function rodar(acao) {
    setExecutando(acao);
    setMensagem(null);
    setConfirmando(null);
    try {
      const r = await api('/banco', { metodo: 'POST', corpo: { acao, confirmar: true } });
      setMensagem({ tipo: 'ok', texto: r.mensagem, mostrarLogin: acao === 'carregar' || acao === 'recriar' });
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: e.message });
    } finally {
      await aoAtualizar();
      setExecutando(null);
    }
  }

  const ocupado = executando !== null;
  const opcoes = [
    {
      id: 'criar',
      icone: Plus,
      titulo: 'Criar tabelas',
      texto: 'Executa o script DDL em um banco vazio: a função auxiliar, as 13 tabelas, as restrições e os índices.',
      desabilitado: banco ? !nenhuma : true,
      motivo: banco && !nenhuma ? 'As tabelas já existem.' : null,
      classe: botaoPrimario,
    },
    {
      id: 'carregar',
      icone: Database,
      titulo: 'Carregar dados',
      texto: 'Insere os dados de demonstração. Com eles, as 3 consultas devolvem os resultados do relatório.',
      desabilitado: banco ? !(completo && vazio) : true,
      motivo: banco && !completo ? 'Crie as tabelas primeiro.' : banco && !vazio ? 'As tabelas já têm dados.' : null,
      classe: botaoPrimario,
    },
    {
      id: 'eliminar',
      icone: Trash2,
      titulo: 'Eliminar todas as tabelas',
      texto: 'Apaga as 13 tabelas e todos os dados delas. Não afeta outras tabelas do banco.',
      desabilitado: banco ? nenhuma : true,
      motivo: banco && nenhuma ? 'Não há tabelas para eliminar.' : null,
      classe: botaoPerigo,
      destrutiva: true,
    },
    {
      id: 'recriar',
      icone: Play,
      titulo: 'Recriar do zero',
      texto: 'Elimina, cria e carrega em uma única transação. Útil para voltar ao estado inicial da demonstração.',
      desabilitado: !banco,
      motivo: null,
      classe: botaoSecundario,
      destrutiva: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Banco de dados</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cria as tabelas a partir de um banco vazio, carrega valores pré-definidos e elimina tudo quando preciso.
        </p>
      </div>

      {mensagem && (
        <div
          role={mensagem.tipo === 'erro' ? 'alert' : 'status'}
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
            mensagem.tipo === 'erro'
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-emerald-300 bg-emerald-50 text-emerald-900'
          }`}
        >
          {mensagem.tipo === 'erro' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p>{mensagem.texto}</p>
            {mensagem.tipo === 'ok' && mensagem.mostrarLogin && demo && (
              <p className="mt-1 font-normal">
                Login de demonstração no sistema: <strong>{demo.email}</strong> · senha <strong>{demo.senha}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {opcoes.map((o) => {
          const Icone = o.icone;
          const emConfirmacao = confirmando === o.id;
          return (
            <section key={o.id} className={classeCartao}>
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <Icone className="h-4 w-4 text-primary" aria-hidden="true" />
                {o.titulo}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{o.texto}</p>
              {o.motivo && <p className="mt-2 text-xs font-medium text-muted-foreground">{o.motivo}</p>}
              <div className="mt-4">
                {emConfirmacao ? (
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-destructive/10 p-3">
                    <span className="text-sm font-semibold text-destructive">
                      {o.id === 'eliminar' ? 'Apagar todas as tabelas e dados?' : 'Apagar tudo e recriar o banco?'}
                    </span>
                    <button className={botaoPerigo} onClick={() => rodar(o.id)} disabled={ocupado}>
                      Sim, continuar
                    </button>
                    <button className={botaoSecundario} onClick={() => setConfirmando(null)} disabled={ocupado}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    className={o.classe}
                    disabled={o.desabilitado || ocupado}
                    onClick={() => (o.destrutiva ? setConfirmando(o.id) : rodar(o.id))}
                  >
                    {executando === o.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> {ACOES[o.id].executando}
                      </>
                    ) : (
                      ACOES[o.id].rotulo
                    )}
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <section className={classeCartao}>
        <h3 className="mb-3 text-base font-bold text-foreground">Situação atual</h3>
        {!banco ? (
          <p className="text-sm text-muted-foreground">Sem conexão com o banco.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {banco.criadas} de {banco.total} tabelas criadas · {banco.totalLinhas} registros no total
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {banco.tabelas.map((t) => (
                <li
                  key={t.nome}
                  className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-foreground">{t.titulo}</span>
                  <span className={t.existe ? 'tabular-nums text-muted-foreground' : 'text-xs font-semibold text-destructive'}>
                    {t.existe ? `${t.linhas} linhas` : 'não existe'}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
