import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('studyx_token');

  // --- ESTADOS (Dados do Banco) ---
  const [materias, setMaterias] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [materiais, setMateriais] = useState([]);

  // --- ESTADOS DOS MODAIS ---
  const [isModalMateriaOpen, setIsModalMateriaOpen] = useState(false);
  const [isModalDocumentoOpen, setIsModalDocumentoOpen] = useState(false);
  const [editandoMateriaId, setEditandoMateriaId] = useState(null);

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

  // --- ESTADOS (Smart Timer) ---
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutos padrão
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState('foco'); // 'foco', 'pausaCurta', 'pausaLonga'

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
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
      if (res.status === 401 || res.status === 403) return fazerLogout();
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

  // --- LÓGICA DO SMART TIMER ---
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
      // Aqui você poderia tocar um áudio/alerta sonoro no futuro!
      alert(`Tempo esgotado para: ${timerMode === 'foco' ? 'Foco' : 'Pausa'}`);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, timerMode]);

  const toggleTimer = () => setIsTimerActive(!isTimerActive);

  const switchTimerMode = (mode) => {
    setIsTimerActive(false);
    setTimerMode(mode);
    if (mode === 'foco') setTimeLeft(25 * 60);
    else if (mode === 'pausaCurta') setTimeLeft(5 * 60);
    else if (mode === 'pausaLonga') setTimeLeft(15 * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- LÓGICA DO MODAL DE MATÉRIAS ---
  const abrirModalNovaMateria = () => {
    setNomeMateria(''); setProfMateria(''); setCorMateria('#c175e7');
    setEditandoMateriaId(null); setIsModalMateriaOpen(true);
  };

  const abrirModalEditarMateria = (materia) => {
    setNomeMateria(materia.nome); setProfMateria(materia.professor || ''); setCorMateria(materia.cor || '#c175e7');
    setEditandoMateriaId(materia.id); setIsModalMateriaOpen(true);
  };

  const fecharModalMateria = () => {
    setIsModalMateriaOpen(false); setNomeMateria(''); setProfMateria(''); setCorMateria('#c175e7');
    setEditandoMateriaId(null);
  };

  // --- FUNÇÕES DE SUBMIT ---
  const submitMateria = async (e) => {
    e.preventDefault();
    const url = editandoMateriaId ? `http://localhost:3000/materias/${editandoMateriaId}` : 'http://localhost:3000/materias';
    const method = editandoMateriaId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeMateria, professor: profMateria, cor: corMateria })
    });

    fecharModalMateria();
    carregarMaterias();
  };

  const submitTarefa = async (e) => {
    e.preventDefault();
    const payload = {
      materia_id: materiaTarefa, titulo: tituloTarefa, data_entrega: dataTarefa, tipo: tipoItem,
      prioridade: tipoItem === 'prova' ? 'alta' : prioridadeTarefa,
      descricao: tipoItem === 'tarefa' ? descTarefa : null, conteudos: tipoItem === 'prova' ? descTarefa : null
    };

    await fetch('http://localhost:3000/tarefas', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setTituloTarefa(''); setDataTarefa(''); setDescTarefa(''); setTipoItem('tarefa');
    carregarTarefas();
  };

  const submitUpload = async (e) => {
    e.preventDefault();
    if (!arquivoUpload) return alert('Selecione um arquivo!');
    const formData = new FormData();
    formData.append('materia_id', materiaUpload); formData.append('titulo', tituloUpload); formData.append('arquivo', arquivoUpload);

    const res = await fetch('http://localhost:3000/materiais/upload', { method: 'POST', headers, body: formData });

    if (res.ok) {
      setTituloUpload(''); setMateriaUpload(''); setArquivoUpload(null);
      e.target.reset(); carregarBiblioteca(); setIsModalDocumentoOpen(false);
    }
  };

  // --- DRAG AND DROP KANBAN ---
  const handleDragStart = (e, id) => e.dataTransfer.setData("text/plain", id);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e, novoStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setTarefas(prev => prev.map(t => t.id == id ? { ...t, status: novoStatus } : t));
    await fetch(`http://localhost:3000/tarefas/${id}/status`, {
      method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: novoStatus })
    });
  };

  const fazerLogout = () => {
    localStorage.removeItem('studyx_token');
    navigate('/');
  };

  // --- CORES DO PROTÓTIPO ---
  const roxoPrincipal = "#c175e7";
  const fundoInput = "#f9edf8";
  const fundoBotaoModal = "#d1e0ec";
  
  // --- CLASSES COMPARTILHADAS ---
  const cardClass = "bg-[#fffdf9] rounded-xl shadow-sm p-4";
  const inputClass = "w-full p-3 mb-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c175e7]/40 font-medium placeholder:text-gray-400";
  const circleBtnClass = "w-[70px] h-[70px] rounded-full bg-[#b2cce4] border-[1.5px] border-black flex items-center justify-center text-center text-[9px] font-bold leading-tight cursor-pointer hover:bg-[#9ebbd7] transition-colors flex-shrink-0 shadow-sm";

  return (
    <div className="min-h-screen bg-[#d4e2ed] text-gray-800 font-sans p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-10 relative">
          <div className="w-20"></div> 
          <img src="/logo.png" alt="StudyX Logo" className="h-10 md:h-14 absolute left-1/2 -translate-x-1/2 object-contain" />
          <button onClick={fazerLogout} className="bg-[#a3a3a3] hover:bg-gray-500 text-white font-bold text-xs px-4 py-1.5 rounded-md transition-colors shadow-sm">logout</button>
        </header>

        {/* LAYOUT PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LADO ESQUERDO: Smart Timer + Agenda */}
          <aside className="lg:col-span-1 space-y-6">
            
            {/* NOVO: SMART TIMER */}
            <div className={`${cardClass} flex flex-col items-center py-6`}>
              <h3 className="font-bold text-sm mb-4" style={{color: roxoPrincipal}}>Smart Timer</h3>
              
              <div className="flex gap-1.5 mb-5 bg-[#f9edf8] p-1 rounded-lg">
                <button onClick={() => switchTimerMode('foco')} className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all ${timerMode === 'foco' ? 'bg-[#c175e7] text-white shadow-sm' : 'text-[#c175e7] hover:bg-[#c175e7]/20'}`}>Foco</button>
                <button onClick={() => switchTimerMode('pausaCurta')} className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all ${timerMode === 'pausaCurta' ? 'bg-[#c175e7] text-white shadow-sm' : 'text-[#c175e7] hover:bg-[#c175e7]/20'}`}>Pausa Curta</button>
                <button onClick={() => switchTimerMode('pausaLonga')} className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all ${timerMode === 'pausaLonga' ? 'bg-[#c175e7] text-white shadow-sm' : 'text-[#c175e7] hover:bg-[#c175e7]/20'}`}>Pausa Longa</button>
              </div>

              <div className="text-5xl font-extrabold mb-5 tracking-tight" style={{color: roxoPrincipal}}>
                {formatTime(timeLeft)}
              </div>

              <div className="flex gap-2 w-full px-4">
                <button onClick={toggleTimer} className="flex-1 font-bold py-2.5 rounded-full text-sm transition-all" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}}>
                  {isTimerActive ? 'Pausar' : 'Iniciar'}
                </button>
                <button onClick={() => switchTimerMode(timerMode)} className="px-4 font-bold py-2.5 rounded-full text-xs bg-gray-200 text-gray-600 hover:bg-gray-300 transition-all">
                  🔄
                </button>
              </div>
            </div>

            {/* AGENDA */}
            <div className={`${cardClass} min-h-[350px]`}>
              <h3 className="text-sm font-bold text-center mb-6">Adicionar na agenda</h3>
              <form onSubmit={submitTarefa} className="flex flex-col gap-2">
                <select value={tipoItem} onChange={e => setTipoItem(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass}>
                  <option value="tarefa">📝 Tarefa / Estudo</option>
                  <option value="prova">🚨 Avaliação / Prova</option>
                </select>

                <select required value={materiaTarefa} onChange={e => setMateriaTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass}>
                  <option value="">Selecione a disciplina...</option>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                
                <input type="text" placeholder="Título (ex: Lista 3)" required value={tituloTarefa} onChange={e => setTituloTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass} />
                <input type="date" required value={dataTarefa} onChange={e => setDataTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass} />
                
                <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="w-full font-bold py-3 rounded-full mt-2 hover:brightness-95 transition-all text-sm">
                  Criar Evento
                </button>
              </form>
            </div>
          </aside>

          {/* LADO DIREITO */}
          <main className="lg:col-span-3 space-y-6">
            
            {/* KANBAN */}
            <div>
              <h3 className="font-bold text-sm mb-2" style={{color: roxoPrincipal}}>Quadro de tarefas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'pendente', title: 'A fazer' },
                  { id: 'em_andamento', title: 'Em progresso' },
                  { id: 'concluida', title: 'Concluído' }
                ].map(coluna => (
                  <div key={coluna.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, coluna.id)} className={`${cardClass} min-h-[250px] flex flex-col`}>
                    <h4 className="font-bold text-xs text-gray-800 mb-3">{coluna.title}</h4>
                    <div className="flex-1 space-y-3">
                      {tarefas.filter(t => (t.status || 'pendente') === coluna.id).map(t => (
                         <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm cursor-grab text-xs">
                           <span style={{ color: t.materia_cor }} className="font-bold mb-1 block text-[10px]">{t.materia_nome}</span>
                           <p className="font-semibold text-gray-800">{t.titulo}</p>
                         </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MINHAS DISCIPLINAS */}
            <div className={`${cardClass} flex items-center justify-between min-h-[140px]`}>
              <div className="flex-1 h-full flex flex-col">
                <h3 className="font-bold text-sm text-gray-800 mb-3">Minhas disciplinas</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {materias.length === 0 ? (
                    <span className="text-xs text-gray-400">Nenhuma disciplina adicionada.</span>
                  ) : (
                    materias.map(m => (
                      <div key={m.id} className="min-w-[120px] bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex flex-col items-start border-l-4 relative group" style={{borderLeftColor: m.cor}}>
                        <strong className="text-xs truncate w-full pr-4">{m.nome}</strong>
                        <span className="text-[10px] text-gray-500 truncate w-full">{m.professor || '-'}</span>
                        <button onClick={() => abrirModalEditarMateria(m)} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-gray-100 p-1 rounded-md hover:bg-gray-200" title="Editar">✏️</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button onClick={abrirModalNovaMateria} className={`${circleBtnClass} ml-4`}>Adicionar<br/>Disciplina</button>
            </div>

            {/* BIBLIOTECA */}
            <div className={`${cardClass} flex items-center justify-between min-h-[140px]`}>
              <div className="flex-1 h-full flex flex-col">
                <h3 className="font-bold text-sm text-gray-800 mb-3">Biblioteca</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {materiais.length === 0 ? (
                    <span className="text-xs text-gray-400">Nenhum documento adicionado.</span>
                  ) : (
                    materiais.map(m => (
                      <div key={m.id} className="min-w-[150px] bg-white p-2 rounded-lg border border-gray-100 shadow-sm text-xs">
                        <strong className="block truncate">{m.titulo}</strong>
                        <a href={`http://localhost:3000/${m.caminho_arquivo}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">Abrir arquivo</a>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button onClick={() => setIsModalDocumentoOpen(true)} className={`${circleBtnClass} ml-4`}>Adicionar<br/>documento</button>
            </div>

          </main>
        </div>
      </div>

      {/* ================= MODAIS ================= */}
      
      {/* MODAL: MATÉRIA (Criação e Edição) */}
      {isModalMateriaOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-2xl p-8 w-full max-w-md relative shadow-2xl">
            <button onClick={fecharModalMateria} className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 font-bold text-xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: roxoPrincipal }}>{editandoMateriaId ? 'Editar Disciplina' : 'Nova Disciplina'}</h2>
            
            <form onSubmit={submitMateria} className="flex flex-col gap-2">
              <input type="text" placeholder="Nome (ex: Cálculo III)" required value={nomeMateria} onChange={e => setNomeMateria(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass} />
              <input type="text" placeholder="Professor (Opcional)" value={profMateria} onChange={e => setProfMateria(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass} />
              
              <div className="flex items-center justify-between p-3 rounded-xl mb-4" style={{backgroundColor: fundoInput}}>
                <label className="text-sm font-medium" style={{ color: roxoPrincipal }}>Cor da Etiqueta:</label>
                <input type="color" value={corMateria} onChange={e => setCorMateria(e.target.value)} className="w-8 h-8 p-0 border-0 rounded-full cursor-pointer bg-transparent" />
              </div>
              
              <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="w-full font-bold py-3.5 rounded-full mt-2 hover:brightness-95 transition-all">
                {editandoMateriaId ? 'Atualizar Disciplina' : 'Salvar Disciplina'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO DOCUMENTO */}
      {isModalDocumentoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-2xl p-8 w-full max-w-md relative shadow-2xl">
            <button onClick={() => setIsModalDocumentoOpen(false)} className="absolute top-4 right-5 text-gray-400 hover:text-gray-700 font-bold text-xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: roxoPrincipal }}>Novo Documento</h2>
            
            <form onSubmit={submitUpload} className="flex flex-col gap-2">
              <select required value={materiaUpload} onChange={e => setMateriaUpload(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass}>
                <option value="">Vincular à disciplina...</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
              <input type="text" placeholder="Nome do arquivo..." required value={tituloUpload} onChange={e => setTituloUpload(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass} />
              
              <input type="file" required onChange={e => setArquivoUpload(e.target.files[0])} className="w-full mb-4 text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#d1e0ec] file:text-[#c175e7] hover:file:brightness-95 cursor-pointer" />
              
              <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="w-full font-bold py-3.5 rounded-full mt-2 hover:brightness-95 transition-all">
                Enviar Arquivo
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}