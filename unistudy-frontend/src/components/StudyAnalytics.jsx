import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { Timer, CheckCircle2, Flame, TrendingUp, BookOpen, BarChart3, Loader2 } from 'lucide-react';

// Gera a estrutura do calendário vazia (tudo 0) para não quebrar a tela
// Não são dados falsos, é apenas a ausência de atividade registrada.
function gerarHeatmapVazio() {
  const semanas = 18;
  const dias = 7;
  const grid = [];
  for (let s = 0; s < semanas; s++) {
    const col = [];
    for (let d = 0; d < dias; d++) {
      col.push(0);
    }
    grid.push(col);
  }
  return grid;
}

const NIVEIS_HEATMAP = ['bg-secondary', 'bg-primary/25', 'bg-primary/50', 'bg-primary/75', 'bg-primary'];
const FILTROS = ['Esta Semana', 'Este Mês', 'Este Ano'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr'];

function CustomTooltip({ active, payload, sufixo = '' }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-card/90 px-3 py-2 shadow-md backdrop-blur-md">
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color || p.payload?.cor }}>
          {p.name}: <span className="text-foreground">{p.value}{sufixo}</span>
        </p>
      ))}
    </div>
  );
}

export default function StudyAnalytics({ token, cardClass }) {
  const [filtro, setFiltro] = useState('Esta Semana');
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState(null);

  useEffect(() => {
    const carregarEstatisticas = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/estatisticas?filtro=${filtro}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Rota de estatísticas indisponível.");
        
        const dadosDoBanco = await res.json();
        
        // Puxa estritamente a realidade do banco. Se não houver, assume vazio/zero.
        setDados({
          horasTotais: dadosDoBanco.horasTotais || 0,
          comparacaoHoras: dadosDoBanco.comparacaoHoras || '',
          tarefasConcluidas: dadosDoBanco.tarefasConcluidas || 0,
          tarefasTotal: dadosDoBanco.tarefasTotal || 0,
          streak: dadosDoBanco.streak || 0,
          disciplinas: dadosDoBanco.disciplinas || [],
          entregas: dadosDoBanco.entregas || [],
          heatmap: dadosDoBanco.heatmap || gerarHeatmapVazio()
        });

      } catch (error) {
        console.warn("Backend falhou. Exibindo dados vazios reais.");
        // Sem fallbacks falsos. Se der erro, mostra tudo zerado.
        setDados({
          horasTotais: 0,
          comparacaoHoras: '',
          tarefasConcluidas: 0,
          tarefasTotal: 0,
          streak: 0,
          disciplinas: [],
          entregas: [],
          heatmap: gerarHeatmapVazio()
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) carregarEstatisticas();
  }, [filtro, token]);

  if (loading || !dados) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cardBase = cardClass || 'bg-card border border-border/50 rounded-3xl shadow-sm';
  const taxaConclusao = dados.tarefasTotal > 0 ? Math.round((dados.tarefasConcluidas / dados.tarefasTotal) * 100) : 0;
  const horasTotalCalculado = dados.disciplinas.reduce((acc, d) => acc + (d.horas || 0), 0);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            Estatísticas de Desempenho
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe seu foco, entregas e consistência ao longo do tempo.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-1 self-start">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filtro === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${cardBase} p-6`}>
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <Timer className="h-5 w-5 text-primary" />
            </span>
            {dados.comparacaoHoras && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> {dados.comparacaoHoras}
              </span>
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">Horas de Foco Totais</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{dados.horasTotais}h</p>
        </div>

        <div className={`${cardBase} p-6`}>
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </span>
            <span className="text-[11px] font-bold text-muted-foreground">{taxaConclusao}%</span>
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">Tarefas Concluídas</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {dados.tarefasConcluidas} <span className="text-lg text-muted-foreground">/ {dados.tarefasTotal}</span>
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${taxaConclusao}%` }} />
          </div>
        </div>

        <div className={`${cardBase} p-6`}>
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-[11px] font-bold text-orange-600">
              {dados.streak > 0 ? 'Em chamas' : 'Comece hoje'}
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-muted-foreground">Ofensiva (Streak)</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {dados.streak} <span className="text-lg text-muted-foreground">dias</span>
          </p>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${cardBase} p-6`}>
          <div className="mb-6 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </span>
            <h3 className="text-base font-bold tracking-tight text-foreground text-balance">
              Tempo por Disciplina
            </h3>
          </div>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-52 w-52 shrink-0">
              {dados.disciplinas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dados.disciplinas}
                      dataKey="horas"
                      nameKey="nome"
                      cx="50%" cy="50%" innerRadius={62} outerRadius={90} paddingAngle={3} stroke="none"
                    >
                      {dados.disciplinas.map((d, i) => (
                        <Cell key={i} fill={d.cor || '#7c3aed'} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip sufixo="h" />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-dashed border-border/50 text-xs font-medium text-muted-foreground">
                  Sem dados
                </div>
              )}
              
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">
                  {horasTotalCalculado.toFixed(1)}h
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">total</span>
              </div>
            </div>
            <ul className="w-full flex-1 space-y-3">
              {dados.disciplinas.length === 0 && (
                <li className="text-sm italic text-muted-foreground">Nenhuma atividade registrada.</li>
              )}
              {dados.disciplinas.map((d) => (
                <li key={d.nome} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.cor || '#7c3aed' }} />
                    <span className="truncate text-sm font-medium text-foreground">{d.nome}</span>
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">{d.horas}h</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`${cardBase} p-6`}>
          <div className="mb-6 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </span>
              <h3 className="text-base font-bold tracking-tight text-foreground">Volume de Entregas</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#c175e7]" /> Criadas</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Concluídas</span>
            </div>
          </div>
          <div className="h-52 w-full">
            {dados.entregas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados.entregas} barGap={4}>
                  <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <YAxis axisLine={false} tickLine={false} width={24} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                  <Tooltip cursor={{ fill: 'var(--secondary)', opacity: 0.4 }} content={<CustomTooltip />} />
                  <Bar dataKey="criadas" name="Criadas" fill="#c175e7" radius={[6, 6, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="concluidas" name="Concluídas" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm italic text-muted-foreground border border-dashed border-border/50 rounded-xl">
                Sem registros para o período
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}