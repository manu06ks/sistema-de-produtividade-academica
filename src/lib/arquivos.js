// Regras sobre QUAIS arquivos o app aceita. Funções puras, sem banco e sem
// Azure: funcionam no servidor (para validar de verdade) e no navegador (para
// avisar antes de enviar).

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB por arquivo
export const MAX_NOME = 150;               // caracteres do nome exibido

const ZIP = [0x50, 0x4b, 0x03, 0x04];                          // "PK.."  (docx, pptx, xlsx)
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];  // doc, ppt, xls antigos

function comeca(bytes, assinatura, inicio = 0) {
  return assinatura.every((b, i) => bytes[inicio + i] === b);
}

function achaTexto(bytes, texto, ate) {
  const alvo = [...texto].map((c) => c.charCodeAt(0));
  const limite = Math.min(bytes.length, ate) - alvo.length;
  for (let i = 0; i <= limite; i++) if (comeca(bytes, alvo, i)) return true;
  return false;
}

// Cada formato diz como ele começa de verdade. Não basta o nome terminar em
// ".pdf": o conteúdo precisa ser mesmo um PDF.
export const FORMATOS = {
  pdf:  { tipo: 'PDF',          contentType: 'application/pdf',
          confere: (b) => achaTexto(b, '%PDF-', 1024) },
  png:  { tipo: 'Imagem',       contentType: 'image/png',
          confere: (b) => comeca(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  jpg:  { tipo: 'Imagem',       contentType: 'image/jpeg',
          confere: (b) => comeca(b, [0xff, 0xd8, 0xff]) },
  webp: { tipo: 'Imagem',       contentType: 'image/webp',
          confere: (b) => comeca(b, [0x52, 0x49, 0x46, 0x46]) && comeca(b, [0x57, 0x45, 0x42, 0x50], 8) },
  doc:  { tipo: 'Documento',    contentType: 'application/msword',
          confere: (b) => comeca(b, OLE) },
  docx: { tipo: 'Documento',    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          confere: (b) => comeca(b, ZIP) },
  ppt:  { tipo: 'Apresentação', contentType: 'application/vnd.ms-powerpoint',
          confere: (b) => comeca(b, OLE) },
  pptx: { tipo: 'Apresentação', contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          confere: (b) => comeca(b, ZIP) },
  xls:  { tipo: 'Planilha',     contentType: 'application/vnd.ms-excel',
          confere: (b) => comeca(b, OLE) },
  xlsx: { tipo: 'Planilha',     contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          confere: (b) => comeca(b, ZIP) },
  // texto não tem assinatura: o que dá para garantir é que não é binário
  txt:  { tipo: 'Texto',        contentType: 'text/plain; charset=utf-8',
          confere: (b) => !b.subarray(0, 8000).includes(0) },
};

export const EXTENSOES_ACEITAS = [...Object.keys(FORMATOS), 'jpeg'];

// Valor pronto para o atributo accept do <input type="file">.
export const ACCEPT_ARQUIVOS = EXTENSOES_ACEITAS.map((e) => `.${e}`).join(',');

// "Aula 1.PDF" -> "pdf"; sem extensão -> ''
export function extensaoDe(nomeArquivo) {
  const nome = String(nomeArquivo ?? '');
  const ponto = nome.lastIndexOf('.');
  if (ponto <= 0 || ponto === nome.length - 1) return '';
  const ext = nome.slice(ponto + 1).toLowerCase();
  return ext === 'jpeg' ? 'jpg' : ext;
}

// Confere nome, tamanho e conteúdo. bytes = Uint8Array com o arquivo inteiro.
// Devolve { formato, tipo, contentType } ou { erro } (texto pronto para a tela).
export function identificarArquivo(nomeOriginal, bytes) {
  if (!bytes || bytes.length === 0) return { erro: 'O arquivo está vazio.' };
  if (bytes.length > MAX_BYTES) return { erro: 'Arquivo muito grande (máximo 10 MB).' };

  const formato = extensaoDe(nomeOriginal);
  const regra = FORMATOS[formato];
  if (!regra) {
    return { erro: 'Formato não aceito. Use PDF, imagem (PNG, JPG, WebP), Word, PowerPoint, Excel ou texto.' };
  }
  if (!regra.confere(bytes)) {
    return { erro: `O conteúdo não é um arquivo ${formato.toUpperCase()} válido.` };
  }
  return { formato, tipo: regra.tipo, contentType: regra.contentType };
}

// Nome que aparece na lista. Se o aluno não digitar, usa o do arquivo sem a extensão.
export function nomeParaExibir(nomeDigitado, nomeOriginal) {
  const digitado = String(nomeDigitado ?? '').trim();
  if (digitado) return digitado;
  const original = String(nomeOriginal ?? '').trim();
  const ext = extensaoDe(original);
  const semExt = ext ? original.slice(0, original.lastIndexOf('.')) : original;
  return semExt.trim();
}

// Valida o nome final. Devolve { nome } ou { erro }.
export function validarNome(nome) {
  if (!nome) return { erro: 'Informe um nome para o arquivo.' };
  if (nome.length > MAX_NOME) return { erro: `Nome muito longo (máximo ${MAX_NOME} caracteres).` };
  return { nome };
}

// Nome com que o arquivo é baixado: "Aula 1" + pdf -> "Aula 1.pdf"
export function nomeParaDownload(nome, formato) {
  const sufixo = `.${formato}`;
  return nome.toLowerCase().endsWith(sufixo) ? nome : nome + sufixo;
}