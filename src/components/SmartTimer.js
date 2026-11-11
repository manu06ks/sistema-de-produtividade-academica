'use client';

import { useEffect, useState } from 'react';
import { Play, Pause, Save, Coffee, Sandwich, Square, Trash2, X } from 'lucide-react';
import { useTimer } from '@/components/TimerProvider';
import { formatarTempo } from '@/lib/timer';

const ESTILO_MENSAGEM = {
  ok: 'bg-green-50 text-green-700',
  info: 'bg-secondary text-secondary-foreground',
  erro: 'bg-destructive/10 text-destructive',
};

export default function SmartTimer({ atividades }) {
  const timer = useTimer();
  const { estado, pronto, segundosFoco, segundosDescanso, aviso } = timer;

  const [escolhida, setEscolhida] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState(null); // { tipo: 'ok' | 'info' | 'erro', texto }
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);

  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(() => setMensagem(null), 8000);
    return () => clearTimeout(t);
  }, [mensagem]);

  const temSessao = estado.sessaoId !== null;
  const emFoco = estado.modo === 'foco';
  const focoCorrendo = estado.retomadoEm !== null;
  const descansoCorrendo = estado.pausaFimEm !== null;

  // Atividades do quadro que ainda dá para estudar (as atrasadas também).
  const disponiveis = (atividades ?? []).filter((a) => a.status !== 'Concluído');
  const alvo = disponiveis.find((a) => String(a.id) === escolhida) ?? null;

  async function iniciar() {
    if (!alvo) return;
    setOcupado(true);
    const r = await timer.iniciar(alvo);
    setOcupado(false);
    if (r.ok) {
      setEscolhida('');
      setMensagem(null);
    } else {
      setMensagem({ tipo: 'erro', texto: r.erro });
    }
  }

  async function salvar() {
    setOcupado(true);
    const r = await timer.salvar();
    setOcupado(false);
    setConfirmandoDescarte(false);
    if (!r.ok) {
      setMensagem({ tipo: 'erro', texto: r.erro });
    } else if (r.gravada) {
      setMensagem({
        tipo: 'ok',
        texto: `Sessão de ${r.minutos} ${r.minutos === 1 ? 'minuto salva' : 'minutos salva'}!`,
      });
    } else {
      setMensagem({ tipo: 'info', texto: 'Sessões com menos de 1 minuto não são salvas.' });
    }
  }

  async function descartar() {
    setOcupado(true);
    const r = await timer.descartar();
    setOcupado(false);
    setConfirmandoDescarte(false);
    if (r.ok) setMensagem({ tipo: 'info', texto: 'Sessão descartada.' });
    else setMensagem({ tipo: 'erro', texto: r.erro });
  }

  const botao =
    'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
      <h3 className="mb-5 text-sm font-bold tracking-tight text-foreground">Smart Timer</h3>

      {aviso && (
        <div
          role="status"
          className="mb-4 flex w-full items-start gap-2 rounded-xl bg-secondary p-3 text-xs font-medium text-secondary-foreground"
        >
          <span className="flex-1">{aviso}</span>
          <button
            onClick={timer.limparAviso}
            aria-label="Fechar aviso"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {!pronto ? (
        <p className="py-10 text-xs text-muted-foreground">Carregando timer...</p>
      ) : (
        <>
          {/* Escolha da atividade (só antes de iniciar) */}
          {!temSessao && (
            <div className="mb-5 w-full">
              <label
                htmlFor="timer-atividade"
                className="mb-1.5 block text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                Focar em qual atividade?
              </label>
              <select
                id="timer-atividade"
                value={escolhida}
                onChange={(e) => setEscolhida(e.target.value)}
                disabled={ocupado}
                className="w-full rounded-xl border border-border/60 bg-input/50 p-3 text-sm font-medium text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              >
                <option value="">Selecione...</option>
                {disponiveis.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.disciplina_nome}] {a.tipo_atividade === 'Prova' ? '🚨 ' : ''}
                    {a.titulo}
                  </option>
                ))}
              </select>
              {atividades && disponiveis.length === 0 && (
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Nenhuma atividade em aberto. Crie uma ao lado para estudar.
                </p>
              )}
            </div>
          )}

          {/* Atividade em foco (depois de iniciar) */}
          {temSessao && (
            <p className="mb-4 flex max-w-full items-center gap-2 text-center text-xs font-semibold text-foreground">
              <span
                aria-hidden="true"
                className="inline-block size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: estado.disciplinaCor }}
              />
              <span className="truncate">
                [{estado.disciplinaNome}] {estado.titulo}
              </span>
            </p>
          )}

          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {!emFoco ? 'Descanso' : temSessao && !focoCorrendo ? 'Em pausa' : 'Tempo focado'}
          </div>
          <div
            role="timer"
            className={`mb-7 font-mono text-5xl font-black tracking-tighter transition-colors duration-300 ${
              emFoco ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {formatarTempo(emFoco ? segundosFoco : segundosDescanso)}
          </div>

          <div className="flex w-full flex-col gap-2.5">
            {/* 1. Ainda sem sessão */}
            {!temSessao && (
              <button
                onClick={iniciar}
                disabled={!alvo || ocupado}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="size-4" /> {ocupado ? 'Iniciando...' : 'Iniciar Estudo'}
              </button>
            )}

            {/* 2. Foco correndo */}
            {temSessao && emFoco && focoCorrendo && (
              <button
                onClick={timer.pausar}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-sm font-bold text-destructive transition-all hover:bg-destructive/20 active:scale-[0.98]"
              >
                <Pause className="size-4" /> Pausar
              </button>
            )}

            {/* 3. Foco parado: retomar, salvar, descansar, descartar */}
            {temSessao && emFoco && !focoCorrendo && (
              <div className="flex w-full flex-col gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={timer.retomar}
                    disabled={ocupado}
                    className={`${botao} bg-secondary text-secondary-foreground hover:bg-accent`}
                  >
                    <Play className="size-3.5" /> Retomar
                  </button>
                  <button
                    onClick={salvar}
                    disabled={ocupado}
                    className={`${botao} bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25`}
                  >
                    <Save className="size-3.5" /> {ocupado ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>

                <div className="my-1 h-px w-full bg-border/60" />

                <div className="flex gap-2">
                  <button
                    onClick={() => timer.comecarDescanso(5)}
                    disabled={ocupado}
                    className={`${botao} bg-primary/10 py-2.5 text-[11px] text-primary hover:bg-primary/20`}
                  >
                    <Coffee className="size-3.5" /> Pausa 5m
                  </button>
                  <button
                    onClick={() => timer.comecarDescanso(15)}
                    disabled={ocupado}
                    className={`${botao} bg-primary/10 py-2.5 text-[11px] text-primary hover:bg-primary/20`}
                  >
                    <Sandwich className="size-3.5" /> Pausa 15m
                  </button>
                </div>

                {!confirmandoDescarte ? (
                  <button
                    onClick={() => setConfirmandoDescarte(true)}
                    disabled={ocupado}
                    className="flex items-center justify-center gap-1.5 self-center text-[11px] font-semibold text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" /> Descartar sessão
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-[11px] font-semibold">
                    <span className="text-muted-foreground">Descartar o tempo desta sessão?</span>
                    <button
                      onClick={descartar}
                      disabled={ocupado}
                      className="rounded-lg bg-destructive/10 px-2.5 py-1 text-destructive hover:bg-destructive/20 disabled:opacity-50"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setConfirmandoDescarte(false)}
                      className="rounded-lg bg-secondary px-2.5 py-1 text-secondary-foreground hover:bg-accent"
                    >
                      Não
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. Descanso (pausa de 5 ou 15 minutos) */}
            {temSessao && !emFoco && (
              <div className="flex w-full gap-2">
                <button
                  onClick={descansoCorrendo ? timer.pausarDescanso : timer.retomarDescanso}
                  className={`${botao} bg-secondary text-secondary-foreground hover:bg-accent`}
                >
                  {descansoCorrendo ? (
                    <>
                      <Pause className="size-3.5" /> Pausar
                    </>
                  ) : (
                    <>
                      <Play className="size-3.5" /> Retomar
                    </>
                  )}
                </button>
                <button
                  onClick={timer.encerrarDescanso}
                  className={`${botao} bg-destructive/10 text-destructive hover:bg-destructive/20`}
                >
                  <Square className="size-3.5" /> Encerrar
                </button>
              </div>
            )}
          </div>

          {mensagem && (
            <p
              role="status"
              className={`mt-4 w-full rounded-xl p-3 text-center text-xs font-medium ${ESTILO_MENSAGEM[mensagem.tipo]}`}
            >
              {mensagem.texto}
            </p>
          )}
        </>
      )}
    </div>
  );
}