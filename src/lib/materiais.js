import { query } from "@/lib/db";
import { SQL_AGORA_UTC } from "@/lib/sessoes";
import { MAX_BYTES, identificarArquivo, nomeParaExibir, validarNome } from "@/lib/arquivos";
import { enviarArquivo, apagarArquivo, novoCaminho } from "@/lib/armazenamento";

// O corpo de um envio tem o arquivo mais um pouco de "embalagem" (nomes dos campos).
const MARGEM_ENVIO_BYTES = 1024 * 1024;

// Colunas de um material como a tela precisa ($1 = id de quem está logado).
// Precisa dos aliases m (material), d (disciplina) e au (usuário autor).
export const SQL_ITEM_COLUNAS = `
  m.id_material AS id,
  m.nome_arquivo AS nome,
  m.formato,
  m.tipo,
  m.tamanho_kb,
  to_char(m.data_upload, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS data_upload,
  d.id_disciplina AS disciplina_id,
  d.nome AS disciplina_nome,
  d.cor AS disciplina_cor,
  au.nome AS autor_nome,
  (m.fk_usuario_id_autor = $1) AS eh_meu,
  (m.fk_usuario_id_autor = $1 OR d.fk_usuario_id_criador = $1) AS pode_apagar`;

export const SQL_ITEM_JOINS = `
  JOIN disciplina d ON d.id_disciplina = m.fk_disciplina_id_disciplina
  JOIN usuario au ON au.id_usuario = m.fk_usuario_id_autor`;

// Um material no formato da tela (ou null).
export async function buscarItem(materialId, userId) {
  const r = await query(
    `SELECT ${SQL_ITEM_COLUNAS}
       FROM material m ${SQL_ITEM_JOINS}
      WHERE m.id_material = $2`,
    [userId, materialId]
  );
  return r.rows[0] ?? null;
}

// Dados internos do material, só se o usuário for membro da disciplina dele.
export async function buscarMaterialDoMembro(materialId, userId) {
  const r = await query(
    `SELECT m.id_material AS id,
            m.nome_arquivo AS nome,
            m.formato,
            m.url AS caminho,
            m.fk_atividade_id_atividade AS atividade_id,
            m.fk_disciplina_id_disciplina AS disciplina_id,
            (m.fk_usuario_id_autor = $2 OR d.fk_usuario_id_criador = $2) AS pode_apagar
       FROM material m
       JOIN disciplina d ON d.id_disciplina = m.fk_disciplina_id_disciplina
       JOIN cursa c ON c.fk_disciplina_id_disciplina = d.id_disciplina
                   AND c.fk_usuario_id_usuario = $2
      WHERE m.id_material = $1`,
    [materialId, userId]
  );
  return r.rows[0] ?? null;
}

// A disciplina, só se o usuário for membro.
export async function buscarDisciplinaDoMembro(disciplinaId, userId) {
  const r = await query(
    `SELECT d.id_disciplina AS id
       FROM disciplina d
       JOIN cursa c ON c.fk_disciplina_id_disciplina = d.id_disciplina
                   AND c.fk_usuario_id_usuario = $2
      WHERE d.id_disciplina = $1`,
    [disciplinaId, userId]
  );
  return r.rows[0] ?? null;
}

// O usuário enxerga a atividade? (convite aceito e não removida do quadro dele)
export async function atividadeVisivelPara(atividadeId, userId) {
  const r = await query(
    `SELECT a.fk_disciplina_id_disciplina AS disciplina_id,
            (a.fk_usuario_id_criador = $2) AS sou_criador
       FROM atividade a
       JOIN atividade_usuario x ON x.fk_atividade_id_atividade = a.id_atividade
                               AND x.fk_usuario_id_usuario = $2
                               AND x.status_convite = 'Aceita'
                               AND x.removida_em IS NULL
      WHERE a.id_atividade = $1`,
    [atividadeId, userId]
  );
  return r.rows[0] ?? null;
}

// Lê o envio (multipart) de uma requisição e valida o arquivo.
// Devolve { form, arquivo, bytes, formato, tipo, contentType, nome } ou { resposta },
// onde "resposta" é a Response de erro pronta para devolver.
export async function lerEnvio(request) {
  const erro = (mensagem, status = 400) => ({
    resposta: Response.json({ erro: mensagem }, { status }),
  });

  // Recusa antes de ler o corpo inteiro quando o tamanho declarado já é grande demais.
  const declarado = Number(request.headers.get("content-length") ?? 0);
  if (declarado > MAX_BYTES + MARGEM_ENVIO_BYTES) {
    return erro("Arquivo muito grande (máximo 10 MB).", 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return erro("Envio inválido.");
  }

  const arquivo = form.get("arquivo");
  if (!(arquivo instanceof File)) return erro("Escolha um arquivo.");

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const info = identificarArquivo(arquivo.name, bytes);
  if (info.erro) return erro(info.erro);

  const digitado = form.get("nome");
  const nome = validarNome(nomeParaExibir(typeof digitado === "string" ? digitado : "", arquivo.name));
  if (nome.erro) return erro(nome.erro);

  return { form, arquivo, bytes, nome: nome.nome, ...info };
}

// Guarda o arquivo no Azure e a linha no banco. Se o banco falhar, o arquivo
// recém-enviado é apagado para não ficar solto no Azure.
// "atividadeId" só vem preenchido quando o arquivo é anexo de uma atividade.
export async function guardarMaterial({ userId, disciplinaId, atividadeId = null, envio }) {
  const caminho = novoCaminho(disciplinaId, envio.formato);

  try {
    await enviarArquivo(caminho, envio.bytes, envio.contentType);
  } catch (err) {
    console.error(err);
    return { status: 502, erro: "Não foi possível guardar o arquivo. Tente novamente." };
  }

  try {
    const r = await query(
      `INSERT INTO material
              (nome_arquivo, formato, tamanho_kb, url, data_upload, tipo,
               fk_disciplina_id_disciplina, fk_usuario_id_autor, fk_atividade_id_atividade)
       VALUES ($1, $2, $3, $4, ${SQL_AGORA_UTC}, $5, $6, $7, $8)
       RETURNING id_material AS id`,
      [
        envio.nome,
        envio.formato,
        Math.max(1, Math.ceil(envio.bytes.length / 1024)),
        caminho,
        envio.tipo,
        disciplinaId,
        userId,
        atividadeId,
      ]
    );
    return { item: await buscarItem(r.rows[0].id, userId) };
  } catch (err) {
    await apagarArquivo(caminho).catch((e) => console.error(e));
    // 23505: o índice único de "um anexo por atividade" barrou um envio simultâneo
    if (err.code === "23505") {
      return { status: 409, erro: "Esta atividade já tem um anexo. Apague o atual antes de enviar outro." };
    }
    console.error(err);
    return { status: 500, erro: "Erro interno ao salvar o arquivo." };
  }
}