export default function SubjectList({ materias, setMateriaDetalhe, abrirModalNovaMateria, cardClass, circleBtnClass }) {
  return (
    <div className={`${cardClass} flex items-center justify-between min-h-[140px]`}>
      <div className="flex-1 h-full flex flex-col">
        <h3 className="font-bold text-sm text-gray-800 mb-3">Minhas disciplinas</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {materias.map(m => (
            <div key={m.id} onClick={() => setMateriaDetalhe(m)} className="min-w-[120px] bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex flex-col items-start border-l-4 cursor-pointer hover:bg-gray-50 transition-colors" style={{borderLeftColor: m.cor}}>
              <strong className="text-xs truncate w-full pr-2">{m.nome}</strong>
              <span className="text-[10px] text-gray-500 truncate w-full">{m.professor || '-'}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={abrirModalNovaMateria} className={`${circleBtnClass} ml-4`}>Add<br/>Disc.</button>
    </div>
  );
}