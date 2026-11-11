// Tudo que fala com o Azure Blob Storage fica neste arquivo. O resto do app só
// conhece estas três funções, então trocar o Azurite pela conta real (ou outro
// serviço) não mexe em mais nada.
//
// Só pode ser usado no servidor (rotas da API): usa a chave da conta.
import { randomUUID } from 'node:crypto';
import { BlobServiceClient, BlobSASPermissions } from '@azure/storage-blob';

const LINK_VALE_MINUTOS = 5;

// O container é criado (se não existir) na primeira vez que alguém usa e
// reaproveitado depois. Se a criação falhar, a próxima chamada tenta de novo.
let containerPronto;

function obterContainer() {
  if (!containerPronto) {
    containerPronto = (async () => {
      const conexao = process.env.AZURE_STORAGE_CONNECTION_STRING;
      const nome = process.env.AZURE_STORAGE_CONTAINER;
      if (!conexao || !nome) {
        throw new Error(
          'Armazenamento não configurado: defina AZURE_STORAGE_CONNECTION_STRING e AZURE_STORAGE_CONTAINER no .env.local.'
        );
      }
      const container = BlobServiceClient.fromConnectionString(conexao).getContainerClient(nome);
      await container.createIfNotExists(); // sem "access": o container é PRIVADO
      return container;
    })().catch((erro) => {
      containerPronto = undefined;
      throw erro;
    });
  }
  return containerPronto;
}

// Caminho do arquivo dentro do container: "disciplina-3/<código aleatório>.pdf".
// O nome que o aluno deu NÃO entra no caminho: dois "Aula 1.pdf" nunca colidem
// e ninguém consegue adivinhar o endereço de um arquivo.
export function novoCaminho(disciplinaId, formato) {
  return `disciplina-${disciplinaId}/${randomUUID()}.${formato}`;
}

export async function enviarArquivo(caminho, bytes, contentType) {
  const container = await obterContainer();
  await container
    .getBlockBlobClient(caminho)
    .uploadData(bytes, { blobHTTPHeaders: { blobContentType: contentType } });
}

export async function apagarArquivo(caminho) {
  const container = await obterContainer();
  await container.getBlockBlobClient(caminho).deleteIfExists();
}

// Link temporário (5 minutos) só de leitura. Só é gerado depois de a API
// conferir que o aluno pode ver o arquivo.
export async function gerarLinkDownload(caminho, nomeDownload, contentType) {
  const container = await obterContainer();

  // Cabeçalho que dá nome ao arquivo: uma versão simples (ASCII) para navegadores
  // antigos e outra em UTF-8, para acentos.
  const simples = nomeDownload.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const utf8 = encodeURIComponent(nomeDownload).replace(
    /['()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );

  return container.getBlockBlobClient(caminho).generateSasUrl({
    permissions: BlobSASPermissions.parse('r'),
    expiresOn: new Date(Date.now() + LINK_VALE_MINUTOS * 60 * 1000),
    contentType,
    contentDisposition: `inline; filename="${simples}"; filename*=UTF-8''${utf8}`,
  });
}