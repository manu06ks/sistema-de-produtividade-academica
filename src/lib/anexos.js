// Funções de apoio das telas de arquivos (biblioteca e anexo da atividade).
// Rodam no navegador: não importe aqui nada que use o banco ou o Azure.
import { MAX_BYTES, identificarArquivo } from '@/lib/arquivos';

// 800 -> "800 KB", 1536 -> "1,5 MB", 2048 -> "2 MB"
export function formatarTamanho(kb) {
  const n = Math.max(0, Number(kb) || 0);
  if (n < 1024) return `${n} KB`;
  const mb = Math.round((n / 1024) * 10) / 10;
  return `${String(mb).replace('.', ',')} MB`;
}

// "2026-11-06T01:30:00Z" -> "05/11/2026" (sempre no horário de São Paulo,
// seja qual for o fuso do computador).
export function dataCurta(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

// Confere no navegador, antes de enviar, as mesmas regras que o servidor aplica
// (tamanho, formato e conteúdo). Devolve o texto do problema, ou null se estiver ok.
export async function conferirArquivoEscolhido(arquivo) {
  // Arquivo gigante: recusa sem nem ler para a memória.
  if (arquivo.size > MAX_BYTES) return 'Arquivo muito grande (máximo 10 MB).';
  try {
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    return identificarArquivo(arquivo.name, bytes).erro ?? null;
  } catch {
    return 'Não foi possível ler o arquivo. Tente escolher de novo.';
  }
}

// Envia um arquivo para a API (multipart/form-data).
// "campos" são os textos que acompanham o arquivo (disciplina_id, nome).
// Devolve { ok, status, dados, erro }.
export async function enviarParaApi(url, campos, arquivo) {
  const form = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    if (valor !== '' && valor !== null && valor !== undefined) form.append(chave, valor);
  }
  form.append('arquivo', arquivo);

  try {
    // Sem cabeçalho Content-Type: o navegador acrescenta sozinho a parte
    // "boundary" que o servidor precisa para ler o envio.
    const r = await fetch(url, { method: 'POST', body: form });
    const dados = await r.json().catch(() => ({}));
    const erro = r.ok
      ? ''
      : dados.erro ||
        (r.status === 413
          ? 'Arquivo muito grande (máximo 10 MB).'
          : 'Não foi possível enviar o arquivo. Tente novamente.');
    return { ok: r.ok, status: r.status, dados, erro };
  } catch {
    return { ok: false, status: 0, dados: {}, erro: 'Erro de conexão. Tente novamente.' };
  }
}