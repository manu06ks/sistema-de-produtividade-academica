import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Timer, Target } from 'lucide-react';

export default function StudyAnalytics({ token }) {
  const [dados, setDados] = useState({ porMateria: [], porTipo: [] });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarEstatisticas = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/estatisticas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();

        // Mapeamento mantido intacto. O 'fill' está pronto para ser usado.
        const porMateriaFormatado = json.porMateria.map(item => ({
          nome: item.materia,
          minutos: Math.round(item.total_segundos / 60),
          fill: item.cor 
        }));

        const porTipoFormatado = json.porTipo.map(item => ({
          nome: item.tipo === 'prova' ? 'Provas' : 'Tarefas',
          minutos: Math.round(item.total_segundos / 60)
        }));

        setDados({ porMateria: porMateriaFormatado, porTipo: porTipoFormatado });
        setCarregando(false);
      } catch (error) {
        console.error("Erro ao carregar gráficos:", error);
        setCarregando(false);
      }
    };

    if (token) buscarEstatisticas();
  }, [token]);

  // Usando as cores do Tailwind v4 (primary e secondary) para manter o padrão
  const CORES_TIPO = ['#9046eb', '#ff7a00'];

  if (carregando) {
    return (
      <div className="bg-card border border-border/50 rounded-3xl p-8 text-center font-bold text-muted-foreground shadow-sm">
        Carregando gráficos...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* GRÁFICO 1: Tempo por Matéria */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold tracking-tight mb-8 text-foreground flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Timer className="h-5 w-5 text-primary" />
            </span>
            Tempo de Estudo por Disciplina
          </h3>

          {dados.porMateria.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center my-auto">Nenhum estudo registrado ainda.</p>
          ) : (
            <div className="flex-1 w-full min-h-[300px] rounded-2xl bg-secondary/20 p-3">
              <ResponsiveContainer width="100%" height="100%">
                {/* Aumentamos a margem inferior (bottom) para acomodar o texto inclinado */}
                <BarChart data={dados.porMateria} margin={{ bottom: 40, left: -20, right: 10, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />

                  {/* angle={-45} para melhor leitura e dx/dy para posicionar corretamente */}
                  <XAxis 
                    dataKey="nome" 
                    tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} 
                    interval={0} 
                    angle={-45} 
                    textAnchor="end"
                    dx={-5}
                    dy={5}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis 
                    tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: 'var(--accent)'}} 
                    contentStyle={{borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    itemStyle={{fontWeight: 'bold'}}
                  />

                  {/* O Recharts automaticamente usará a propriedade 'fill' do objeto de dados */}
                  <Bar dataKey="minutos" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* GRÁFICO 2: Provas vs Tarefas */}
        <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold tracking-tight mb-8 text-foreground flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </span>
            Foco: Provas vs Tarefas
          </h3>

          {dados.porTipo.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center my-auto">Nenhum estudo registrado ainda.</p>
          ) : (
            <div className="flex-1 w-full min-h-[300px] rounded-2xl bg-secondary/20 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dados.porTipo}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="minutos"
                    nameKey="nome" /* <-- ESSA É A SOLUÇÃO MÁGICA PARA A LEGENDA */
                  >
                    {dados.porTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_TIPO[index % CORES_TIPO.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    itemStyle={{fontWeight: 'bold'}}
                    formatter={(value, name) => [`${value} minutos`, name]}
                  />
                  {/* A legenda agora usará a propriedade nameKey definida no Pie */}
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
