import { GraduationCap, User, Plus } from "lucide-react"

export default function SubjectList({ materias, setMateriaDetalhe, abrirModalNovaMateria, cardClass, circleBtnClass }) {
  return (
    <div className={`${cardClass} min-h-[140px]`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm tracking-tight text-gray-800 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-3.5 w-3.5" />
          </span>
          Minhas disciplinas
        </h3>
        <button
          onClick={abrirModalNovaMateria}
          aria-label="Adicionar disciplina"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:brightness-95 hover:shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
        {materias.map((m) => (
          <button
            key={m.id}
            onClick={() => setMateriaDetalhe(m)}
            className="group relative min-w-[150px] max-w-[150px] cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-gray-200 hover:shadow-md"
          >
            <span
              className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: m.cor }}
              aria-hidden="true"
            />
            <span
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${m.cor}1a`, color: m.cor }}
              aria-hidden="true"
            >
              <GraduationCap className="h-4 w-4" />
            </span>
            <strong className="block truncate text-sm font-semibold text-gray-800">{m.nome}</strong>
            <span className="mt-1 flex items-center gap-1 truncate text-[11px] text-gray-500">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">{m.professor || "Sem professor"}</span>
            </span>
          </button>
        ))}

        <button
          onClick={abrirModalNovaMateria}
          className="flex min-w-[150px] max-w-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-transparent p-4 text-gray-400 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors group-hover:bg-primary/10">
            <Plus className="h-4 w-4" />
          </span>
          <span className="text-xs font-semibold">Nova disciplina</span>
        </button>
      </div>
    </div>
  )
}
