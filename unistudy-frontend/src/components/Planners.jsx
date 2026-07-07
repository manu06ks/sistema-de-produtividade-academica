import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Kanban,
  CalendarDays,
  LayoutGrid,
  Archive,
  AlertCircle,
  Pencil,
  Circle,
  Clock,
  CheckCircle2,
  GripVertical,
  CalendarClock,
  Inbox,
  FileText,
} from 'lucide-react';

export default function Planners({ tarefas, setTarefas, token, carregarTarefas, abrirModalEditarTarefa }) {
  const [viewMode, setViewMode] = useState('kanban');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverCol, setDragOverCol] = useState(null);
  const [draggingId, setDraggingId] = useState(null);

  // --- LÓGICA DE DATAS E CORES ---
  const verificarPrazo = (data_entrega, status) => {
    if (status === 'concluida') return 'concluido';
    if (!data_entrega) return 'normal';
    
    const hoje = new Date(); 
    hoje.setHours(0, 0, 0, 0);
    
    // Limpa a data pegando apenas os 10 primeiros caracteres (AAAA-MM-DD)
    const dataLimpa = data_entrega.substring(0, 10);
    const entrega = new Date(dataLimpa + 'T00:00:00');
    
    const diffTime = entrega - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'atrasado';
    if (diffDays <= 2) return 'urgente';
    return 'normal';
  };

  const coresPrazo = {
    atrasado: "border-destructive border bg-destructive/10 text-destructive",
    urgente: "border-orange-500 border bg-orange-500/10 text-orange-600",
    normal: "border-border/50 border bg-card",
    concluido: "border-border bg-secondary/50 opacity-60",
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
  const handleDragStart = (e, id) => { e.dataTransfer.setData("text/plain", id); setDraggingId(id); };
  const handleDragEnd = () => { setDraggingId(null); setDragOverCol(null); };
  const handleDragOver = (e) => e.preventDefault();
  const handleColDragEnter = (col) => setDragOverCol(col);

  const handleDrop = async (e, novoStatus) => {
    e.preventDefault(); const id = e.dataTransfer.getData("text/plain");
    setDragOverCol(null); setDraggingId(null);
    setTarefas(prev => prev.map(t => t.id == id ? { ...t, status: novoStatus } : t));
    await fetch(`${import.meta.env.VITE_API_URL}/tarefas/${id}/status`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });
  };

  // Metadados visuais de cada coluna do Kanban
  const colunasKanban = {
    pendente: { label: 'A Fazer', icon: Circle, dot: 'bg-muted-foreground', accent: 'text-muted-foreground' },
    em_andamento: { label: 'Fazendo', icon: Clock, dot: 'bg-primary', accent: 'text-primary' },
    concluida: { label: 'Concluído', icon: CheckCircle2, dot: 'bg-emerald-500', accent: 'text-emerald-600' },
  };

  const formatarEntrega = (data_entrega) => {
    if (!data_entrega) return null;
    
    // Limpa a data antes de formatar para evitar o Invalid Date
    const dataLimpa = data_entrega.substring(0, 10);
    const d = new Date(dataLimpa + 'T00:00:00');
    
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
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
      <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
        <h3 className="font-bold text-sm text-primary">Planejamento</h3>

        {viewMode !== 'kanban' && (
          <div className="flex items-center gap-2 bg-card border border-border/50 px-2 py-1.5 rounded-xl shadow-sm">
            <button onClick={prevPeriod} className="text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg p-1 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold w-36 text-center text-foreground">
              {viewMode === 'mes' ? `${nomesMeses[mesAtual]} ${anoAtual}` : `Semana de ${inicioDaSemana.getDate()}/${inicioDaSemana.getMonth() + 1}`}
            </span>
            <button onClick={nextPeriod} className="text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg p-1 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button onClick={goToToday} className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary px-2 py-1 rounded-lg hover:bg-secondary transition-colors">
              <Calendar className="w-3.5 h-3.5" /> Hoje
            </button>
          </div>
        )}

        <div className="bg-secondary p-1 rounded-xl flex gap-1">
          <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Kanban className="w-4 h-4" /> Kanban
          </button>
          <button onClick={() => setViewMode('semana')} className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg transition-all ${viewMode === 'semana' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <CalendarDays className="w-4 h-4" /> Semana
          </button>
          <button onClick={() => setViewMode('mes')} className={`flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-lg transition-all ${viewMode === 'mes' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <LayoutGrid className="w-4 h-4" /> Mês
          </button>
        </div>
      </div>

      {/* VISÃO: KANBAN */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {['pendente', 'em_andamento', 'concluida'].map(col => {
            const meta = colunasKanban[col];
            const ColIcon = meta.icon;
            const tarefasCol = tarefas.filter(t => (t.status || 'pendente') === col);
            const isActiveDrop = dragOverCol === col && draggingId != null;
            return (
              <div
                key={col}
                onDragOver={handleDragOver}
                onDragEnter={() => handleColDragEnter(col)}
                onDrop={(e) => handleDrop(e, col)}
                className={`rounded-3xl p-3 min-h-[280px] flex flex-col transition-all duration-200 ${isActiveDrop ? 'bg-primary/5 border-2 border-dashed border-primary/50 ring-4 ring-primary/5' : 'bg-secondary/40 border border-border/50'}`}
              >
                {/* Cabeçalho da coluna */}
                <div className="flex justify-between items-center mb-4 px-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${meta.dot}`}></span>
                    <ColIcon className={`w-4 h-4 ${meta.accent}`} />
                    <h4 className="font-bold text-sm text-foreground">{meta.label}</h4>
                    <span className="text-[11px] font-bold text-muted-foreground bg-card border border-border/50 rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">{tarefasCol.length}</span>
                  </div>
                  {col === 'concluida' && tarefas.some(t => t.status === 'concluida') && (
                    <button onClick={arquivarConcluidas} title="Arquivar todas as concluídas" className="flex items-center gap-1 text-[10px] font-semibold bg-card border border-border/50 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 px-2 py-1 rounded-lg transition-colors">
                      <Archive className="w-3 h-3" /> Limpar
                    </button>
                  )}
                </div>

                {/* Lista de tarefas */}
                <div className="flex-1 space-y-2.5 px-1">
                  {tarefasCol.length === 0 && (
                    <div className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 text-center transition-colors ${isActiveDrop ? 'border-primary/40 text-primary' : 'border-border/60 text-muted-foreground/70'}`}>
                      <Inbox className="w-6 h-6" />
                      <span className="text-[11px] font-semibold">{isActiveDrop ? 'Solte aqui' : 'Nenhuma tarefa'}</span>
                    </div>
                  )}
                  {tarefasCol.map(t => {
                    const prazoStatus = verificarPrazo(t.data_entrega, t.status);
                    const isConcluida = t.status === 'concluida';
                    const entregaLabel = formatarEntrega(t.data_entrega);
                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onDragEnd={handleDragEnd}
                        className={`relative overflow-hidden rounded-2xl border p-3 pl-4 cursor-grab active:cursor-grabbing shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group ${draggingId == t.id ? 'opacity-40 rotate-1 scale-95' : 'opacity-100'} ${coresPrazo[prazoStatus]}`}
                      >
                        {/* Barra de cor da matéria */}
                        <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: isConcluida ? undefined : t.materia_cor }}></span>

                        {/* Topo: matéria + ações */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isConcluida ? undefined : t.materia_cor }}></span>
                            <span style={{ color: isConcluida ? undefined : t.materia_cor }} className={`font-bold text-[10px] uppercase tracking-wide truncate ${isConcluida ? 'text-muted-foreground' : ''}`}>{t.materia_nome}</span>
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => abrirModalEditarTarefa(t)} className="opacity-0 group-hover:opacity-100 bg-card border border-border/50 text-muted-foreground rounded-md p-1 hover:bg-secondary hover:text-primary transition-all">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <GripVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                          </div>
                        </div>

                        {/* Título */}
                        <p className={`font-semibold text-sm leading-snug text-pretty ${isConcluida ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.titulo}</p>

                        {/* Rodapé: badges */}
                        <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
                          {t.tipo === 'prova' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-md">
                              <AlertCircle className="w-2.5 h-2.5" /> PROVA
                            </span>
                          )}
                          {t.tipo && t.tipo !== 'prova' && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-md">
                              <FileText className="w-2.5 h-2.5" /> {t.tipo.toUpperCase()}
                            </span>
                          )}
                          {entregaLabel && (
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${prazoStatus === 'atrasado' ? 'bg-destructive/10 text-destructive' : prazoStatus === 'urgente' ? 'bg-orange-500/10 text-orange-600' : 'bg-secondary text-muted-foreground'}`}>
                              <CalendarClock className="w-2.5 h-2.5" /> {entregaLabel}
                            </span>
                          )}
                          {prazoStatus === 'atrasado' && <span className="text-[9px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-md">ATRASADO</span>}
                          {prazoStatus === 'urgente' && <span className="text-[9px] font-bold bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded-md">URGENTE</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VISÃO: CALENDÁRIO SEMANAL */}
      {viewMode === 'semana' && (
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm min-h-[350px]">
          <div className="grid grid-cols-7 gap-2 h-full">
            {diasDaSemanaAtual.map((data, i) => {
              const strData = formatYMD(data);
              const tarefasDoDia = tarefas.filter(t => t.data_entrega && t.data_entrega.startsWith(strData));
              const isHoje = formatYMD(new Date()) === strData;
              return (
                <div key={i} className={`flex flex-col rounded-2xl border overflow-hidden ${isHoje ? 'border-primary bg-primary/5' : 'border-border/50 bg-secondary/30'}`}>
                  <div className={`text-center py-2 border-b ${isHoje ? 'bg-primary text-primary-foreground border-primary' : 'border-border/50'}`}>
                    <div className={`text-[10px] font-bold uppercase ${isHoje ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{diasDaSemana[i]}</div>
                    <div className={`text-lg font-extrabold ${isHoje ? 'text-primary-foreground' : 'text-foreground'}`}>{data.getDate()}</div>
                  </div>
                  <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto min-h-[250px]">
                    {tarefasDoDia.map(t => (
                      <div key={t.id} onClick={() => abrirModalEditarTarefa(t)} className={`p-2 rounded-lg text-xs shadow-sm border-l-2 flex flex-col gap-1 cursor-pointer hover:opacity-80 transition-opacity ${t.status === 'concluida' ? 'bg-secondary/50 opacity-50' : 'bg-card'}`} style={{ borderLeftColor: t.status === 'concluida' ? undefined : t.materia_cor }}>
                        <span className={`text-[9px] font-bold truncate ${t.status === 'concluida' ? 'text-muted-foreground' : ''}`} style={{ color: t.status === 'concluida' ? undefined : t.materia_cor }}>{t.materia_nome}</span>
                        <span className={`font-semibold line-clamp-2 leading-tight flex items-center gap-1 ${t.status === 'concluida' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{t.tipo === 'prova' && <AlertCircle className="w-3 h-3 text-destructive shrink-0" />}{t.titulo}</span>
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
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-muted-foreground uppercase">{diasDaSemana.map(d => <div key={d}>{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: primeiroDiaDoMes }).map((_, i) => <div key={`empty-${i}`} className="min-h-[90px] bg-secondary/30 rounded-xl border border-transparent"></div>)}
            {Array.from({ length: diasNoMes }).map((_, i) => {
              const dia = i + 1; const dataFormatada = `${anoAtual}-${(mesAtual + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
              const tarefasDoDia = tarefas.filter(t => t.data_entrega && t.data_entrega.startsWith(dataFormatada));
              const isHoje = formatYMD(new Date()) === dataFormatada;
              return (
                <div key={dia} className={`min-h-[90px] rounded-xl border p-1.5 shadow-sm flex flex-col transition-colors ${isHoje ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/30'}`}>
                  <span className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isHoje ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{dia}</span>
                  <div className="flex flex-col gap-1 overflow-y-auto">
                    {tarefasDoDia.map(t => (
                      <div key={t.id} onClick={() => abrirModalEditarTarefa(t)} className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${t.status === 'concluida' ? 'bg-secondary text-muted-foreground line-through' : 'text-primary-foreground'}`} style={{ backgroundColor: t.status === 'concluida' ? undefined : t.materia_cor }}>
                        {t.tipo === 'prova' && <AlertCircle className="w-2.5 h-2.5 shrink-0" />}{t.titulo}
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
