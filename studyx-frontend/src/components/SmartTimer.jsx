import { useState, useEffect } from 'react';

export default function SmartTimer({ tarefas, token, roxoPrincipal, fundoInput, fundoBotaoModal }) {
  // Estados
  const [timeElapsed, setTimeElapsed] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState('foco'); 
  const [tarefaSelecionadaTimer, setTarefaSelecionadaTimer] = useState('');

  const formatTime = (sec) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  useEffect(() => {
    let interval = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        if (timerMode === 'foco') setTimeElapsed((t) => t + 1); 
        else if (timerMode === 'pausa') setTimeLeft((t) => {
          if (t <= 1) { setIsTimerActive(false); alert("Pausa concluída!"); setTimerMode('foco'); return 0; }
          return t - 1; 
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerMode]);

  const iniciarFoco = () => { if (!tarefaSelecionadaTimer) return alert("Selecione uma tarefa!"); setTimerMode('foco'); setIsTimerActive(true); };
  const iniciarPausa = (min) => { setTimerMode('pausa'); setTimeLeft(min * 60); setIsTimerActive(true); };
  
  const finalizarSessaoEstudo = async () => {
    if (timeElapsed === 0) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/sessoes-estudo`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ tarefa_id: tarefaSelecionadaTimer, duracao_segundos: timeElapsed }) 
      });
      alert(`Sessão de ${formatTime(timeElapsed)} salva! 🚀`); 
      setTimeElapsed(0); setIsTimerActive(false); setTimerMode('foco');
    } catch(e) { console.error("Erro ao salvar sessão:", e); }
  };

  return (
    <div className="bg-[#fffdf9] rounded-xl shadow-sm p-4 flex flex-col items-center py-6 relative overflow-hidden">
      <h3 className="font-bold text-sm mb-4" style={{color: roxoPrincipal}}>Smart Timer</h3>
      {timerMode === 'foco' && (
        <div className="w-full px-4 mb-4">
            <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block text-center">Focar em qual tarefa?</label>
            <select 
            value={tarefaSelecionadaTimer} 
            onChange={(e) => setTarefaSelecionadaTimer(e.target.value)} 
            disabled={isTimerActive || timeElapsed > 0} 
            style={{backgroundColor: fundoInput}} 
            className="w-full p-2 rounded-lg text-[11px] font-bold focus:outline-none disabled:opacity-50"
            >
            <option value="">Selecione...</option>
            {tarefas
                .filter(t => {
                // 1. Remove concluídas e arquivadas
                const ativa = t.status !== 'concluida' && t.status !== 'arquivada';
                
                // 2. Remove se a data de entrega já passou de hoje
                if (t.data_entrega) {
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    
                    // PEGA APENAS OS 10 PRIMEIROS CARACTERES (AAAA-MM-DD)
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
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{timerMode === 'foco' ? 'Tempo Decorrido' : 'Pausa Ativa'}</div>
      <div className="text-5xl font-extrabold mb-6 tracking-tight transition-colors duration-300" style={{color: timerMode === 'pausa' ? '#9ca3af' : roxoPrincipal}}>{timerMode === 'foco' ? formatTime(timeElapsed) : formatTime(timeLeft)}</div>
      
      <div className="flex flex-col gap-2 w-full px-4">
        {timerMode === 'foco' && (
          <>
            {!isTimerActive && timeElapsed === 0 && <button onClick={iniciarFoco} className="w-full font-bold py-2.5 rounded-full text-sm transition-all" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}}>Iniciar Estudo</button>}
            {isTimerActive && <button onClick={() => setIsTimerActive(false)} className="w-full font-bold py-2.5 rounded-full text-sm transition-all bg-red-100 text-red-600 hover:bg-red-200">Pausar</button>}
            {!isTimerActive && timeElapsed > 0 && (
              <div className="flex flex-col gap-3 w-full">
                <div className="flex gap-2">
                  <button onClick={() => setIsTimerActive(true)} className="flex-1 font-bold py-2.5 rounded-full text-xs transition-all bg-gray-100 text-gray-600 hover:bg-gray-200">Retomar</button>
                  <button onClick={finalizarSessaoEstudo} className="flex-1 font-bold py-2.5 rounded-full text-xs transition-all bg-green-100 text-green-700 hover:bg-green-200 shadow-sm border border-green-200">Salvar</button>
                </div>
                <div className="w-full h-px bg-gray-100 my-1"></div>
                <div className="flex gap-2">
                  <button onClick={() => iniciarPausa(5)} className="flex-1 text-[10px] font-bold py-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors">☕ Pausa 5m</button>
                  <button onClick={() => iniciarPausa(15)} className="flex-1 text-[10px] font-bold py-2 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors">🥪 Pausa 15m</button>
                </div>
              </div>
            )}
          </>
        )}
        {timerMode === 'pausa' && (
          <div className="flex gap-2 w-full">
            <button onClick={() => setIsTimerActive(!isTimerActive)} className="flex-1 font-bold py-2.5 rounded-full text-xs transition-all bg-gray-100 text-gray-700 hover:bg-gray-200">{isTimerActive ? 'Pausar' : 'Retomar'}</button>
            <button onClick={() => { setTimerMode('foco'); setIsTimerActive(false); }} className="flex-1 font-bold py-2.5 rounded-full text-xs transition-all bg-red-50 text-red-500 hover:bg-red-100">Encerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}