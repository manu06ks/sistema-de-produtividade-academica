import { FileText, Plus, ExternalLink, Library as LibraryIcon, Trash2 } from 'lucide-react';

export default function Library({ 
  materiais, 
  setIsModalDocumentoOpen, 
  deletarMaterial, 
  cardClass 
}) {
  return (
    <div className={`${cardClass} flex flex-col min-h-[160px] justify-between p-5 bg-card border border-border/50 rounded-2xl shadow-sm`}>
      
      {/* Cabeçalho da Seção */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <LibraryIcon className="h-4 w-4 text-primary" /> Biblioteca
        </h3>
        
        {/* Botão de Ação Estilo SaaS (Resolve o bug visual!) */}
        <button 
          onClick={() => setIsModalDocumentoOpen(true)} 
          className="flex items-center gap-1 text-[11px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl hover:brightness-110 shadow-sm transition-all active:scale-95"
        >
          <Plus className="h-3 w-3" /> Novo Doc
        </button>
      </div>

      {/* Carrossel Horizontal de Arquivos */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {materiais.length === 0 ? (
          <div className="w-full py-4 text-center border border-dashed border-border/60 rounded-xl">
            <p className="text-xs text-muted-foreground italic">Nenhum arquivo na biblioteca.</p>
          </div>
        ) : (
          materiais.map(m => (
            <div 
              key={m.id} 
              className="min-w-[150px] max-w-[150px] flex-shrink-0 bg-background border border-border/40 p-3.5 rounded-xl shadow-sm ..."
            >
              <div className="flex items-start gap-1.5 mb-3 w-full">
                <FileText className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <div className="flex flex-col w-full min-w-0">
                  <strong className="text-xs font-bold text-foreground truncate w-full pr-1">
                    {m.titulo}
                  </strong>
                  <span className="text-[9px] text-muted-foreground truncate w-full mt-0.5">
                    {m.materia_nome || 'Sem disciplina'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 w-full mt-2">
                <a 
                  href={`${import.meta.env.VITE_API_URL}/${m.caminho_arquivo}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex-1 text-[10px] flex items-center justify-center gap-1 font-bold text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary py-1.5 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> Abrir
                </a>
                <button
                  onClick={() => deletarMaterial(m.id)}
                  title="Remover do meu painel"
                  className="p-1.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}