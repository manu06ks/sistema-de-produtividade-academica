import { useState } from 'react';

export default function TaskForm({ materias, token, carregarTarefas, roxoPrincipal, fundoInput, fundoBotaoModal, inputClass }) {
  const [tipoItem, setTipoItem] = useState('tarefa');
  const [materiaTarefa, setMateriaTarefa] = useState('');
  const [tituloTarefa, setTituloTarefa] = useState('');
  const [dataTarefa, setDataTarefa] = useState('');
  const [descTarefa, setDescTarefa] = useState('');
  const [arquivoTarefa, setArquivoTarefa] = useState(null);

  const submitTarefa = async (e) => {
    e.preventDefault();
    try {
      // Como tem arquivo, precisamos usar FormData em vez de JSON puro
      const formData = new FormData();
      formData.append('materia_id', materiaTarefa);
      formData.append('titulo', tituloTarefa);
      formData.append('data_entrega', dataTarefa);
      formData.append('tipo', tipoItem);
      formData.append('prioridade', tipoItem === 'prova' ? 'alta' : 'media');
      formData.append('descricao', descTarefa);
      
      if (arquivoTarefa) {
        formData.append('arquivo', arquivoTarefa);
      }

      await fetch(`${import.meta.env.VITE_API_URL}/tarefas`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` }, // Não passamos Content-Type aqui, o navegador define o boundary do FormData automaticamente
        body: formData 
      });

      // Limpa os estados do formulário
      setTituloTarefa(''); 
      setDataTarefa('');
      setDescTarefa('');
      setArquivoTarefa(null);
      e.target.reset(); // Reseta o input de arquivo visualmente
      
      carregarTarefas();
    } catch(e) { console.error("Erro ao criar tarefa:", e); }
  };

  return (
    <div className="bg-[#fffdf9] rounded-xl shadow-sm p-4 min-h-[420px]">
      <h3 className="text-sm font-bold text-center mb-4">Adicionar na agenda</h3>
      <form onSubmit={submitTarefa} className="flex flex-col gap-1">
        
        <select value={tipoItem} onChange={e => setTipoItem(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass}>
          <option value="tarefa">📝 Tarefa</option>
          <option value="prova">🚨 Prova</option>
        </select>
        
        <select required value={materiaTarefa} onChange={e => setMateriaTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass}>
          <option value="">Selecione a disciplina...</option>
          {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
        
        <input type="text" placeholder="Título" required value={tituloTarefa} onChange={e => setTituloTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass} />
        
        <input type="date" required value={dataTarefa} onChange={e => setDataTarefa(e.target.value)} style={{backgroundColor: fundoInput}} className={inputClass} />
        
        <textarea 
          placeholder="Descrição / Conteúdos (opcional)" 
          value={descTarefa} 
          onChange={e => setDescTarefa(e.target.value)} 
          style={{backgroundColor: fundoInput}} 
          className={`${inputClass} h-20 resize-none py-2`}
        />

        <div className="flex flex-col mb-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">Anexo opcional:</label>
          <input 
            type="file" 
            onChange={e => setArquivoTarefa(e.target.files[0])} 
            className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#d1e0ec] file:text-[#c175e7] cursor-pointer" 
          />
        </div>

        <button type="submit" style={{backgroundColor: fundoBotaoModal, color: roxoPrincipal}} className="w-full font-bold py-3 rounded-full mt-1 text-sm">
          Criar {tipoItem === 'prova' ? 'Prova' : 'Tarefa'}
        </button>
      </form>
    </div>
  );
}