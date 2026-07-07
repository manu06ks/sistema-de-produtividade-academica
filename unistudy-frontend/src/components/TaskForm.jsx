import { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Ajuste o caminho para onde o seu script do botão está salvo

export default function TaskForm({ materias, token, carregarTarefas, roxoPrincipal, fundoInput, fundoBotaoModal, inputClass }) {
  const [tipoItem, setTipoItem] = useState('tarefa');
  const [materiaTarefa, setMateriaTarefa] = useState('');
  const [tituloTarefa, setTituloTarefa] = useState('');
  const [dataTarefa, setDataTarefa] = useState('');
  const [descTarefa, setDescTarefa] = useState('');
  const [arquivoTarefa, setArquivoTarefa] = useState(null);

  // Novos estados de UX: loading + feedback de erro/sucesso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { tipo: 'sucesso' | 'erro', msg: string }

  const submitTarefa = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      // --- LÓGICA DE FormData MANTIDA EXATAMENTE COMO ESTAVA ---
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

      const res = await fetch(`${import.meta.env.VITE_API_URL}/tarefas`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error('Falha ao salvar');

      // Feedback de sucesso antes de limpar os campos
      setFeedback({ tipo: 'sucesso', msg: 'Item adicionado à agenda!' });

      setTituloTarefa('');
      setDataTarefa('');
      setDescTarefa('');
      setArquivoTarefa(null);
      e.target.reset();

      carregarTarefas();

      // Remove o aviso de sucesso após um instante
      setTimeout(() => setFeedback(null), 2500);
    } catch (e) {
      console.error("Erro ao criar tarefa:", e);
      setFeedback({ tipo: 'erro', msg: 'Não foi possível salvar. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 min-h-[420px]">
      <h3 className="text-sm font-bold text-center mb-5 tracking-tight" style={{ color: roxoPrincipal }}>
        Adicionar na agenda
      </h3>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4 text-xs font-semibold transition-all ${
            feedback.tipo === 'sucesso'
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-500'
          }`}
        >
          {feedback.tipo === 'sucesso'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {feedback.msg}
        </div>
      )}

      <form onSubmit={submitTarefa} className="flex flex-col gap-3">

        <div className="flex flex-col gap-1">
          <label htmlFor="tf-tipo" className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tipo</label>
          <select
            id="tf-tipo"
            aria-label="Tipo do item"
            value={tipoItem}
            onChange={e => setTipoItem(e.target.value)}
            style={{ backgroundColor: fundoInput }}
            className={inputClass}
          >
            <option value="tarefa">Tarefa</option>
            <option value="prova">Prova</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tf-materia" className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Disciplina</label>
          <select
            id="tf-materia"
            aria-label="Disciplina"
            required
            value={materiaTarefa}
            onChange={e => setMateriaTarefa(e.target.value)}
            style={{ backgroundColor: fundoInput }}
            className={inputClass}
          >
            <option value="">Selecione a disciplina...</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tf-titulo" className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Título</label>
          <input
            id="tf-titulo"
            type="text"
            placeholder="Ex: Trabalho de Cálculo"
            required
            value={tituloTarefa}
            onChange={e => setTituloTarefa(e.target.value)}
            style={{ backgroundColor: fundoInput }}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tf-data" className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Data de entrega</label>
          <input
            id="tf-data"
            type="date"
            required
            value={dataTarefa}
            onChange={e => setDataTarefa(e.target.value)}
            style={{ backgroundColor: fundoInput }}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tf-desc" className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Descrição (opcional)</label>
          <textarea
            id="tf-desc"
            placeholder="Conteúdos, observações..."
            value={descTarefa}
            onChange={e => setDescTarefa(e.target.value)}
            style={{ backgroundColor: fundoInput }}
            className={`${inputClass} h-20 resize-none py-2`}
          />
        </div>

        <div className="flex flex-col gap-1.5 mb-1">
          <label htmlFor="tf-arquivo" className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            <Paperclip className="w-3 h-3" /> Anexo opcional
          </label>
          <input
            id="tf-arquivo"
            type="file"
            aria-label="Anexo opcional"
            onChange={e => setArquivoTarefa(e.target.files[0])}
            className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#d1e0ec] file:text-[#c175e7] file:cursor-pointer hover:file:brightness-95 file:transition-all cursor-pointer"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: fundoBotaoModal, color: roxoPrincipal }}
          className="w-full font-bold py-3 rounded-full mt-1 text-sm flex items-center justify-center gap-2 transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed border-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>Criar {tipoItem === 'prova' ? 'Prova' : 'Tarefa'}</>
          )}
        </Button>
      </form>
    </div>
  );
}
