import { Library as LibraryIcon, FileText, ExternalLink, Plus } from "lucide-react"

export default function Library({ materiais, setIsModalDocumentoOpen }) {
  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex items-center justify-between min-h-[140px]">
      <div className="flex-1 h-full flex flex-col">
        <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <LibraryIcon className="w-5 h-5 text-primary" />
          Biblioteca
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 mt-4">
          {materiais.map((m) => (
            <div
              key={m.id}
              className="min-w-[160px] bg-secondary/50 border border-border/50 p-3.5 rounded-2xl shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-transform"
            >
              <strong className="flex items-center gap-1.5 text-xs font-semibold text-foreground truncate">
                <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{m.titulo}</span>
              </strong>
              <a
                href={`${import.meta.env.VITE_API_URL}/${m.caminho_arquivo}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground py-1 px-2 rounded-md transition-colors inline-flex items-center gap-1 mt-2 w-fit"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir
              </a>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => setIsModalDocumentoOpen(true)}
        className="w-20 h-20 rounded-2xl bg-secondary border border-border/60 flex flex-col items-center justify-center text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-accent transition-all flex-shrink-0 shadow-sm ml-4"
      >
        <Plus className="w-5 h-5 mb-1" />
        Add Doc.
      </button>
    </div>
  )
}
