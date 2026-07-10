import { useState, useEffect } from 'react';
import { Bell, Check, X, Users, Copy, LogIn } from 'lucide-react';


// CARD DE NOTIFICAÇÃO            
function NotificationCard({ notificacao, onAceitar, onRecusar }) {
  const isInscricao = notificacao.tipo_notificacao === 'inscricao';
  const textoAcao = isInscricao ? "pediu para entrar em" : "compartilhou o item";
  return (
    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
          <Users className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-gray-800">
            <span className="font-semibold">{notificacao.autor}</span>{' '}
            {textoAcao}{' '}
            {!isInscricao && <span className="font-semibold">{'\u201C'}{notificacao.tarefa}{'\u201D'}</span>}{' '}
            {!isInscricao && 'em '}
            <span className="font-medium text-purple-600">{notificacao.disciplina}</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {new Date(notificacao.tempo).toLocaleDateString('pt-BR')}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={onAceitar}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-100 active:scale-95"
            >
              <Check className="h-3.5 w-3.5" /> Aceitar
            </button>
            <button
              onClick={onRecusar}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition-all hover:bg-gray-200 hover:text-gray-700 active:scale-95"
            >
              <X className="h-3.5 w-3.5" /> Recusar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// DROPDOWN DE NOTIFICAÇÕES (Sininho)                             
export function NotificationBell({ token, onTarefaAdicionada }) {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState([]);

  useEffect(() => {
    const buscarNotificacoes = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/notificacoes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setNotificacoes(await res.json());
      } catch (e) { console.error("Erro ao carregar notificações", e); }
    };
    
    if (token) buscarNotificacoes();
  }, [token, aberto]); 

  const naoLidas = notificacoes.length;

  const responderNotificacao = async (id, aceitar) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/notificacoes/${id}/responder`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ aceitar })
      });
      
      setNotificacoes((prev) => prev.filter((n) => n.id !== id));
      
      if (aceitar && onTarefaAdicionada) {
        onTarefaAdicionada(); 
      }
    } catch (e) { console.error("Erro ao responder", e); }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Notificações"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-800 active:scale-95"
      >
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div className="absolute right-0 z-50 mt-3 w-80 origin-top-right overflow-hidden rounded-2xl border border-gray-200/80 bg-white/80 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-bold text-gray-800">Notificações</h3>
              {naoLidas > 0 && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-600">
                  {naoLidas} nova{naoLidas > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
              {notificacoes.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Bell className="h-6 w-6 text-gray-300" />
                  <p className="text-sm font-medium text-gray-400">Tudo em dia por aqui</p>
                </div>
              ) : (
                notificacoes.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notificacao={n}
                    onAceitar={() => responderNotificacao(n.id, true)}
                    onRecusar={() => responderNotificacao(n.id, false)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
//"ENTRAR EM DISCIPLINA"                             
export function JoinSubjectModal({ isOpen, onClose, token, onMateriaInscrita }) {
  const [codigo, setCodigo] = useState('');
  const [carregando, setCarregando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!codigo) return;
    
    setCarregando(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/materias/entrar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ codigo_compartilhamento: codigo })
      });

      const dados = await res.json();

      if (res.ok) {
        alert(dados.mensagem);
        setCodigo('');
        if (onMateriaInscrita) onMateriaInscrita(); // Atualiza a lista de matérias no painel
        onClose();
      } else {
        alert(dados.erro || "Erro ao entrar na disciplina.");
      }
    } catch (error) {
      console.error("Erro ao entrar na disciplina:", error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-800">Entrar em Disciplina</h2>
              <p className="text-xs text-gray-500">Insira o código compartilhado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="Ex: A1B2C3"
            maxLength={8}
            required
            disabled={carregando}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-center text-lg font-bold uppercase tracking-[0.4em] text-gray-800 placeholder:font-medium placeholder:tracking-[0.3em] placeholder:text-gray-300 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={carregando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3.5 font-semibold text-white shadow-sm transition-all hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" /> {carregando ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
// CONVITE (Código + Copiar)                            
export function InviteBadge({ codigo }) {
  const [copiado, setCopiado] = useState(false);

  if (!codigo) return null;

  const handleCopiar = () => {
    navigator.clipboard?.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-3 pr-1 shadow-sm">
      <span className="text-[11px] font-medium text-gray-500">Código:</span>
      <span className="font-mono text-sm font-bold tracking-widest text-gray-800">{codigo}</span>
      <button
        onClick={handleCopiar}
        aria-label="Copiar código"
        className={`flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-90 ${
          copiado ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
        }`}
      >
        {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}