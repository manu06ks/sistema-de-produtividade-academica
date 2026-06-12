import { useState, useEffect } from 'react';
import { Users, Plus, X, ArrowLeft, Target, Trophy, Copy, Check, LogOut, User } from 'lucide-react';

export default function Grupos({ token }) {
  const [grupos, setGrupos] = useState([]);
  const [grupoAtivo, setGrupoAtivo] = useState(null);
  const [ranking, setRanking] = useState([]);
  
  // Modais e Formulários
  const [isModalCriarOpen, setIsModalCriarOpen] = useState(false);
  const [isModalEntrarOpen, setIsModalEntrarOpen] = useState(false);
  
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [descGrupo, setDescGrupo] = useState('');
  const [senhaGrupo, setSenhaGrupo] = useState('');
  const [codigoConvite, setCodigoConvite] = useState('');
  
  // Feedback visual do botão de copiar
  const [copiado, setCopiado] = useState(false);

  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  };

  useEffect(() => {
    carregarGrupos();
  }, []);

  const carregarGrupos = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos/meus`, { headers });
      if (res.ok) setGrupos(await res.json());
    } catch (e) { console.error("Erro ao carregar grupos", e); }
  };

  const abrirDetalhesGrupo = async (grupo) => {
    setGrupoAtivo(grupo);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos/${grupo.id}/stats/membros`, { headers });
      if (res.ok) setRanking(await res.json());
    } catch (e) { console.error("Erro ao carregar ranking", e); }
  };

  const criarGrupo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nome: nomeGrupo, descricao: descGrupo, senha: senhaGrupo })
      });
      if (res.ok) {
        setIsModalCriarOpen(false);
        setNomeGrupo(''); setDescGrupo(''); setSenhaGrupo('');
        carregarGrupos();
      }
    } catch (error) { console.error("Erro ao criar grupo", error); }
  };

  const entrarGrupo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos/entrar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ codigo_convite: codigoConvite, senha: senhaGrupo })
      });
      if (res.ok) {
        setIsModalEntrarOpen(false);
        setCodigoConvite(''); setSenhaGrupo('');
        carregarGrupos();
      } else {
        const erro = await res.json();
        alert(erro.erro || "Falha ao entrar no grupo. Verifique o código e senha.");
      }
    } catch (error) { console.error("Erro ao entrar", error); }
  };

  const sairDoGrupo = async () => {
    if (!window.confirm("Tem certeza que deseja sair deste grupo? O seu histórico de horas continuará no seu perfil, mas sumirá do ranking do grupo.")) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/grupos/${grupoAtivo.id}/sair`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setGrupoAtivo(null);
        carregarGrupos();
      }
    } catch (error) { console.error("Erro ao sair", error); }
  };

  const copiarCodigoConvite = () => {
    navigator.clipboard.writeText(grupoAtivo.codigo_convite);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const formatarTempo = (segundosTotais) => {
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    if (horas > 0) return `${horas}h ${minutos}m`;
    return `${minutos}m`;
  };

  const inputClass = "w-full p-3.5 mb-4 rounded-xl bg-input/50 border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all font-medium placeholder:text-muted-foreground";
  const modalCardClass = "bg-card border border-border/50 rounded-3xl p-8 w-full max-w-md relative shadow-xl animate-fade-in";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!grupoAtivo ? (
        /* --- LISTA DE GRUPOS --- */
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Users className="h-7 w-7 text-primary" /> Meus Grupos
            </h2>
            <div className="flex gap-3 w-full sm:w-auto">
              <button onClick={() => setIsModalCriarOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground font-semibold py-2.5 px-6 rounded-xl hover:bg-accent transition-all text-sm border border-border/50">
                <Plus className="h-4 w-4" /> Criar Grupo
              </button>
              <button onClick={() => setIsModalEntrarOpen(true)} className="flex-1 sm:flex-none bg-primary text-primary-foreground font-semibold py-2.5 px-6 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all text-sm shadow-sm">
                Entrar com Código
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {grupos.length === 0 ? (
              <div className="col-span-3 bg-card border border-border/50 rounded-2xl p-10 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">Você ainda não participa de nenhum grupo.</p>
                <p className="text-sm text-muted-foreground mt-1">Crie um grupo e convide sua equipe para competir!</p>
              </div>
            ) : (
              grupos.map(g => (
                <div
                  key={g.id}
                  onClick={() => abrirDetalhesGrupo(g)}
                  className="bg-card border border-border/50 border-l-4 border-l-primary rounded-2xl shadow-sm p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[150px] transform hover:-translate-y-1"
                >
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-1">{g.nome}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{g.descricao}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md uppercase tracking-wider">{g.papel}</span>
                    <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> {g.total_membros}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* --- DETALHES DO GRUPO (RANKING E INFOS) --- */
        <div className="animate-fade-in">
          <button onClick={() => setGrupoAtivo(null)} className="mb-4 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar para grupos
          </button>

          <div className="bg-card border border-border/50 border-t-4 border-t-primary rounded-3xl p-6 md:p-8 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">{grupoAtivo.nome}</h2>
                <p className="text-muted-foreground mt-1">{grupoAtivo.descricao || 'Sem descrição.'}</p>
              </div>
              
              {/* CARD DO CÓDIGO DE CONVITE */}
              <div className="bg-secondary/50 border border-border/50 p-3 rounded-2xl flex items-center gap-4 min-w-[200px]">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Código de Convite</p>
                  <p className="font-mono font-bold text-lg text-foreground tracking-widest">{grupoAtivo.codigo_convite}</p>
                </div>
                <button 
                  onClick={copiarCodigoConvite}
                  className={`ml-auto p-2.5 rounded-xl transition-all ${copiado ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'}`}
                  title="Copiar código"
                >
                  {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 border-t border-border/50 pt-6">
              
              {/* COLUNA DO RANKING */}
              <div className="md:col-span-2">
                <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" /> Ranking de Foco
                </h3>
                <div className="space-y-3">
                  {ranking.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ninguém registrou horas neste grupo ainda.</p>
                  ) : (
                    ranking.map((membro, index) => (
                      <div key={membro.id} className="flex items-center justify-between bg-background border border-border/50 p-3.5 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-secondary text-muted-foreground'}`}>
                            {index + 1}º
                          </span>
                          <span className="font-semibold text-foreground">{membro.nome}</span>
                        </div>
                        <span className="font-bold text-primary font-mono bg-primary/5 px-3 py-1 rounded-lg">
                          {formatarTempo(membro.total_segundos)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* COLUNA LATERAL DE AÇÕES */}
              <div className="space-y-4">
                <div className="bg-accent/50 border border-primary/20 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-2"><Target className="h-4 w-4" /> Resumo do Grupo</h4>
                  <ul className="text-sm text-muted-foreground space-y-2 font-medium">
                    <li className="flex justify-between">Membros: <span className="text-foreground">{grupoAtivo.total_membros}</span></li>
                    <li className="flex justify-between">Seu Papel: <span className="text-foreground capitalize">{grupoAtivo.papel}</span></li>
                  </ul>
                </div>

                <button onClick={sairDoGrupo} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all">
                  <LogOut className="h-4 w-4" /> Sair do Grupo
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAIS --- */}
      {isModalCriarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={modalCardClass}>
            <button onClick={() => setIsModalCriarOpen(false)} className="absolute top-4 right-5 text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold tracking-tight mb-6 text-center text-foreground">Criar Novo Grupo</h2>
            <form onSubmit={criarGrupo} className="flex flex-col gap-2">
              <input type="text" placeholder="Nome do Grupo" required value={nomeGrupo} onChange={e => setNomeGrupo(e.target.value)} className={inputClass} />
              <input type="text" placeholder="Descrição (Opcional)" value={descGrupo} onChange={e => setDescGrupo(e.target.value)} className={inputClass} />
              <input type="password" placeholder="Senha para proteger a entrada" required value={senhaGrupo} onChange={e => setSenhaGrupo(e.target.value)} className={inputClass} />
              <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl mt-2 hover:bg-primary/90 active:scale-[0.99] transition-all">Criar e Gerar Código</button>
            </form>
          </div>
        </div>
      )}

      {isModalEntrarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={modalCardClass}>
            <button onClick={() => setIsModalEntrarOpen(false)} className="absolute top-4 right-5 text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold tracking-tight mb-6 text-center text-foreground">Entrar em um Grupo</h2>
            <form onSubmit={entrarGrupo} className="flex flex-col gap-2">
              <input type="text" placeholder="Código de Convite (Ex: AB12CD)" required value={codigoConvite} onChange={e => setCodigoConvite(e.target.value.toUpperCase())} className={`${inputClass} uppercase tracking-widest text-center`} maxLength="6" />
              <input type="password" placeholder="Senha do Grupo" required value={senhaGrupo} onChange={e => setSenhaGrupo(e.target.value)} className={inputClass} />
              <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl mt-2 hover:bg-primary/90 active:scale-[0.99] transition-all">Participar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}