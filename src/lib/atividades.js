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