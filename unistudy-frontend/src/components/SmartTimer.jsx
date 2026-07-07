import { useContext } from 'react';
import { Play, Pause, Save, Coffee, Sandwich, Square } from 'lucide-react';
import { TimerContext } from '../contexts/TimerContext'; // Ajuste o caminho se necessário

export default function SmartTimer({ tarefas, token }) {
  // Consumindo os estados globais em vez de criar estados locais
  const {
    timeElapsed, setTimeElapsed,
    timeLeft, setTimeLeft,
    isTimerActive, setIsTimerActive,
    timerMode, setTimerMode,
    tarefaSelecionadaTimer, setTarefaSelecionadaTimer
  } = useContext(TimerContext);

  const formatTime = (sec) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  const atualizarStatusAoVivo = async (status) => {
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/usuarios/status-estudo`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ esta_estudando: status })
    });
  } catch (e) { console.error("Erro ao avisar backend:", e); }
  };

  const iniciarFoco = () => { 
    if (!tarefaSelecionadaTimer) return alert("Selecione uma tarefa!"); 
    setTimerMode('foco'); 
    setIsTimerActive(true); 
    atualizarStatusAoVivo(true);
  };
  
  const iniciarPausa = (min) => { 
    setTimerMode('pausa'); 
    setTimeLeft(min * 60); 
    setIsTimerActive(true); 
  };

  const finalizarSessaoEstudo = async () => {
    if (timeElapsed === 0) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/sessoes-estudo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tarefa_id: tarefaSelecionadaTimer, duracao_segundos: timeElapsed })
      });
      alert(`Sessão de ${formatTime(timeElapsed)} salva! 🚀`);
      atualizarStatusAoVivo(false);
      // Reseta os estados globais após salvar
      setTimeElapsed(0); 
      setIsTimerActive(false); 
      setTimerMode('foco');
      setTarefaSelecionadaTimer('');
    } catch (e) { console.error("Erro ao salvar sessão:", e); }
  };

  return (
    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 flex flex-col items-center relative overflow-hidden">
      <h3 className="font-bold text-sm text-foreground mb-5 tracking-tight">Smart Timer</h3>

      {timerMode === 'foco' && (
        <div className="w-full mb-5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block text-center">
            Focar em qual tarefa?
          </label>
          <select
            value={tarefaSelecionadaTimer}
            onChange={(e) => setTarefaSelecionadaTimer(e.target.value)}
            disabled={isTimerActive || timeElapsed > 0}
            className="w-full bg-input/50 border border-border/60 text-foreground rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Selecione...</option>
            {tarefas
              ?.filter(t => {
                const ativa = t.status !== 'concluida' && t.status !== 'arquivada';
                if (t.data_entrega) {
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  const dataLimpa = t.data_entrega.substring(0, 10);
                  const entrega = new Date(dataLimpa + 'T00:00:00');
                  return ativa && entrega >= hoje;
                }
                return ativa;
              })
              .map(t => (
                <option key={t.id} value={t.id}>
                  [{t.materia_nome}] {t.tipo === 'prova' ? '🚨 ' : ''}{t.titulo}
                </option>
              ))
            }
          </select>
        </div>
      )}

      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        {timerMode === 'foco' ? 'Tempo Decorrido' : 'Pausa Ativa'}
      </div>
      <div className={`text-5xl font-mono font-black tracking-tighter mb-7 transition-colors duration-300 ${timerMode === 'pausa' ? 'text-muted-foreground' : 'text-primary'}`}>
        {timerMode === 'foco' ? formatTime(timeElapsed) : formatTime(timeLeft)}
      </div>

      <div className="flex flex-col gap-2.5 w-full">
        {timerMode === 'foco' && (
          <>
            {!isTimerActive && timeElapsed === 0 && (
              <button
                onClick={iniciarFoco}
                className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <Play className="size-4" /> Iniciar Estudo
              </button>
            )}
            {isTimerActive && (
              <button
                onClick={() => setIsTimerActive(false)}
                className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-[0.98] transition-all"
              >
                <Pause className="size-4" /> Pausar
              </button>
            )}
            {!isTimerActive && timeElapsed > 0 && (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsTimerActive(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 font-bold py-3 rounded-xl text-xs bg-secondary text-secondary-foreground hover:bg-accent active:scale-[0.98] transition-all"
                  >
                    <Play className="size-3.5" /> Retomar
                  </button>
                  <button
                    onClick={finalizarSessaoEstudo}
                    className="flex-1 flex items-center justify-center gap-1.5 font-bold py-3 rounded-xl text-xs bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 active:scale-[0.98] transition-all"
                  >
                    <Save className="size-3.5" /> Salvar
                  </button>
                </div>
                <div className="w-full h-px bg-border/60 my-1" />
                <div className="flex gap-2">
                  <button
                    onClick={() => iniciarPausa(5)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.98] transition-all"
                  >
                    <Coffee className="size-3.5" /> Pausa 5m
                  </button>
                  <button
                    onClick={() => iniciarPausa(15)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.98] transition-all"
                  >
                    <Sandwich className="size-3.5" /> Pausa 15m
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {timerMode === 'pausa' && (
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setIsTimerActive(!isTimerActive)}
              className="flex-1 flex items-center justify-center gap-1.5 font-bold py-3 rounded-xl text-xs bg-secondary text-secondary-foreground hover:bg-accent active:scale-[0.98] transition-all"
            >
              {isTimerActive ? <><Pause className="size-3.5" /> Pausar</> : <><Play className="size-3.5" /> Retomar</>}
            </button>
            <button
              onClick={() => { setTimerMode('foco'); setIsTimerActive(false); }}
              className="flex-1 flex items-center justify-center gap-1.5 font-bold py-3 rounded-xl text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-[0.98] transition-all"
            >
              <Square className="size-3.5" /> Encerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}