import { useState } from 'react';

export default function Planners({ tarefas, setTarefas, token, carregarTarefas, abrirModalEditarTarefa, roxoPrincipal, cardClass }) {
  const [viewMode, setViewMode] = useState('kanban'); 
  const [currentDate, setCurrentDate] = useState(new Date()); 

  // --- LÓGICA DE DATAS E CORES ---
  const verificarPrazo = (data_entrega, status) => {
    if (status === 'concluida') return 'concluido';
    if (!data_entrega) return 'normal';
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const entrega = new Date(data_entrega + 'T00:00:00'); 
    const diffTime = entrega - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'atrasado';
    if (diffDays <= 2) return 'urgente';
    return 'normal';
  };

  const coresPrazo = {
    atrasado: "border-red-400 border-[1.5px] bg-red-50",
    urgente: "border-orange-400 border-[1.5px] bg-orange-50",
    normal: "border-gray-100 border bg-white",
    concluido: "border-gray-200 border bg-gray-50 opacity-60" 
  };

  const formatYMD = (date) => {
    const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const nextPeriod = () => { const novaData = new Date(currentDate); if (viewMode === 'mes') novaData.setMonth(novaData.getMonth() + 1); if (viewMode === 'semana') novaData.setDate(novaData.getDate() + 7); setCurrentDate(novaData); };
  const prevPeriod = () => { const novaData = new Date(currentDate); if (viewMode === 'mes') novaData.setMonth(novaData.getMonth() - 1); if (viewMode === 'semana') novaData.setDate(novaData.getDate() - 7); setCurrentDate(novaData); };
  const goToToday = () => setCurrentDate(new Date());

  const mesAtual = currentDate.getMonth(); const anoAtual = currentDate.getFullYear();
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate(); const primeiroDiaDoMes = new Date(anoAtual, mesAtual, 1).getDay(); 
  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const inicioDaSemana = new Date(currentDate); inicioDaSemana.setDate(currentDate.getDate() - currentDate.getDay()); 
  const diasDaSemanaAtual = Array.from({ length: 7 }).map((_, i) => { const d = new Date(inicioDaSemana); d.setDate(inicioDaSemana.getDate() + i); return d; });

  // --- LÓGICA DO KANBAN ---
  const handleDragStart = (e, id) => e.dataTransfer.setData("text/plain", id);
  const handleDragOver = (e) => e.preventDefault();
  
  const handleDrop = async (e, novoStatus) => {
    e.preventDefault(); const id = e.dataTransfer.getData("text/plain");
    setTarefas(prev => prev.map(t => t.id == id ? { ...t, status: novoStatus } : t));
    await fetch(`${import.meta.env.VITE_API_URL}/tarefas/${id}/status`, { 
      method: 'PUT', 
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ status: novoStatus }) 
    });
  };

  const arquivarConcluidas = async () => {
    if (!window.confirm("Deseja limpar o quadro e arquivar todas as tarefas concluídas?")) return;
    await fetch(`${import.meta.env.VITE_API_URL}/tarefas/arquivar-concluidas`, { 
      method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } 
    });
    carregarTarefas();
  };

  return (
    <div>
      {/* CABEÇALHO DO PLANEJAMENTO */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h3 className="font-bold text-sm" style={{color: roxoPrincipal}}>Planejamento</h3>
        
        {viewMode !== 'kanban' && (
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg shadow-sm">
            <button onClick={prevPeriod} className="text-gray-400 hover:text-[#c175e7] transition-colors font-bold">&lt;</button>
            <span className="text-xs font-bold w-32 text-center text-gray-700">
              {viewMode === 'mes' ? `${nomesMeses[mesAtual]} ${anoAtual}` : `Semana de ${inicioDaSemana.getDate()}/${inicioDaSemana.getMonth() + 1}`}
            </span>
            <button onClick={nextPeriod} className="text-gray-400 hover:text-[#c175e7] transition-colors font-bold">&gt;</button>
            <div className="w-px h-4 bg-gray-200 mx-1"></div>
            <button onClick={goToToday} className="text-[10px] font-bold text-gray-500 hover:text-[#c175e7]">Hoje</button>
          </div>
        )}

        <div className="bg-white p-1 rounded-lg flex gap-1 shadow-sm">
          <button onClick={() => setViewMode('kanban')} className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-[#c175e7] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>🗂️ Kanban</button>
          <button onClick={() => setViewMode('semana')} className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all ${viewMode === 'semana' ? 'bg-[#c175e7] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>📅 Semana</button>
          <button onClick={() => setViewMode('mes')} className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all ${viewMode === 'mes' ? 'bg-[#c175e7] text-white shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}>🗓️ Mês</button>
        </div>
      </div>

      {/* VISÃO: KANBAN */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['pendente', 'em_andamento', 'concluida'].map(col => (
            <div key={col} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col)} className={`${cardClass} min-h-[250px] flex flex-col`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-xs text-gray-800 uppercase tracking-widest">{col === 'em_andamento' ? 'Fazendo' : col.replace('_', ' ')}</h4>
                {col === 'concluida' && tarefas.some(t => t.status === 'concluida') && (
                  <button onClick={arquivarConcluidas} title="Arquivar todas as concluídas" className="text-[10px] bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 px-2 py-1 rounded transition-colors">🧹 Limpar</button>
                )}
              </div>
              <div className="flex-1 space-y-3">
                {tarefas.filter(t => (t.status || 'pendente') === col).map(t => {
                  const prazoStatus = verificarPrazo(t.data_entrega, t.status);
                  return (
                    <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)} className={`p-3 rounded-lg shadow-sm cursor-grab transition-all group ${coresPrazo[prazoStatus]}`}>
                      <div className="flex justify-between items-start mb-1 relative">
                        <span style={{ color: t.status === 'concluida' ? 'gray' : t.materia_cor }} className="font-bold block text-[10px]">{t.materia_nome}</span>
                        <div className="flex gap-1">
                          <button onClick={() => abrirModalEditarTarefa(t)} className="opacity-0 group-hover:opacity-100 text-[10px] bg-white border border-gray-200 text-gray-500 rounded px-1 hover:bg-gray-50 transition-opacity">✏️</button>
                          {prazoStatus === 'atrasado' && <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 rounded">ATRASADO</span>}
                          {prazoStatus === 'urgente' && <span className="text-[9px] font-bold bg-orange-100 text-orange-600 px-1.5 rounded">URGENTE</span>}
                        </div>
                      </div>
                      <p className={`font-semibold text-xs ${t.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.titulo}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VISÃO: CALENDÁRIO SEMANAL */}
      {viewMode === 'semana' && (
        <div className={`${cardClass} p-4 min-h-[350px]`}>
          <div className="grid grid-cols-7 gap-2 h-full">
            {diasDaSemanaAtual.map((data, i) => {
              const strData = formatYMD(data);
              const tarefasDoDia = tarefas.filter(t => t.data_entrega && t.data_entrega.startsWith(strData));
              const isHoje = formatYMD(new Date()) === strData;
              return (
                <div key={i} className={`flex flex-col rounded-xl border ${isHoje ? 'border-[#c175e7] bg-[#f9edf8]/30' : 'border-gray-100 bg-gray-50/50'} overflow-hidden`}>
                  <div className={`text-center py-2 border-b ${isHoje ? 'bg-[#c175e7] text-white border-[#c175e7]' : 'border-gray-100'}`}>
                    <div className={`text-[10px] font-bold uppercase ${isHoje ? 'text-white' : 'text-gray-400'}`}>{diasDaSemana[i]}</div>
                    <div className={`text-lg font-extrabold ${isHoje ? 'text-white' : 'text-gray-700'}`}>{data.getDate()}</div>
                  </div>
                  <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto min-h-[250px]">
                    {tarefasDoDia.map(t => (
                      <div key={t.id} onClick={() => abrirModalEditarTarefa(t)} className={`p-2 rounded-lg text-xs shadow-sm border-l-2 flex flex-col gap-1 cursor-pointer hover:opacity-80 ${t.status === 'concluida' ? 'bg-white opacity-50' : 'bg-white'}`} style={{ borderLeftColor: t.status === 'concluida' ? '#e5e7eb' : t.materia_cor }}>
                        <span className="text-[9px] font-bold truncate" style={{color: t.status === 'concluida' ? '#9ca3af' : t.materia_cor}}>{t.materia_nome}</span>
                        <span className={`font-semibold line-clamp-2 leading-tight ${t.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.tipo === 'prova' ? '🚨 ' : ''}{t.titulo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VISÃO: CALENDÁRIO MENSAL */}
      {viewMode === 'mes' && (
        <div className={`${cardClass} p-6`}>
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400 uppercase">{diasDaSemana.map(d => <div key={d}>{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: primeiroDiaDoMes }).map((_, i) => <div key={`empty-${i}`} className="min-h-[90px] bg-gray-50 rounded-lg border border-transparent"></div>)}
            {Array.from({ length: diasNoMes }).map((_, i) => {
              const dia = i + 1; const dataFormatada = `${anoAtual}-${(mesAtual + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
              const tarefasDoDia = tarefas.filter(t => t.data_entrega && t.data_entrega.startsWith(dataFormatada));
              const isHoje = formatYMD(new Date()) === dataFormatada;
              return (
                <div key={dia} className={`min-h-[90px] rounded-lg border p-1.5 shadow-sm flex flex-col transition-colors ${isHoje ? 'border-[#c175e7] bg-white' : 'border-gray-100 bg-white hover:border-[#c175e7]/30'}`}>
                  <span className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isHoje ? 'bg-[#c175e7] text-white' : 'text-gray-500'}`}>{dia}</span>
                  <div className="flex flex-col gap-1 overflow-y-auto">
                    {tarefasDoDia.map(t => (
                      <div key={t.id} onClick={() => abrirModalEditarTarefa(t)} className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:opacity-80 ${t.status === 'concluida' ? 'bg-gray-100 text-gray-400 line-through' : 'text-white'}`} style={{ backgroundColor: t.status === 'concluida' ? undefined : t.materia_cor }}>
                        {t.tipo === 'prova' && <span>🚨</span>}{t.titulo}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}