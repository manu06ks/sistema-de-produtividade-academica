import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SmartTimer from '../components/SmartTimer';
import TaskForm from '../components/TaskForm';
import Planners from '../components/Planners';
import SubjectList from '../components/SubjectList';
import Library from '../components/Library';
import StudyAnalytics from '../components/StudyAnalytics';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('studyx_token');

  // --- CONTROLO DE TELA ATIVA ---
  const [telaAtiva, setTelaAtiva] = useState('dashboard'); // 'dashboard' ou 'analytics'

  // --- ESTADOS DE DADOS ---
  const [materias, setMaterias] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [materiais, setMaterials] = useState([]);

  // --- ESTADOS DE MODAIS E FORMULÁRIOS ---
  const [isModalMateriaOpen, setIsModalMateriaOpen] = useState(false);
  const [isModalDocumentoOpen, setIsModalDocumentoOpen] = useState(false);
  const [editandoMateriaId, setEditandoMateriaId] = useState(null);
  const [materiaDetalhe, setMateriaDetalhe] = useState(null); 
  const [tarefaEditando, setTarefaEditando] = useState(null); 

  const [nomeMateria, setNomeMateria] = useState('');
  const [profMateria, setProfMateria] = useState('');
  const [corMateria, setCorMateria] = useState('#c175e7');
  
  const [materiaUpload, setMateriaUpload] = useState('');
  const [tituloUpload, setTituloUpload] = useState('');
  const [arquivoUpload, setArquivoUpload] = useState(null);

  const [tituloTarefa, setTituloTarefa] = useState('');
  const [dataTarefa, setDataTarefa] = useState('');
  const [tipoItem, setTipoItem] = useState('tarefa');
  const [descTarefa, setDescTarefa] = useState('');

  // --- REQUISIÇÕES INICIAIS ---
  useEffect(() => {
    if (!token) { navigate('/'); return; }
    carregarTudo();
  }, [token, navigate]);

  const headers = { 'Authorization': `Bearer ${token}` };

  const carregarTudo = async () => {
    await carregarMaterias();
    await carregarTarefas();
    await carregarBiblioteca();
  };

  const carregarMaterias = async () => {
    try { const res = await fetch(`${import.meta.env.VITE_API_URL}/materias`, { headers }); setMaterias(await res.json()); } 
    catch (e) { console.error(e); }
  };

  const carregarTarefas = async () => {
    try { const res = await fetch(`${import.meta.env.VITE_API_URL}/tarefas`, { headers }); setTarefas(await res.json()); } 
    catch (e) { console.error(e); }
  };

  const carregarBiblioteca = async () => {
    try { const res = await fetch(`${import.meta.env.VITE_API_URL}/materiais`, { headers }); setMaterials(await res.json()); } 
    catch (e) { console.error(e); }
  };

  // --- FUNÇÕES DE SUBMIT E DELETE (MODAIS) ---
  const submitMateria = async (e) => {
    e.preventDefault();
    const url = editandoMateriaId ? `${import.meta.env.VITE_API_URL}/materias/${editandoMateriaId}` : `${import.meta.env.VITE_API_URL}/materias`;
    await fetch(url, { method: editandoMateriaId ? 'PUT' : 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: nomeMateria, professor: profMateria, cor: corMateria }) });
    fecharModalMateria(); carregarMaterias(); setMateriaDetalhe(null);
  };

  const deletarMateria = async (id) => {
    if (!window.confirm("Atenção: Tem certeza que deseja apagar esta disciplina?")) return;
    await fetch(`${import.meta.env.VITE_API_URL}/materias/${id}`, { method: 'DELETE', headers });
    setMateriaDetalhe(null); carregarTudo();
  };

  const submitTarefaEdicao = async (e) => {
    e.preventDefault();
    await fetch(`${import.meta.env.VITE_API_URL}/tarefas/${tarefaEditando.id}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: tituloTarefa, data_entrega: dataTarefa, tipo: tipoItem, descricao: descTarefa }) });
    setTarefaEditando(null); carregarTarefas();
  };

  const deletarTarefa = async (id) => {
    if (!window.confirm("Deseja mesmo apagar esta tarefa?")) return;
    await fetch(`${import.meta.env.VITE_API_URL}/tarefas/${id}`, { method: 'DELETE', headers });
    setTarefaEditando(null); carregarTarefas();
  };

  const submitUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(); formData.append('materia_id', materiaUpload); formData.append('titulo', tituloUpload); formData.append('arquivo', arquivoUpload);
    await fetch(`${import.meta.env.VITE_API_URL}/materiais/upload`, { method: 'POST', headers, body: formData });
    setTituloUpload(''); setMateriaUpload(''); carregarBiblioteca(); setIsModalDocumentoOpen(false);
  };

  // --- CONTROLE DE MODAIS ---
  const abrirModalNovaMateria = () => { setNomeMateria(''); setProfMateria(''); setEditandoMateriaId(null); setIsModalMateriaOpen(true); };
  const abrirModalEditarMateria = (m) => { setNomeMateria(m.nome); setProfMateria(m.professor || ''); setCorMateria(m.cor || '#c175e7'); setEditandoMateriaId(m.id); setIsModalMateriaOpen(true); };
  const fecharModalMateria = () => { setIsModalMateriaOpen(false); setEditandoMateriaId(null); };

  const abrirModalEditarTarefa = (t) => {
    setTipoItem(t.tipo || 'tarefa'); setTituloTarefa(t.titulo); 
    setDataTarefa(t.data_entrega ? t.data_entrega.substring(0, 10) : ''); setDescTarefa(t.descricao || '');
    setTarefaEditando(t);
  };
  const fecharModalEditarTarefa = () => { setTarefaEditando(null); setTituloTarefa(''); setDataTarefa(''); setDescTarefa(''); };

  const fazerLogout = () => { localStorage.removeItem('studyx_token'); navigate('/'); };

  // --- CONSTANTES DE ESTILO ---
  const roxoPrincipal = "#c175e7"; const fundoInput = "#f9edf8"; const fundoBotaoModal = "#d1e0ec";
  const cardClass = "bg-[#fffdf9] rounded-xl shadow-sm p-4";
  const inputClass = "w-full p-3 mb-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c175e7]/40 font-medium placeholder:text-gray-400";
  const circleBtnClass = "w-[70px] h-[70px] rounded-full bg-[#b2cce4] border-[1.5px] border-black flex items-center justify-center text-center text-[9px] font-bold leading-tight cursor-pointer hover:bg-[#9ebbd7] transition-colors flex-shrink-0 shadow-sm";

  return (
    <div className="min-h-screen bg-[#d4e2ed] text-gray-800 font-sans p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER COM BOTÃO ALTERNADOR NO CANTO ESQUERDO */}
        <header className="flex justify-between items-center mb-10 relative">
          <div className="w-32 z-10">
            {telaAtiva === 'dashboard' ? (
              <button 
                onClick={() => setTelaAtiva('analytics')} 
                className="bg-[#c175e7] hover:bg-[#b05fd4] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                📊 Estatísticas
              </button>
            ) : (
              <button 
                onClick={() => setTelaAtiva('dashboard')} 
                className="bg-[#b2cce4] hover:bg-[#9ebbd7] text-gray-800 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                🏠 Dashboard
              </button>
            )}
          </div> 
          <img src="/logo.png" alt="StudyX Logo" className="h-10 md:h-14 absolute left-1/2 -translate-x-1/2 object-contain" />
          <button onClick={fazerLogout} className="bg-[#a3a3a3] hover:bg-gray-500 text-white font-bold text-xs px-4 py-1.5 rounded-md transition-colors shadow-sm">logout</button>
        </header>

        {/* RENDERIZAÇÃO CONDICIONAL DA PÁGINA */}
        {telaAtiva === 'dashboard' ? (
          /* TELA 1: DASHBOARD GERAL */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1 space-y-6">
              <SmartTimer tarefas={tarefas} token={token} roxoPrincipal={roxoPrincipal} fundoInput={fundoInput} fundoBotaoModal={fundoBotaoModal} />
              <TaskForm materias={materias} token={token} carregarTarefas={carregarTarefas} roxoPrincipal={roxoPrincipal} fundoInput={fundoInput} fundoBotaoModal={fundoBotaoModal} inputClass={inputClass} />
            </aside>

            <main className="lg:col-span-3 space-y-6">
              <Planners tarefas={tarefas} setTarefas={setTarefas} token={token} carregarTarefas={carregarTarefas} abrirModalEditarTarefa={abrirModalEditarTarefa} roxoPrincipal={roxoPrincipal} cardClass={cardClass} />
              <SubjectList materias={materias} setMateriaDetalhe={setMateriaDetalhe} abrirModalNovaMateria={abrirModalNovaMateria} cardClass={cardClass} circleBtnClass={circleBtnClass} />
              <Library materiais={materiais} setIsModalDocumentoOpen={setIsModalDocumentoOpen} cardClass={cardClass} circleBtnClass={circleBtnClass} />
            </main>
          </div>
        ) : (
          /* TELA 2: PÁGINA EXCLUSIVA DE ANALYTICS */
          <StudyAnalytics token={token} cardClass={cardClass} />
        )}
      </div>

      {/* --- MODAL DE DISCIPLINA --- */}
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

      {/* --- MODAL DE UPLOAD DE ARQUIVO --- */}
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

      {/* --- MODAL DE DETALHES DA MATÉRIA --- */}
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

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">📚 Biblioteca</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {materiais.filter(m => m.materia_id === materiaDetalhe.id).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Nenhum arquivo enviado.</p>
                  ) : (
                    materiais.filter(m => m.materia_id === materiaDetalhe.id).map(m => (
                      <div key={m.id} className="bg-white p-2 text-xs rounded border border-gray-200 shadow-sm flex justify-between items-center">
                        <span className="font-semibold text-gray-700 truncate w-3/4">{m.titulo}</span>
                        <a href={`${import.meta.env.VITE_API_URL}/${m.caminho_arquivo}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold">Abrir</a>
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

      {/* --- MODAL DE EDIÇÃO DE TAREFA --- */}
      {tarefaEditando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-2xl p-8 w-full max-w-md relative">
            <button onClick={fecharModalEditarTarefa} className="absolute top-4 right-5 text-gray-400 font-bold text-xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: roxoPrincipal }}>Editar Evento</h2>
            <form onSubmit={submitTarefaEdicao} className="flex flex-col gap-2">
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