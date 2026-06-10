export default function Library({ materiais, setIsModalDocumentoOpen, cardClass, circleBtnClass }) {
  return (
    <div className={`${cardClass} flex items-center justify-between min-h-[140px]`}>
      <div className="flex-1 h-full flex flex-col">
        <h3 className="font-bold text-sm text-gray-800 mb-3">Biblioteca</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {materiais.map(m => (
            <div key={m.id} className="min-w-[150px] bg-white p-2 rounded-lg border border-gray-100 shadow-sm text-xs">
              <strong className="block truncate">{m.titulo}</strong>
              <a href={`${import.meta.env.VITE_API_URL}/${m.caminho_arquivo}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">Abrir</a>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => setIsModalDocumentoOpen(true)} className={`${circleBtnClass} ml-4`}>Add<br/>Doc.</button>
    </div>
  );
}