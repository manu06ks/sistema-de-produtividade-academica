import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('studyx_token');

  // --- ESTADOS (Dados do Banco) ---
  const [materias, setMaterias] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [materiais, setMateriais] = useState([]);

  // --- ESTADOS DE UI (Visualização e Navegação) ---
  const [viewMode, setViewMode] = useState('kanban'); 
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // --- ESTADOS DOS MODAIS GERAIS ---
  const [isModalMateriaOpen, setIsModalMateriaOpen] = useState(false);
  const [isModalDocumentoOpen, setIsModalDocumentoOpen] = useState(false);
  const [editandoMateriaId, setEditandoMateriaId] = useState(null);
  
  // --- NOVOS MODAIS (Detalhes e Edição) ---
  const [materiaDetalhe, setMateriaDetalhe] = useState(null); // Abre o modal de detalhes da disciplina
  const [tarefaEditando, setTarefaEditando] = useState(null); // Abre o modal de edição de tarefa

  // --- ESTADOS DO TIMER ---
  const [timeElapsed, setTimeElapsed] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState('foco'); 
  const [tarefaSelecionadaTimer, setTarefaSelecionadaTimer] = useState('');

  // --- ESTADOS (Formulários) ---
  const [nomeMateria, setNomeMateria] = useState('');
  const [profMateria, setProfMateria] = useState('');
  const [corMateria, setCorMateria] = useState('#c175e7');
  const [tipoItem, setTipoItem] = useState('tarefa');
  const [materiaTarefa, setMateriaTarefa] = useState('');
  const [tituloTarefa, setTituloTarefa] = useState('');
  const [prioridadeTarefa, setPrioridadeTarefa] = useState('media');
  const [dataTarefa, setDataTarefa] = useState('');
  const [descTarefa, setDescTarefa] = useState('');
  const [materiaUpload, setMateriaUpload] = useState('');
  const [tituloUpload, setTituloUpload] = useState('');
  const [arquivoUpload, setArquivoUpload] = useState(null);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    carregarTudo();
  }, [token, navigate]);

  const carregarTudo = async () => {
    await carregarMaterias();
    await carregarTarefas();
    await carregarBiblioteca();
  };

  const headers = { 'Authorization': `Bearer ${token}` };

  const carregarMaterias = async () => {
    try {
      const res = await fetch('http://localhost:3000/materias', { headers });
      setMaterias(await res.json());
    } catch (e) { console.error(e); }
  };

  const carregarTarefas = async () => {
    try {
      const res = await fetch('http://localhost:3000/tarefas', { headers });
      setTarefas(await res.json());
    } catch (e) { console.error(e); }
  };

  const carregarBiblioteca = async () => {
    try {
      const res = await fetch('http://localhost:3000/materiais', { headers });
      setMateriais(await res.json());
    } catch (e) { console.error(e); }
  };

  // --- LÓGICA DE DATAS, CORES E CALENDÁRIO ---
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

  // --- LÓGICA DO SMART TIMER ---
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
    await fetch('http://localhost:3000/sessoes-estudo', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ tarefa_id: tarefaSelecionadaTimer, duracao_segundos: timeElapsed }) });
    alert(`Sessão de ${formatTime(timeElapsed)} salva! 🚀`); setTimeElapsed(0); setIsTimerActive(false); setTimerMode('foco');
  };
  const formatTime = (sec) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;

  // --- FUNÇÕES DE CRUD E SUBMITS ---
  const submitMateria = async (e) => {
    e.preventDefault();
    const url = editandoMateriaId ? `http://localhost:3000/materias/${editandoMateriaId}` : 'http://localhost:3000/materias';
    await fetch(url, { method: editandoMateriaId ? 'PUT' : 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: nomeMateria, professor: profMateria, cor: corMateria }) });
    fecharModalMateria(); carregarMaterias(); setMateriaDetalhe(null);
  };

  const deletarMateria = async (id) => {
    if (!window.confirm("Atenção: Tem certeza que deseja apagar esta disciplina? Todas as tarefas e arquivos associados serão deletados!")) return;
    await fetch(`http://localhost:3000/materias/${id}`, { method: 'DELETE', headers });
    setMateriaDetalhe(null); carregarTudo();
  };

  const submitTarefa = async (e) => {
    e.preventDefault();
    if (tarefaEditando) {
      await fetch(`http://localhost:3000/tarefas/${tarefaEditando.id}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: tituloTarefa, data_entrega: dataTarefa, tipo: tipoItem, descricao: descTarefa }) });
      setTarefaEditando(null);
    } else {
      await fetch('http://localhost:3000/tarefas', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ materia_id: materiaTarefa, titulo: tituloTarefa, data_entrega: dataTarefa, tipo: tipoItem, prioridade: tipoItem === 'prova' ? 'alta' : prioridadeTarefa, descricao: descTarefa, conteudos: tipoItem === 'prova' ? descTarefa : null }) });
    }
    setTituloTarefa(''); setDataTarefa(''); setDescTarefa(''); carregarTarefas();
  };

  const deletarTarefa = async (id) => {
    if (!window.confirm("Deseja mesmo apagar esta tarefa?")) return;
    await fetch(`http://localhost:3000/tarefas/${id}`, { method: 'DELETE', headers });
    setTarefaEditando(null); carregarTarefas();
  };

  const arquivarConcluidas = async () => {
    if (!window.confirm("Deseja limpar o quadro e arquivar todas as tarefas concluídas?")) return;
    await fetch('http://localhost:3000/tarefas/arquivar-concluidas', { 
      method: 'PUT', 
      headers: { 'Authorization': `Bearer ${token}` } 
    });
    carregarTarefas(); // Recarrega a tela para elas sumirem
  };

  const submitUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(); formData.append('materia_id', materiaUpload); formData.append('titulo', tituloUpload); formData.append('arquivo', arquivoUpload);
    await fetch('http://localhost:3000/materiais/upload', { method: 'POST', headers, body: formData });
    setTituloUpload(''); setMateriaUpload(''); carregarBiblioteca(); setIsModalDocumentoOpen(false);
  };

  const handleDragStart = (e, id) => e.dataTransfer.setData("text/plain", id);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e, novoStatus) => {
    e.preventDefault(); const id = e.dataTransfer.getData("text/plain");
    setTarefas(prev => prev.map(t => t.id == id ? { ...t, status: novoStatus } : t));
    await fetch(`http://localhost:3000/tarefas/${id}/status`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: novoStatus }) });
  };

  const abrirModalNovaMateria = () => { setNomeMateria(''); setProfMateria(''); setEditandoMateriaId(null); setIsModalMateriaOpen(true); };
  
  // Modificada para vir direto do modal de detalhes
  const abrirModalEditarMateria = (m) => { setNomeMateria(m.nome); setProfMateria(m.professor || ''); setCorMateria(m.cor || '#c175e7'); setEditandoMateriaId(m.id); setIsModalMateriaOpen(true); };
  const fecharModalMateria = () => { setIsModalMateriaOpen(false); setEditandoMateriaId(null); };

  const abrirModalEditarTarefa = (t) => {
    setTipoItem(t.tipo || 'tarefa'); setMateriaTarefa(t.materia_id); setTituloTarefa(t.titulo); 
    setDataTarefa(t.data_entrega ? t.data_entrega.substring(0, 10) : ''); setDescTarefa(t.descricao || '');
    setTarefaEditando(t);
  };

  const fecharModalEditarTarefa = () => {
    setTarefaEditando(null); setTituloTarefa(''); setDataTarefa(''); setDescTarefa('');
  };

  const fazerLogout = () => { localStorage.removeItem('studyx_token'); navigate('/'); };

  const roxoPrincipal = "#c175e7"; const fundoInput = "#f9edf8"; const fundoBotaoModal = "#d1e0ec";
  const cardClass = "bg-[#fffdf9] rounded-xl shadow-sm p-4";
  const inputClass = "w-full p-3 mb-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c175e7]/40 font-medium placeholder:text-gray-400";
  const circleBtnClass = "w-[70px] h-[70px] rounded-full bg-[#b2cce4] border-[1.5px] border-black flex items-center justify-center text-center text-[9px] font-bold leading-tight cursor-pointer hover:bg-[#9ebbd7] transition-colors flex-shrink-0 shadow-sm";

  return (
    <div className="min-h-screen bg-[#d4e2ed] text-gray-800 font-sans p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10 relative">
          <div className="w-20"></div> 
          <img src="/logo.png" alt="StudyX Logo" className="h-10 md:h-14 absolute left-1/2 -translate-x-1/2 object-contain" />
          <button onClick={fazerLogout} className="bg-[#a3a3a3] hover:bg-gray-500 text-white font-bold text-xs px-4 py-1.5 rounded-md transition-colors shadow-sm">logout</button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-6">
            
            {/* SMART TIMER FLEXÍVEL */}
            <div className={`${cardClass} flex flex-col items-center py-6 relative overflow-hidden`}>
              <h3 className="font-bold text-sm mb-4" style={{color: roxoPrincipal}}>Smart Timer</h3>
              {timerMode === 'foco' && (
                <div className="w-full px-4 mb-4">
                  <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block text-center">Focar em qual tarefa?</label>
                  <select value={tarefaSelecionadaTimer} onChange={(e) => setTarefaSelecionadaTimer(e.target.value)} disabled={isTimerActive || timeElapsed > 0} style={{backgroundColor: fundoInput}} className="w-full p-2 rounded-lg text-[11px] font-bold focus:outline-none disabled:opacity-50">
                    <option value="">Selecione...</option>
                    {tarefas.filter(t => t.status !== 'concluida').map(t => <option key={t.id} value={t.id}>[{t.materia_nome}] {t.titulo}</option>)}
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

            {/* FORMULÁRIO DE NOVA TAREFA */}
            <div className={`${cardClass} min-h-[350px]`}>
              <h3 className="text-sm font-bold text-center mb-6">Adicionar na agenda</h3>
              <form onSubmit={submitTarefa} className="flex flex-col gap-2">
                <select value={tipoItem} onChange={e => setTipoItem(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass}><option value="tarefa">📝 Tarefa</option><option value="prova">🚨 Prova</option></select>
                <select required value={materiaTarefa} onChange={e => setMateriaTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass}><option value="">Selecione a disciplina...</option>{materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select>
                <input type="text" placeholder="Título" required value={tituloTarefa} onChange={e => setTituloTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass} />
                <input type="date" required value={dataTarefa} onChange={e => setDataTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass} />
                <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="w-full font-bold py-3 rounded-full mt-2 text-sm">Criar Evento</button>
              </form>
            </div>
          </aside>

          <main className="lg:col-span-3 space-y-6">
            
            {/* ÁREA DE CONTROLE (KANBAN VS CALENDÁRIO) */}
            <div>
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
                        <h4 className="font-bold text-xs text-gray-800 uppercase tracking-widest">
                          {col === 'em_andamento' ? 'Fazendo' : col.replace('_', ' ')}
                        </h4>
                        
                        {/* Botão de arquivar aparece apenas na coluna de concluídas */}
                        {col === 'concluida' && tarefas.some(t => t.status === 'concluida') && (
                          <button 
                            onClick={arquivarConcluidas} 
                            title="Arquivar todas as concluídas"
                            className="text-[10px] bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 px-2 py-1 rounded transition-colors"
                          >
                            🧹 Limpar
                          </button>
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
                                  {/* Botão de Editar Tarefa (Aparece no Hover) */}
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
                                <span className={`font-semibold line-clamp-2 leading-tight ${t.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                  {t.tipo === 'prova' ? '🚨 ' : ''}{t.titulo}
                                </span>
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

            {/* MINHAS DISCIPLINAS */}
            <div className={`${cardClass} flex items-center justify-between min-h-[140px]`}>
              <div className="flex-1 h-full flex flex-col">
                <h3 className="font-bold text-sm text-gray-800 mb-3">Minhas disciplinas</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {materias.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => setMateriaDetalhe(m)} 
                      className="min-w-[120px] bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex flex-col items-start border-l-4 cursor-pointer hover:bg-gray-50 transition-colors" 
                      style={{borderLeftColor: m.cor}}
                    >
                      <strong className="text-xs truncate w-full pr-2">{m.nome}</strong>
                      <span className="text-[10px] text-gray-500 truncate w-full">{m.professor || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={abrirModalNovaMateria} className={`${circleBtnClass} ml-4`}>Add<br/>Disc.</button>
            </div>

            {/* BIBLIOTECA */}
            <div className={`${cardClass} flex items-center justify-between min-h-[140px]`}>
              <div className="flex-1 h-full flex flex-col">
                <h3 className="font-bold text-sm text-gray-800 mb-3">Biblioteca</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {materiais.map(m => (
                    <div key={m.id} className="min-w-[150px] bg-white p-2 rounded-lg border border-gray-100 shadow-sm text-xs">
                      <strong className="block truncate">{m.titulo}</strong>
                      <a href={`http://localhost:3000/${m.caminho_arquivo}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">Abrir</a>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setIsModalDocumentoOpen(true)} className={`${circleBtnClass} ml-4`}>Add<br/>Doc.</button>
            </div>
          </main>
        </div>
      </div>

      {/* --- MODAIS DE INSERÇÃO --- */}
      {isModalMateriaOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-2xl p-8 w-full max-w-md relative">
            <button onClick={fecharModalMateria} className="absolute top-4 right-5 text-gray-400 font-bold text-xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: roxoPrincipal }}>{editandoMateriaId ? 'Editar' : 'Nova'} Disciplina</h2>
            <form onSubmit={submitMateria} className="flex flex-col gap-2">
              <input type="text" placeholder="Nome" required value={nomeMateria} onChange={e => setNomeMateria(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass} />
              <input type="text" placeholder="Professor" value={profMateria} onChange={e => setProfMateria(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass} />
              <div className="flex items-center justify-between p-3 rounded-xl mb-4" style={{backgroundColor: fundoInput}}><label className="text-sm font-medium" style={{ color: roxoPrincipal }}>Cor:</label><input type="color" value={corMateria} onChange={e => setCorMateria(e.target.value)} className="w-8 h-8 p-0 border-0 rounded-full cursor-pointer bg-transparent" /></div>
              <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="w-full font-bold py-3.5 rounded-full">{editandoMateriaId ? 'Atualizar' : 'Salvar'}</button>
            </form>
          </div>
        </div>
      )}

      {isModalDocumentoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-2xl p-8 w-full max-w-md relative">
            <button onClick={() => setIsModalDocumentoOpen(false)} className="absolute top-4 right-5 text-gray-400 font-bold text-xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: roxoPrincipal }}>Novo Documento</h2>
            <form onSubmit={submitUpload} className="flex flex-col gap-2">
              <select required value={materiaUpload} onChange={e => setMateriaUpload(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass}><option value="">Vincular à disciplina...</option>{materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select>
              <input type="text" placeholder="Nome do arquivo" required value={tituloUpload} onChange={e => setTituloUpload(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass} />
              <input type="file" required onChange={e => setArquivoUpload(e.target.files[0])} className="w-full mb-4 text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#d1e0ec] file:text-[#c175e7]" />
              <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="w-full font-bold py-3.5 rounded-full">Enviar</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE DETALHES DA MATÉRIA (NOVO) --- */}
      {materiaDetalhe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-2xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setMateriaDetalhe(null)} className="absolute top-4 right-5 text-gray-400 font-bold text-xl">&times;</button>
            
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <div className="w-6 h-6 rounded-full" style={{backgroundColor: materiaDetalhe.cor}}></div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-800 leading-tight">{materiaDetalhe.nome}</h2>
                <p className="text-sm font-semibold text-gray-500">Prof(a): {materiaDetalhe.professor || 'Não informado'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Coluna de Tarefas */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">📝 Tarefas Vinculadas</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {tarefas.filter(t => t.materia_id === materiaDetalhe.id).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Nenhuma tarefa para esta matéria.</p>
                  ) : (
                    tarefas.filter(t => t.materia_id === materiaDetalhe.id).map(t => (
                      <div key={t.id} className="bg-white p-2 text-xs rounded border border-gray-200 shadow-sm flex justify-between items-center">
                        <span className={t.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-700 font-semibold'}>{t.titulo}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{t.status.replace('_', ' ')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Coluna de Materiais */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">📚 Biblioteca</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {materiais.filter(m => m.materia_id === materiaDetalhe.id).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Nenhum arquivo enviado.</p>
                  ) : (
                    materiais.filter(m => m.materia_id === materiaDetalhe.id).map(m => (
                      <div key={m.id} className="bg-white p-2 text-xs rounded border border-gray-200 shadow-sm flex justify-between items-center">
                        <span className="font-semibold text-gray-700 truncate w-3/4">{m.titulo}</span>
                        <a href={`http://localhost:3000/${m.caminho_arquivo}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold">Abrir</a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => { abrirModalEditarMateria(materiaDetalhe); setMateriaDetalhe(null); }} className="px-5 py-2 rounded-lg font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">✏️ Editar Disciplina</button>
              <button onClick={() => deletarMateria(materiaDetalhe.id)} className="px-5 py-2 rounded-lg font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors">🗑️ Apagar Disciplina</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO DE TAREFA (NOVO) --- */}
      {tarefaEditando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-2xl p-8 w-full max-w-md relative">
            <button onClick={fecharModalEditarTarefa} className="absolute top-4 right-5 text-gray-400 font-bold text-xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: roxoPrincipal }}>Editar Evento</h2>
            <form onSubmit={submitTarefa} className="flex flex-col gap-2">
              <select value={tipoItem} onChange={e => setTipoItem(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass}>
                <option value="tarefa">📝 Tarefa</option>
                <option value="prova">🚨 Prova</option>
              </select>
              <input type="text" placeholder="Título" required value={tituloTarefa} onChange={e => setTituloTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass} />
              <input type="date" required value={dataTarefa} onChange={e => setDataTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass} />
              
              <div className="flex gap-2 mt-4">
                <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="flex-1 font-bold py-3 rounded-xl text-sm">Atualizar</button>
                <button type="button" onClick={() => deletarTarefa(tarefaEditando.id)} className="flex-1 font-bold py-3 rounded-xl text-sm bg-red-100 text-red-600 hover:bg-red-200">Excluir</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}