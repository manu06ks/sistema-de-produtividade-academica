import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function StudyAnalytics({ token, cardClass }) {
  const [dados, setDados] = useState({ porMateria: [], porTipo: [] });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarEstatisticas = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/estatisticas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();

        // Transformando segundos em minutos e mapeando a cor para o gráfico
        const porMateriaFormatado = json.porMateria.map(item => ({
          nome: item.materia,
          minutos: Math.round(item.total_segundos / 60),
          fill: item.cor // O Recharts usa 'fill' para pintar a barra na cor exata da matéria!
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

  // Cores do gráfico de pizza (Roxo principal e um Laranja para dar contraste nas provas)
  const CORES_TIPO = ['#c175e7', '#f4a261']; 

  if (carregando) return <div className={`${cardClass} p-8 text-center font-bold text-gray-400`}>Carregando gráficos...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO 1: Tempo por Matéria */}
        <div className={`${cardClass} p-6 min-h-[350px] flex flex-col`}>
          <h3 className="font-bold text-sm mb-6 text-gray-800">⏱️ Tempo de Estudo por Disciplina (Minutos)</h3>
          {dados.porMateria.length === 0 ? (
            <p className="text-xs text-gray-400 text-center my-auto">Nenhum estudo registrado ainda.</p>
          ) : (
            <div className="flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados.porMateria}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="nome" tick={{fontSize: 10}} interval={0} angle={-20} textAnchor="end" />
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip cursor={{fill: '#f9edf8'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="minutos" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* GRÁFICO 2: Provas vs Tarefas */}
        <div className={`${cardClass} p-6 min-h-[350px] flex flex-col`}>
          <h3 className="font-bold text-sm mb-6 text-gray-800">🎯 Foco: Provas vs Tarefas</h3>
          {dados.porTipo.length === 0 ? (
            <p className="text-xs text-gray-400 text-center my-auto">Nenhum estudo registrado ainda.</p>
          ) : (
            <div className="flex-1 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dados.porTipo}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="minutos"
                  >
                    {dados.porTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CORES_TIPO[index % CORES_TIPO.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}