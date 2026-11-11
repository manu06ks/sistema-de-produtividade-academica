'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Paperclip, Trash2 } from 'lucide-react';
import IconeArquivo from '@/components/IconeArquivo';
import { ACCEPT_ARQUIVOS } from '@/lib/arquivos';
import { conferirArquivoEscolhido, enviarParaApi, formatarTamanho } from '@/lib/anexos';

// Parte do modal da atividade: mostra o arquivo anexado, deixa baixar, e só
// quem criou a atividade pode anexar ou apagar. Funciona dentro do <form> do
// modal porque todos os botões daqui são type="button" (não enviam o formulário).
export default function AnexoAtividade({ atividadeId, souCriador }) {
  const [anexo, setAnexo] = useState(undefined); // undefined = carregando, null = sem anexo
  const [falhaAoCarregar, setFalhaAoCarregar] = useState(false);
  const [tentativa, setTentativa] = useState(0); // aumenta para recarregar
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const campoArquivo = useRef(null);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const r = await fetch(`/api/atividades/${atividadeId}/anexo`);
        if (!r.ok) throw new Error('falha');
        const dados = await r.json();
        if (ativo) setAnexo(dados.anexo ?? null);
      } catch {
        if (ativo) setFalhaAoCarregar(true);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [atividadeId, tentativa]);

  function recarregar() {
    setFalhaAoCarregar(false);
    setAnexo(undefined);
    setTentativa((n) => n + 1);
  }

  async function escolher(e) {
    const campo = e.target;
    const arquivo = campo.files?.[0] ?? null;
    campo.value = ''; // deixa escolher o mesmo arquivo outra vez, se precisar
    if (!arquivo) return;

    setErro('');
    setOcupado(true);

    const problema = await conferirArquivoEscolhido(arquivo);
    if (problema) {
      setErro(problema);
      setOcupado(false);
      return;
    }

    const r = await enviarParaApi(`/api/atividades/${atividadeId}/anexo`, {}, arquivo);
    setOcupado(false);

    if (r.ok) {
      setAnexo(r.dados.anexo);
    } else {
      setErro(r.erro);
      if (r.status === 409) recarregar(); // alguém anexou antes: mostra o que já existe
    }
  }

  async function apagar() {
    setErro('');
    setOcupado(true);
    try {
      const r = await fetch(`/api/materiais/${anexo.id}`, { method: 'DELETE' });
      const dados = await r.json().catch(() => ({}));

      if (r.ok || r.status === 404) {
        setAnexo(null); // 404: já não existia mais
      } else {
        setErro(dados.erro || 'Não foi possível apagar o anexo.');
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setOcupado(false);
      setConfirmando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-secondary/30 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <Paperclip className="h-3 w-3" /> Arquivo anexado
      </p>

      {erro && (
        <p role="alert" className="mb-2 rounded-lg bg-destructive/10 p-2 text-xs font-medium text-destructive">
          {erro}
        </p>
      )}

      {falhaAoCarregar ? (
        <div className="flex items-center justify-between gap-2 text-xs text-destructive">
          Não foi possível carregar o anexo.
          <button
            type="button"
            onClick={recarregar}
            className="rounded-lg bg-destructive/10 px-3 py-1 font-semibold hover:bg-destructive/20"
          >
            Tentar de novo
          </button>
        </div>
      ) : anexo === undefined ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : anexo ? (
        <>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground">
              <IconeArquivo tipo={anexo.tipo} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground" title={anexo.nome}>
                {anexo.nome}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {anexo.tipo} • {formatarTamanho(anexo.tamanho_kb)}
              </p>
            </div>
            <a
              href={`/api/materiais/${anexo.id}/baixar`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir ${anexo.nome}`}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir
            </a>
            {anexo.pode_apagar && (
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                disabled={ocupado}
                aria-label="Apagar anexo"
                className="shrink-0 rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {confirmando && (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <p className="mb-3 text-xs text-foreground">
                Apagar este anexo? Ele some para todos que têm a atividade.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  disabled={ocupado}
                  className="flex-1 rounded-xl bg-secondary py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-accent disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={apagar}
                  disabled={ocupado}
                  className="flex-1 rounded-xl bg-destructive py-2 text-xs font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
                >
                  {ocupado ? 'Apagando...' : 'Apagar'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : souCriador ? (
        <>
          <input
            ref={campoArquivo}
            type="file"
            accept={ACCEPT_ARQUIVOS}
            onChange={escolher}
            aria-label="Escolher arquivo para anexar"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => campoArquivo.current?.click()}
            disabled={ocupado}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 py-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Paperclip className="h-3.5 w-3.5" />
            {ocupado ? 'Enviando...' : 'Anexar arquivo'}
          </button>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Um arquivo por atividade, até 10 MB. Quem recebeu a atividade poderá abri-lo.
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum arquivo anexado.</p>
      )}
    </div>
  );
}