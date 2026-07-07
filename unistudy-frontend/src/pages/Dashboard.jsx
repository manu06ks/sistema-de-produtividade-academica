import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  BarChart3,
  LogOut,
  X,
  Pencil,
  Trash2,
  BookOpen,
  ClipboardList,
  FileText,
} from 'lucide-react';
import SmartTimer from '../components/SmartTimer';
import TaskForm from '../components/TaskForm';
import Planners from '../components/Planners';
import SubjectList from '../components/SubjectList';
import Library from '../components/Library';
import StudyAnalytics from '../components/StudyAnalytics';
import Grupos from '../components/Grupos'; // Importando o novo componente de Grupos

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('studyx_token');

  // --- CONTROLO DE TELA ATIVA ---
  const [telaAtiva, setTelaAtiva] = useState('dashboard'); // 'dashboard' ou 'analytics' ou 'grupos'

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
  const roxoPrincipal = "#7c3aed";
  const fundoInput = "#f5f3ff";
  const fundoBotaoModal = "#ede9fe";
  const cardClass = "bg-card border border-border/50 rounded-2xl shadow-sm p-4";
  const inputClass = "w-full p-3.5 mb-4 rounded-xl bg-input/50 border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all font-medium placeholder:text-muted-foreground";
  const circleBtnClass = "w-[70px] h-[70px] rounded-2xl bg-secondary border border-border/60 flex items-center justify-center text-center text-[9px] font-bold leading-tight cursor-pointer hover:bg-accent hover:border-primary/30 transition-all flex-shrink-0 shadow-sm text-secondary-foreground";
  const modalCardClass = "bg-card border border-border/50 rounded-3xl p-8 w-full max-w-md relative shadow-xl";

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent via-background to-secondary text-foreground font-sans p-4 md:p-8 relative">
      <div className="max-w-7xl mx-auto">

        {/* HEADER COM NAVEGAÇÃO EM PÍLULA / GLASSMORPHISM */}
        <header className="flex justify-between items-center mb-10 relative">
          <nav className="flex gap-1 z-10 p-1 rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 shadow-sm">
            <button
              onClick={() => setTelaAtiva('dashboard')}
              className={`font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${telaAtiva === 'dashboard' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
            >
              <Home className="h-4 w-4" /> Início
            </button>

            <button
              onClick={() => setTelaAtiva('grupos')}
              className={`font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${telaAtiva === 'grupos' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
            >
              <Users className="h-4 w-4" /> Grupos
            </button>

            <button
              onClick={() => setTelaAtiva('analytics')}
              className={`font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${telaAtiva === 'analytics' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
            >
              <BarChart3 className="h-4 w-4" /> Stats
            </button>
          </nav>
          <img src="/logo.png" alt="UniStudy Logo" className="h-10 md:h-14 absolute left-1/2 -translate-x-1/2 object-contain" />
          <button onClick={fazerLogout} className="flex items-center gap-1.5 bg-secondary hover:bg-accent text-secondary-foreground font-semibold text-xs px-4 py-2 rounded-xl transition-colors border border-border/50">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </header>

        {/* RENDERIZAÇÃO CONDICIONAL DA PÁGINA */}
        {telaAtiva === 'dashboard' && (
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
        )}

        {telaAtiva === 'analytics' && (
          <StudyAnalytics token={token} cardClass={cardClass} />
        )}

        {telaAtiva === 'grupos' && (
          /* O novo componente importado está fazendo todo o trabalho aqui agora! */
          <Grupos token={token} />
        )}
      </div>

      {/* --- MODAIS PRINCIPAIS (Matéria, Tarefa e Documento) --- */}
      {isModalMateriaOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={modalCardClass}>
            <button onClick={fecharModalMateria} className="absolute top-4 right-5 text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold tracking-tight mb-6 text-center text-foreground">{editandoMateriaId ? 'Editar' : 'Nova'} Disciplina</h2>
            <form onSubmit={submitMateria} className="flex flex-col gap-2">
              <input type="text" placeholder="Nome" required value={nomeMateria} onChange={e => setNomeMateria(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Professor" value={profMateria} onChange={e => setProfMateria(e.target.value)} className={inputClass} />
              <div className="flex items-center justify-between p-3.5 rounded-xl mb-4 bg-input/50 border border-border/60"><label className="text-sm font-medium text-foreground">Cor:</label><input type="color" value={corMateria} onChange={e => setCorMateria(e.target.value)} className="w-8 h-8 p-0 border-0 rounded-full cursor-pointer bg-transparent" /></div>
              <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.99] transition-all">{editandoMateriaId ? 'Atualizar' : 'Salvar'}</button>
            </form>
          </div>
        </div>
      )}

      {isModalDocumentoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={modalCardClass}>
            <button onClick={() => setIsModalDocumentoOpen(false)} className="absolute top-4 right-5 text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold tracking-tight mb-6 text-center text-foreground">Novo Documento</h2>
            <form onSubmit={submitUpload} className="flex flex-col gap-2">
              <select required value={materiaUpload} onChange={e => setMateriaUpload(e.target.value)} className={inputClass}><option value="">Vincular à disciplina...</option>{materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select>
              <input type="text" placeholder="Nome do arquivo" required value={tituloUpload} onChange={e => setTituloUpload(e.target.value)} className={inputClass} />
              <input type="file" required onChange={e => setArquivoUpload(e.target.files[0])} className="w-full mb-4 text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-accent file:transition-colors" />
              <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 active:scale-[0.99] transition-all">Enviar</button>
            </form>
          </div>
        </div>
      )}

      {materiaDetalhe && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border/50 rounded-3xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto shadow-xl">
            <button onClick={() => setMateriaDetalhe(null)} className="absolute top-4 right-5 text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>

            <div className="flex items-center gap-3 mb-6 border-b border-border/50 pb-4">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: materiaDetalhe.cor }}></div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground leading-tight">{materiaDetalhe.nome}</h2>
                <p className="text-sm font-medium text-muted-foreground">Prof(a): {materiaDetalhe.professor || 'Não informado'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-secondary/50 p-4 rounded-2xl border border-border/50">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-foreground"><ClipboardList className="h-4 w-4 text-primary" /> Tarefas Vinculadas</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {tarefas.filter(t => t.materia_id === materiaDetalhe.id).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhuma tarefa para esta matéria.</p>
                  ) : (
                    tarefas.filter(t => t.materia_id === materiaDetalhe.id).map(t => (
                      <div key={t.id} className="bg-card p-2 text-xs rounded-lg border border-border/50 shadow-sm flex justify-between items-center">
                        <span className={t.status === 'concluida' ? 'line-through text-muted-foreground' : 'text-foreground font-semibold'}>{t.titulo}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{t.status.replace('_', ' ')}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-secondary/50 p-4 rounded-2xl border border-border/50">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-foreground"><BookOpen className="h-4 w-4 text-primary" /> Biblioteca</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {materiais.filter(m => m.materia_id === materiaDetalhe.id).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhum arquivo enviado.</p>
                  ) : (
                    materiais.filter(m => m.materia_id === materiaDetalhe.id).map(m => (
                      <div key={m.id} className="bg-card p-2 text-xs rounded-lg border border-border/50 shadow-sm flex justify-between items-center">
                        <span className="font-semibold text-foreground truncate w-3/4">{m.titulo}</span>
                        <a href={`${import.meta.env.VITE_API_URL}/${m.caminho_arquivo}`} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Abrir</a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <button onClick={() => { abrirModalEditarMateria(materiaDetalhe); setMateriaDetalhe(null); }} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm bg-secondary text-secondary-foreground hover:bg-accent transition-colors"><Pencil className="h-4 w-4" /> Editar Disciplina</button>
              <button onClick={() => deletarMateria(materiaDetalhe.id)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 className="h-4 w-4" /> Apagar Disciplina</button>
            </div>
          </div>
        </div>
      )}

      {tarefaEditando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={modalCardClass}>
            <button onClick={fecharModalEditarTarefa} className="absolute top-4 right-5 text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold tracking-tight mb-6 text-center text-foreground">Detalhes do Evento</h2>
            <form onSubmit={submitTarefaEdicao} className="flex flex-col gap-0">
              <select value={tipoItem} onChange={e => setTipoItem(e.target.value)} className={inputClass}>
                <option value="tarefa">Tarefa</option>
                <option value="prova">Prova</option>
              </select>
              <input type="text" placeholder="Título" required value={tituloTarefa} onChange={e => setTituloTarefa(e.target.value)} className={inputClass} />
              <input type="date" required value={dataTarefa} onChange={e => setDataTarefa(e.target.value)} className={inputClass} />
              
              {/* NOVO: Campo de Descrição */}
              <textarea 
                placeholder="Descrição / Conteúdos..." 
                value={descTarefa} 
                onChange={e => setDescTarefa(e.target.value)} 
                className={`${inputClass} h-24 resize-none`}
              />

              {/* NOVO: Botão do Anexo se a tarefa tiver arquivo */}
              {tarefaEditando.caminho_arquivo && (
                <div className="bg-secondary/50 border border-border/50 rounded-xl p-3.5 flex items-center justify-between mb-4 mt-[-4px]">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Anexo
                  </span>
                  <a 
                    href={`${import.meta.env.VITE_API_URL}/${tarefaEditando.caminho_arquivo}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    Abrir Arquivo
                  </a>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm">Salvar</button>
                <button type="button" onClick={() => deletarTarefa(tarefaEditando.id)} className="flex-1 flex items-center justify-center gap-1.5 font-semibold py-3 rounded-xl text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash2 className="h-4 w-4" /> Excluir</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}