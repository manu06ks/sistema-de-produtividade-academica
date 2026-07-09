import { BookOpen, User, Plus, GraduationCap } from 'lucide-react';

export default function SubjectList({ 
  materias, 
  setMateriaDetalhe, 
  abrirModalNovaMateria, 
  abrirModalEntrarMateria, 
  cardClass 
}) {
  return (
    <div className={`${cardClass} flex flex-col min-h-[160px] justify-between p-5 bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden`}>
      
      {/* Cabeçalho da Seção */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> Minhas Disciplinas
        </h3>
        
        <div className="flex gap-2">
          <button 
            onClick={abrirModalEntrarMateria} 
            className="flex items-center gap-1 text-[11px] font-bold bg-secondary text-secondary-foreground border border-border/60 px-3 py-1.5 rounded-xl hover:bg-accent transition-all active:scale-95 whitespace-nowrap"
          >
            Entrar com Código
          </button>
          <button 
            onClick={abrirModalNovaMateria} 
            className="flex items-center gap-1 text-[11px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl hover:brightness-110 shadow-sm transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-3 w-3" /> Criar
          </button>
        </div>
      </div>

      {/* Container do Carrossel com scroll forçado */}
      <div className="flex gap-3 overflow-x-auto pb-3 w-full scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {materias.length === 0 ? (
          <div className="w-full py-4 text-center border border-dashed border-border/60 rounded-xl">
            <p className="text-xs text-muted-foreground italic">Nenhuma disciplina cadastrada ou vinculada.</p>
          </div>
        ) : (
          materias.map(m => (
            <div 
              key={m.id} 
              onClick={() => setMateriaDetalhe(m)} 
              className="min-w-[150px] w-[150px] bg-background border border-border/40 p-3.5 rounded-xl shadow-sm flex flex-col items-start relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group shrink-0"
            >
              {/* Detalhe superior com a cor da disciplina */}
              <span className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: m.cor }}></span>
              
              <div className="flex items-center gap-1.5 mb-1.5 w-full">
                <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: m.cor }} />
                <strong className="text-xs font-bold text-foreground truncate w-full pr-1 group-hover:text-primary transition-colors">
                  {m.nome}
                </strong>
              </div>

              <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate w-full">
                <User className="h-3 w-3 shrink-0" /> {m.professor || 'Não informado'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}