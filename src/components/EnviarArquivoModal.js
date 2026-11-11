'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ACCEPT_ARQUIVOS, MAX_NOME, nomeParaExibir } from '@/lib/arquivos';
import { conferirArquivoEscolhido, enviarParaApi, formatarTamanho } from '@/lib/anexos';

const campoClass =
  'w-full rounded-xl border border-border/60 bg-input/50 p-3 text-sm font-medium text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60';
const rotuloClass = 'text-[10px] font-bold uppercase tracking-wide text-muted-foreground';

export default function EnviarArquivoModal({ disciplinas, disciplinaInicial, onFechar, onEnviado }) {
  // Se só existe uma disciplina, já vem escolhida.
  const [disciplinaId, setDisciplinaId] = useState(
    disciplinaInicial || (disciplinas.length === 1 ? String(disciplinas[0].id) : '')
  );
  const [arquivo, setArquivo] = useState(null);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const escolha = useRef(0); // para ignorar a conferência de um arquivo que já foi trocado

  async function escolher(e) {
    const campo = e.target;
    const arquivoEscolhido = campo.files?.[0] ?? null;
    const numero = ++escolha.current;

    setErro('');
    setArquivo(null);
    if (!arquivoEscolhido) return;

    const problema = await conferirArquivoEscolhido(arquivoEscolhido);
    if (numero !== escolha.current) return;

    if (problema) {
      setErro(problema);
      campo.value = ''; // permite escolher o mesmo arquivo de novo depois de corrigi-lo
      return;
    }
    setArquivo(arquivoEscolhido);
  }

  async function enviar(e) {
    e.preventDefault();
    if (!arquivo || !disciplinaId) return;
    setErro('');
    setEnviando(true);

    const r = await enviarParaApi(
      '/api/materiais',
      { disciplina_id: disciplinaId, nome: nome.trim() },
      arquivo
    );
    setEnviando(false);

    if (!r.ok) {
      setErro(r.erro);
      return;
    }
    onEnviado(r.dados);
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-enviar-arquivo"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border/50 bg-card p-8 shadow-xl"
      >
        <button
          type="button"
          onClick={onFechar}
          disabled={enviando}
          aria-label="Fechar"
          className="absolute right-5 top-4 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>

        <h2
          id="titulo-enviar-arquivo"
          className="mb-1 text-center text-2xl font-bold tracking-tight text-foreground"
        >
          Enviar arquivo
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Todos os alunos da disciplina poderão abrir este arquivo.
        </p>

        {erro && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-destructive/10 p-3 text-center text-sm font-medium text-destructive"
          >
            {erro}
          </div>
        )}

        <form onSubmit={enviar} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="env-disciplina" className={rotuloClass}>Disciplina</label>
            <select
              id="env-disciplina"
              required
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              className={campoClass}
            >
              <option value="">Escolha a disciplina</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="env-arquivo" className={rotuloClass}>Arquivo</label>
            <input
              id="env-arquivo"
              type="file"
              accept={ACCEPT_ARQUIVOS}
              onChange={escolher}
              className="w-full cursor-pointer rounded-xl border border-dashed border-border/60 bg-input/30 p-2.5 text-xs text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-secondary-foreground hover:file:bg-accent"
            />
            <p className="text-[11px] text-muted-foreground">
              {arquivo
                ? `${arquivo.name} • ${formatarTamanho(Math.max(1, Math.ceil(arquivo.size / 1024)))}`
                : 'PDF, imagem, Word, PowerPoint, Excel ou texto. Até 10 MB.'}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="env-nome" className={rotuloClass}>Nome na biblioteca (opcional)</label>
            <input
              id="env-nome"
              type="text"
              maxLength={MAX_NOME}
              placeholder={arquivo ? nomeParaExibir('', arquivo.name) : 'Usa o nome do arquivo'}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={campoClass}
            />
          </div>

          <button
            type="submit"
            disabled={enviando || !arquivo || !disciplinaId}
            className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}