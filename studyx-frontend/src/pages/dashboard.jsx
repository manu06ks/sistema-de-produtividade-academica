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
  const [telaAtiva, setTelaAtiva] = useState('dashboard'); // 'dashboard' ou 'analytics' ou 'grupos'

  // --- ESTADOS DE DADOS ---
  const [materias, setMaterias] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [materiais, setMaterials] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [eventosGrupo, setEventosGrupo] = useState([]);

  // --- CONTROLE DE NAVEGAÇÃO INTERNA DOS GRUPOS ---
  const [grupoAtivo, setGrupoAtivo] = useState(null);

  // --- ESTADOS DE MODAIS E FORMULÁRIOS ---
  const [isModalMateriaOpen, setIsModalMateriaOpen] = useState(false);
  const [isModalDocumentoOpen, setIsModalDocumentoOpen] = useState(false);
  const [isModalCriarGrupoOpen, setIsModalCriarGrupoOpen] = useState(false); 
  const [isModalEntrarGrupoOpen, setIsModalEntrarGrupoOpen] = useState(false);
  const [isModalSugerirEventoOpen, setIsModalSugerirEventoOpen] = useState(false);
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

  const [nomeGrupo, setNomeGrupo] = useState('');
  const [descGrupo, setDescGrupo] = useState('');
  const [senhaGrupo, setSenhaGrupo] = useState('');
  const [codigoConviteGrupo, setCodigoConviteGrupo] = useState('');

  //EVENTOS GRUPO
  const [tituloEvento, setTituloEvento] = useState('');
  const [dataEvento, setDataEvento] = useState('');
  const [tipoEvento, setTipoEvento] = useState('prova');

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
    await carregarGrupos();
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

  const carregarGrupos = async () => {
    try { const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos/meus`, { headers }); setGrupos(await res.json()); } 
    catch (e) { console.error(e); }
  };

  // --- REQUISIÇÕES DOS EVENTOS DO GRUPO ---
  const carregarEventosGrupo = async (grupoId) => {
    try { const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos/${grupoId}/eventos`, { headers });
      if (res.ok) setEventosGrupo(await res.json());} 
      catch (e) { console.error("Erro ao carregar eventos:", e); }
  };

  const submitSugerirEvento = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos/${grupoAtivo.id}/eventos`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: tituloEvento, tipo: tipoEvento, data_evento: dataEvento })
      });
      if (res.ok) {
        setIsModalSugerirEventoOpen(false);
        setTituloEvento(''); setDataEvento(''); setTipoEvento('prova');
        carregarEventosGrupo(grupoAtivo.id); // Recarrega os eventos da tela
      }
    } catch (error) { console.error("Erro ao sugerir evento:", error); }
  };

  const responderEvento = async (eventoId, resposta) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos/${grupoAtivo.id}/eventos/${eventoId}/responder`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resposta }) // 'aceito' ou 'ignorado'
      });
      if (res.ok) {
        carregarEventosGrupo(grupoAtivo.id); // Recarrega os eventos para atualizar o visual do botão
      }
    } catch (error) { console.error("Erro ao responder ao evento:", error); }
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

  const submitCriarGrupo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeGrupo, descricao: descGrupo, senha: senhaGrupo })
      });
      if(res.ok) {
        setIsModalCriarGrupoOpen(false);
        setNomeGrupo(''); setDescGrupo(''); setSenhaGrupo('');
        carregarGrupos();
      }
    } catch (error) { console.error("Erro ao criar grupo:", error); }
  };

  // ENTRAR NO GRUPO
  const submitEntrarGrupo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos/entrar`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo_convite: codigoConviteGrupo, senha: senhaGrupo })
      });
      
      if(res.ok) {
        setIsModalEntrarGrupoOpen(false);
        setCodigoConviteGrupo(''); setSenhaGrupo('');
        carregarGrupos();
      } else {
        const erro = await res.json();
        alert(erro.erro || "Falha ao entrar no grupo. Verifique o código e a senha.");
      }
    } catch (error) { console.error("Erro ao entrar no grupo:", error); }
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
          <div className="flex gap-2 z-10">
            <button 
              onClick={() => setTelaAtiva('dashboard')} 
              className={`font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${telaAtiva === 'dashboard' ? 'bg-[#c175e7] hover:bg-[#b05fd4] text-white' : 'bg-[#b2cce4] hover:bg-[#9ebbd7] text-gray-800'}`}
            >
              🏠 Início
            </button>

            <button 
              onClick={() => setTelaAtiva('grupos')} 
              className={`font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${telaAtiva === 'grupos' ? 'bg-[#c175e7] hover:bg-[#b05fd4] text-white' : 'bg-[#b2cce4] hover:bg-[#9ebbd7] text-gray-800'}`}
            >
              👥 Grupos
            </button>

            <button 
              onClick={() => setTelaAtiva('analytics')} 
              className={`font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${telaAtiva === 'analytics' ? 'bg-[#c175e7] hover:bg-[#b05fd4] text-white' : 'bg-[#b2cce4] hover:bg-[#9ebbd7] text-gray-800'}`}
            >
              📊 Stats
            </button>
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
        {telaAtiva === 'grupos' && (
          /* TELA 3: PÁGINA DE GRUPOS DE ESTUDO */
          <div className="max-w-4xl mx-auto space-y-6">
            {!grupoAtivo ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                   <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2"><span role="img" aria-label="pessoas">👥</span> Meus Grupos</h2>
                   <div className="flex gap-3 w-full sm:w-auto">
                     <button onClick={() => setIsModalCriarGrupoOpen(true)} style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="flex-1 sm:flex-none font-bold py-2.5 px-6 rounded-xl hover:brightness-95 transition-all text-sm shadow-sm">+ Criar Grupo</button>
                     <button onClick={() => setIsModalEntrarGrupoOpen(true)} style={{backgroundColor: roxoPrincipal, color: "white"}} className="flex-1 sm:flex-none font-bold py-2.5 px-6 rounded-xl hover:brightness-110 transition-all text-sm shadow-sm">Entrar com Código</button>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {grupos.length === 0 ? (
                      <p className="text-gray-500 col-span-3 text-center mt-10">Você ainda não participa de nenhum grupo.</p>
                    ) : (
                      grupos.map(g => (
                        <div 
                          key={g.id} 
                          onClick={() => { setGrupoAtivo(g); carregarEventosGrupo(g.id); }} // BATE NA API AO CLICAR
                          className={`${cardClass} border-l-4 border-[#c175e7] hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between min-h-[140px] transform hover:-translate-y-1`}
                        >
                           <div>
                             <h3 className="font-bold text-lg text-gray-800 mb-1">{g.nome}</h3>
                             <p className="text-xs text-gray-500 line-clamp-2">{g.descricao}</p>
                           </div>
                           <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                             <span className="text-[10px] font-bold text-[#c175e7] bg-[#f9edf8] px-2 py-1 rounded">{g.papel}</span>
                             <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">👤 {g.total_membros} {g.total_membros === '1' ? 'membro' : 'membros'}</span>
                           </div>
                        </div>
                      ))
                    )}
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <button onClick={() => { setGrupoAtivo(null); setEventosGrupo([]); }} className="mb-4 text-sm font-bold text-gray-500 hover:text-[#c175e7] transition-colors flex items-center gap-1">← Voltar para todos os grupos</button>

                <div className="bg-[#fffdf9] rounded-2xl p-6 md:p-8 shadow-sm mb-6 border-t-4 border-[#c175e7]">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-3xl font-extrabold text-gray-800">{grupoAtivo.nome}</h2>
                  </div>
                  <p className="text-gray-500 mb-4">{grupoAtivo.descricao || 'Nenhuma descrição fornecida.'}</p>
                  
                  {/* DESAFIO DA SEMANA */}
                  <div className="bg-gradient-to-r from-[#f9edf8] to-[#fffdf9] border border-[#c175e7]/30 rounded-xl p-4 mb-6 shadow-sm">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-[#c175e7] flex items-center gap-1">🎯 Desafio da Semana</h4>
                        <p className="text-xs text-gray-600 font-medium mt-0.5">O grupo inteiro deve estudar 20h no total.</p>
                      </div>
                      <span className="text-xs font-extrabold text-gray-800">12h / 20h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-[#c175e7] h-2.5 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div className="flex gap-4 border-b border-gray-200 pb-2">
                    <button className="font-bold text-sm text-[#c175e7] border-b-2 border-[#c175e7] pb-2">📅 Eventos & Provas</button>
                    <button className="font-bold text-sm text-gray-400 hover:text-gray-600 pb-2">📚 Materiais (Em breve)</button>
                    <button className="font-bold text-sm text-gray-400 hover:text-gray-600 pb-2">👤 Membros (Em breve)</button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Sugestões de Datas</h3>
                  {['criador', 'moderador'].includes(grupoAtivo.papel) && (
                    <button onClick={() => setIsModalSugerirEventoOpen(true)} style={{backgroundColor: roxoPrincipal, color: "white"}} className="font-bold py-2 px-4 rounded-lg text-xs shadow-sm hover:brightness-110">
                      + Sugerir Evento
                    </button>
                  )}
                </div>

                {/* LISTAGEM REAL DE EVENTOS VINDOS DA API */}
                <div className="space-y-4">
                  {eventosGrupo.length === 0 ? (
                    <p className="text-center text-gray-500 py-6">Ainda não há eventos ou provas marcadas para este grupo.</p>
                  ) : (
                    eventosGrupo.map((evento) => (
                      <div key={evento.id} className={`${cardClass} border border-[#c175e7]/20 hover:border-[#c175e7] transition-colors`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-[10px] font-bold text-white bg-[#c175e7] px-2 py-0.5 rounded uppercase">{evento.tipo}</span>
                            <h4 className="text-lg font-bold text-gray-800 mt-1">{evento.titulo}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-extrabold text-[#c175e7]">📅 {new Date(evento.data_evento).toLocaleDateString('pt-BR')}</p>
                            {evento.hora_evento && <p className="text-[10px] text-gray-400">Às {evento.hora_evento}</p>}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                          
                          {/* Verifica qual foi o voto do usuário que veio do Banco de Dados */}
                          {!evento.meu_voto ? (
                            <div className="flex gap-3">
                              <button onClick={() => responderEvento(evento.id, 'aceito')} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm flex justify-center items-center gap-2">✅ Aceitar (Ir pro Calendário)</button>
                              <button onClick={() => responderEvento(evento.id, 'ignorado')} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold py-2.5 rounded-xl text-sm transition-colors">❌ Recusar</button>
                            </div>
                          ) : evento.meu_voto === 'aceito' ? (
                            <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-200">
                              <p className="text-sm font-bold text-green-700 flex items-center gap-2">✅ Você aceitou esta sugestão!</p>
                              <span className="text-xs text-green-600 underline cursor-pointer">Editar no meu calendário</span>
                            </div>
                          ) : (
                            <div className="bg-gray-100 p-3 rounded-xl border border-gray-200 text-center">
                              <p className="text-sm font-bold text-gray-500">❌ Você ignorou este evento.</p>
                            </div>
                          )}

                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODAIS DE EVENTOS --- */}
      {isModalSugerirEventoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-2xl p-8 w-full max-w-md relative">
            <button onClick={() => setIsModalSugerirEventoOpen(false)} className="absolute top-4 right-5 text-gray-400 font-bold text-xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: roxoPrincipal }}>Sugerir Nova Data</h2>
            <form onSubmit={submitSugerirEvento} className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 ml-1">Tipo de Evento</label>
              <select value={tipoEvento} onChange={e => setTipoEvento(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass}>
                <option value="prova">🚨 Prova</option>
                <option value="trabalho">📝 Trabalho em Grupo</option>
                <option value="apresentacao">🗣️ Apresentação</option>
                <option value="estudo">📚 Sessão de Estudo Coletiva</option>
              </select>
              <label className="text-xs font-bold text-gray-500 ml-1">Título do Evento</label>
              <input type="text" placeholder="Ex: Prova Final de Cálculo" required value={tituloEvento} onChange={e => setTituloEvento(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass} />
              <label className="text-xs font-bold text-gray-500 ml-1">Data Sugerida</label>
              <input type="date" required value={dataEvento} onChange={e => setDataEvento(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass} />
              <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="w-full font-bold py-3.5 rounded-full mt-4">Sugerir ao Grupo</button>
            </form>
          </div>
        </div>
      )}
      {/* --- MODAIS DE GRUPOS --- */}
      {/* --- CRIAR GRUPO --- */}
      {isModalCriarGrupoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-2xl p-8 w-full max-w-md relative">
            <button onClick={() => { setIsModalCriarGrupoOpen(false); setNomeGrupo(''); setDescGrupo(''); setSenhaGrupo(''); }} className="absolute top-4 right-5 text-gray-400 font-bold text-xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: roxoPrincipal }}>Criar Novo Grupo</h2>
            <form onSubmit={submitCriarGrupo} className="flex flex-col gap-2">
              <input type="text" placeholder="Nome do Grupo" required value={nomeGrupo} onChange={e => setNomeGrupo(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass} />
              <input type="text" placeholder="Descrição (Opcional)" value={descGrupo} onChange={e => setDescGrupo(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass} />
              <input type="password" placeholder="Senha para membros entrarem" required value={senhaGrupo} onChange={e => setSenhaGrupo(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass} />
              <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="w-full font-bold py-3.5 rounded-full mt-2">Criar Grupo</button>
            </form>
          </div>
        </div>
      )}

      {/* --- ENTRAR EM GRUPO --- */}
      {isModalEntrarGrupoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] rounded-2xl p-8 w-full max-w-md relative">
            <button onClick={() => { setIsModalEntrarGrupoOpen(false); setCodigoConviteGrupo(''); setSenhaGrupo(''); }} className="absolute top-4 right-5 text-gray-400 font-bold text-xl">&times;</button>
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: roxoPrincipal }}>Entrar em um Grupo</h2>
            <form onSubmit={submitEntrarGrupo} className="flex flex-col gap-2">
              <input type="text" placeholder="Código de Convite (Ex: AB12CD)" required value={codigoConviteGrupo} onChange={e => setCodigoConviteGrupo(e.target.value.toUpperCase())} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={`${inputClass} uppercase tracking-widest text-center`} maxLength="6" />
              <input type="password" placeholder="Senha do Grupo" required value={senhaGrupo} onChange={e => setSenhaGrupo(e.target.value)} style={{backgroundColor: fundoInput, color: roxoPrincipal}} className={inputClass} />
              <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="w-full font-bold py-3.5 rounded-full mt-2">Entrar</button>
            </form>
          </div>
        </div>
      )}

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