'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Crown,
  Lock,
  LogOut,
  Pencil,
  RotateCcw,
  Trophy,
  Users,
} from 'lucide-react';
import InviteBadge from '@/components/InviteBadge';
import GrupoFormModal from '@/components/GrupoFormModal';
import { useTimer } from '@/components/TimerProvider';
import { PERIODOS_RANKING, calcularPosicoes, dataBR, formatarMinutos } from '@/lib/ranking';

const ATUALIZAR_A_CADA_MS = 30_000;

const btnBase =
  'flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

function corDaPosicao(posicao) {
  if (posicao === 1) return 'bg-amber-100 text-amber-700';
  if (posicao === 2) return 'bg-slate-200 text-slate-600';
  if (posicao === 3) return 'bg-orange-100 text-orange-700';
  return 'bg-secondary text-muted-foreground';
}

export default function GrupoDetalhe({ grupoId }) {
  const router = useRouter();
  const { estado } = useTimer();
  const sessaoId = estado.sessaoId; // muda quando você inicia, salva ou descarta um timer

  const [grupo, setGrupo] = useState(null);
  const [erro, setErro] = useState('');

  const [periodo, setPeriodo] = useState('semanal');
  const [ranking, setRanking] = useState(null); // { periodo, linhas }
  const [erroRanking, setErroRanking] = useState(false);

  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(null); // 'sair' | 'encerrar' | null
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState(null); // { tipo: 'ok' | 'erro', texto }

  // Dados do grupo
  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const r = await fetch(`/api/grupos/${grupoId}`);
        const dados = await r.json().catch(() => ({}));
        if (!ativo) return;
        if (!r.ok) {
          setErro(dados.erro || `Não foi possível carregar o grupo (erro ${r.status}).`);
          return;
        }
        setGrupo(dados);
      } catch {
        if (ativo) setErro('Erro de conexão. Tente novamente.');
      }
    })();

    return () => {
      ativo = false;
    };
  }, [grupoId]);

  // Ranking: carrega ao abrir, ao trocar de período, quando o seu timer muda
  // (sessaoId), quando você volta para a aba e a cada 30 segundos.
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const r = await fetch(`/api/grupos/${grupoId}/ranking?periodo=${periodo}`);
        if (!r.ok) throw new Error('falha');
        const linhas = await r.json();
        if (!ativo) return;
        setRanking({ periodo, linhas });
        setErroRanking(false);
      } catch {
        if (ativo) setErroRanking(true);
      }
    }

    function seVisivel() {
      if (document.visibilityState === 'visible') carregar();
    }

    carregar();
    const intervalo = setInterval(seVisivel, ATUALIZAR_A_CADA_MS);
    document.addEventListener('visibilitychange', seVisivel);

    return () => {
      ativo = false;
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', seVisivel);
    };
  }, [grupoId, periodo, sessaoId]);

  // Some o aviso depois de 8 segundos
  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(() => setMensagem(null), 8000);
    return () => clearTimeout(t);
  }, [mensagem]);

  async function executar(acao) {
    setProcessando(true);
    setMensagem(null);

    try {
      const r =
        acao === 'sair'
          ? await fetch(`/api/grupos/${grupoId}/sair`, { method: 'POST' })
          : await fetch(`/api/grupos/${grupoId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nome: grupo.nome,
                descricao: grupo.descricao ?? '',
                status_ativo: acao === 'reativar',
              }),
            });
      const dados = await r.json().catch(() => ({}));

      if (!r.ok) {
        setMensagem({ tipo: 'erro', texto: dados.erro || 'Algo deu errado. Tente novamente.' });
        setConfirmando(null);
        return;
      }

      if (acao === 'sair') {
        router.replace('/grupos');
        return;
      }

      setGrupo(dados);
      setConfirmando(null);
      setMensagem({
        tipo: 'ok',
        texto:
          acao === 'encerrar'
            ? 'Grupo encerrado. Ninguém novo consegue entrar.'
            : 'Grupo reativado. Novos membros podem entrar de novo.',
      });
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' });
      setConfirmando(null);
    } finally {
      setProcessando(false);
    }
  }

  const voltar = (
    <Link
      href="/grupos"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Meus grupos
    </Link>
  );

  if (erro) {
    return (
      <section className="space-y-6">
        {voltar}
        <div className="rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {erro}
        </div>
      </section>
    );
  }

  if (!grupo) {
    return (
      <section className="space-y-6">
        {voltar}
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>
      </section>
    );
  }

  const linhas = ranking?.periodo === periodo ? ranking.linhas : null;
  const posicoes = linhas ? calcularPosicoes(linhas) : [];
  const sozinho = grupo.total_membros === 1;

  return (
    <section className="space-y-6">
      {voltar}

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

      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{grupo.nome}</h1>
            {!grupo.status_ativo && (
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-bold text-destructive">
                Encerrado
              </span>
            )}
          </div>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {grupo.descricao || 'Sem descrição.'}
          </p>
          {!grupo.status_ativo && (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Este grupo não aceita novos membros.
            </p>
          )}
        </div>
        {grupo.status_ativo && <InviteBadge codigo={grupo.codigo_convite} />}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm lg:col-span-2">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Trophy className="h-5 w-5 text-amber-500" /> Ranking
            </h2>

            <div
              role="tablist"
              aria-label="Período do ranking"
              className="flex gap-1 rounded-xl bg-secondary p-1"
            >
              {PERIODOS_RANKING.map((p) => (
                <button
                  key={p.valor}
                  type="button"
                  role="tab"
                  aria-selected={periodo === p.valor}
                  onClick={() => setPeriodo(p.valor)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                    periodo === p.valor
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.rotulo}
                </button>
              ))}
            </div>
          </div>

          {erroRanking && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
              Não foi possível atualizar o ranking. Vamos tentar de novo em instantes.
            </div>
          )}

          {linhas === null ? (
            !erroRanking && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Carregando ranking...
              </p>
            )
          ) : (
            <ol role="tabpanel" className="space-y-2">
              {linhas.map((m, i) => (
                <li
                  key={m.id}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${
                    m.eh_voce ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-background'
                  }`}
                >
                  <span
                    aria-label={posicoes[i] ? `${posicoes[i]}º lugar` : 'Sem posição'}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${corDaPosicao(
                      posicoes[i]
                    )}`}
                  >
                    {posicoes[i] ?? '–'}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <span className="truncate">{m.nome}</span>
                      {m.eh_voce && (
                        <span className="shrink-0 text-[10px] font-bold text-primary">(você)</span>
                      )}
                      {m.papel === 'Administrador' && (
                        <Crown
                          className="h-3 w-3 shrink-0 text-amber-500"
                          aria-label="Administrador"
                        />
                      )}
                    </p>
                    {m.esta_estudando && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <BookOpen className="h-3 w-3" /> Focado agora
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                    {formatarMinutos(m.total_minutos)}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <p className="mt-4 text-[11px] text-muted-foreground">
            O ranking soma as sessões já salvas e se atualiza sozinho a cada 30 segundos. “Focado
            agora” aparece para quem tem um timer aberto, mesmo em pausa.
          </p>
        </div>

        <aside className="space-y-6 lg:col-span-1">
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-foreground">Resumo do Grupo</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-4 w-4" /> Membros
                </dt>
                <dd className="font-bold text-foreground">{grupo.total_membros}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Seu papel</dt>
                <dd
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    grupo.is_admin ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {grupo.is_admin && <Crown className="h-3 w-3" />}
                  {grupo.papel}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Criado em</dt>
                <dd className="font-bold text-foreground">{dataBR(grupo.data_criacao)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
            {confirmando ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">
                  {confirmando === 'encerrar'
                    ? 'Encerrar o grupo? Ninguém novo poderá entrar, mas o ranking e os membros continuam. Você pode reativar depois.'
                    : sozinho
                    ? 'Você é o último membro. Se sair, o grupo será apagado.'
                    : grupo.is_admin
                    ? 'Sair do grupo? O membro mais antigo passa a ser o administrador. Suas horas de estudo continuam salvas.'
                    : 'Sair do grupo? Suas horas de estudo continuam salvas.'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmando(null)}
                    disabled={processando}
                    className={`${btnBase} flex-1 justify-center bg-secondary text-secondary-foreground hover:bg-accent`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => executar(confirmando)}
                    disabled={processando}
                    className={`${btnBase} flex-1 justify-center bg-destructive text-white hover:bg-destructive/90`}
                  >
                    {processando ? 'Aguarde...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {grupo.is_admin && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditando(true)}
                      className={`${btnBase} justify-center bg-secondary text-secondary-foreground hover:bg-accent`}
                    >
                      <Pencil className="h-4 w-4" /> Editar grupo
                    </button>
                    {grupo.status_ativo ? (
                      <button
                        type="button"
                        onClick={() => setConfirmando('encerrar')}
                        className={`${btnBase} justify-center bg-secondary text-secondary-foreground hover:bg-accent`}
                      >
                        <Lock className="h-4 w-4" /> Encerrar grupo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => executar('reativar')}
                        disabled={processando}
                        className={`${btnBase} justify-center bg-secondary text-secondary-foreground hover:bg-accent`}
                      >
                        <RotateCcw className="h-4 w-4" /> {processando ? 'Aguarde...' : 'Reativar grupo'}
                      </button>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmando('sair')}
                  className={`${btnBase} justify-center bg-destructive/10 text-destructive hover:bg-destructive/20`}
                >
                  <LogOut className="h-4 w-4" /> Sair do grupo
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {editando && (
        <GrupoFormModal
          grupo={grupo}
          onFechar={() => setEditando(false)}
          onSalva={(dados) => {
            setGrupo(dados);
            setMensagem({ tipo: 'ok', texto: 'Grupo atualizado.' });
          }}
        />
      )}
    </section>
  );
}