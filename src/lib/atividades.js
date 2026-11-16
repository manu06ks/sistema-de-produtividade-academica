import { query } from "@/lib/db";

export const TIPOS = ["Tarefa", "Prova", "Trabalho"];
export const PRIORIDADES = ["Baixa", "Média", "Alta"];
export const STATUS = ["A Fazer", "Fazendo", "Concluído"];

function dataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

// Valida os campos compartilhados, os que só o autor pode editar.
export function validarCamposAtividade(body) {
  const titulo = String(body?.titulo ?? "").trim();
  const descricao = String(body?.descricao ?? "").trim();
  const dataBruta = String(body?.data_vencimento ?? "").trim();
  const tipo = String(body?.tipo_atividade ?? "").trim();
  const pesoBruto = body?.peso_nota;

  if (!titulo || titulo.length > 150) {
    return { erro: "Informe o título (até 150 caracteres)." };
  }
  if (descricao.length > 2000) {
    return { erro: "Descrição muito longa (máximo 2000 caracteres)." };
  }
  if (dataBruta && !dataValida(dataBruta)) {
    return { erro: "Data de vencimento inválida." };
  }
  if (!TIPOS.includes(tipo)) {
    return { erro: "Tipo inválido. Use Tarefa, Prova ou Trabalho." };
  }

  let peso = null;
  if (pesoBruto !== undefined && pesoBruto !== null && pesoBruto !== "") {
    peso = Number(pesoBruto);
    if (!Number.isFinite(peso) || peso < 0 || peso > 100) {
      return { erro: "O peso na nota deve estar entre 0 e 100." };
    }
    peso = Math.round(peso * 100) / 100;
  }

  return {
    valores: {
      titulo,
      descricao: descricao || null,
      data: dataBruta || null,
      tipo,
      peso,
    },
  };
}

// Atividades do quadro do usuário: aceitas e não escondidas.
// Com atividadeId, devolve só aquela (ou lista vazia).
export async function listarAtividadesDoUsuario(userId, atividadeId = null) {
  const r = await query(
    `SELECT a.id_atividade AS id,
            a.titulo,
            a.descricao,
            to_char(a.data_vencimento, 'YYYY-MM-DD') AS data_vencimento,
            a.tipo_atividade,
            a.peso_nota::float8 AS peso_nota,
            au.prioridade,
            au.status,
            a.fk_disciplina_id_disciplina AS disciplina_id,
            d.nome AS disciplina_nome,
            d.cor AS disciplina_cor,
            u.nome AS autor_nome,
            (a.fk_usuario_id_criador = au.fk_usuario_id_usuario) AS is_autor
       FROM atividade_usuario au
       JOIN atividade a ON a.id_atividade = au.fk_atividade_id_atividade
       JOIN disciplina d ON d.id_disciplina = a.fk_disciplina_id_disciplina
       JOIN usuario u ON u.id_usuario = a.fk_usuario_id_criador
      WHERE au.fk_usuario_id_usuario = $1
        AND au.status_convite = 'Aceita'
        AND au.removida_em IS NULL
        AND ($2::int IS NULL OR a.id_atividade = $2::int)
      ORDER BY a.data_vencimento NULLS LAST, a.id_atividade`,
    [userId, atividadeId]
  );
  return r.rows;
}

// Condição SQL: "esta atividade (alias a) ainda deve ser oferecida a quem entra".
// Para mudar a regra (por exemplo, oferecer também as vencidas), mexa só aqui.
export const SQL_ATIVIDADE_OFERECIDA = `
  a.compartilhada
  AND (a.data_vencimento IS NULL
       OR a.data_vencimento >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::date)
  AND EXISTS (SELECT 1 FROM atividade_usuario do_autor
               WHERE do_autor.fk_atividade_id_atividade = a.id_atividade
                 AND do_autor.fk_usuario_id_usuario = a.fk_usuario_id_criador
                 AND do_autor.removida_em IS NULL)`;

// Chamada quando o aluno entra numa disciplina: cada atividade compartilhada
// que a turma já recebeu vira um convite pendente para ele (o sino mostra, e
// ele aceita ou recusa). Devolve quantos convites estão esperando resposta.
// Precisa rodar dentro da transação da entrada (recebe o `client`).
export async function convidarParaAtividadesDaTurma(client, userId, disciplinaId) {
  // Convite que ficou sem resposta quando o aluno saiu da disciplina volta.
  // (O que ele aceitou ou recusou antes continua como ele decidiu.)
  await client.query(
    `UPDATE atividade_usuario au
        SET removida_em = NULL
       FROM atividade a
      WHERE au.fk_atividade_id_atividade = a.id_atividade
        AND au.fk_usuario_id_usuario = $1
        AND a.fk_disciplina_id_disciplina = $2
        AND au.status_convite = 'Pendente'
        AND au.removida_em IS NOT NULL
        AND ${SQL_ATIVIDADE_OFERECIDA}`,
    [userId, disciplinaId]
  );

  // Convites novos, com a mesma prioridade que o autor deu.
  await client.query(
    `INSERT INTO atividade_usuario
            (fk_usuario_id_usuario, fk_atividade_id_atividade, status_convite, prioridade)
     SELECT $1::int, a.id_atividade, 'Pendente', autor.prioridade
       FROM atividade a
       JOIN atividade_usuario autor
         ON autor.fk_atividade_id_atividade = a.id_atividade
        AND autor.fk_usuario_id_usuario = a.fk_usuario_id_criador
        AND autor.removida_em IS NULL
      WHERE a.fk_disciplina_id_disciplina = $2
        AND a.fk_usuario_id_criador <> $1
        AND ${SQL_ATIVIDADE_OFERECIDA}
     ON CONFLICT DO NOTHING`,
    [userId, disciplinaId]
  );

  const r = await client.query(
    `SELECT COUNT(*)::int AS n
       FROM atividade_usuario au
       JOIN atividade a ON a.id_atividade = au.fk_atividade_id_atividade
      WHERE au.fk_usuario_id_usuario = $1
        AND a.fk_disciplina_id_disciplina = $2
        AND au.status_convite = 'Pendente'
        AND au.removida_em IS NULL`,
    [userId, disciplinaId]
  );
  return r.rows[0].n;
}