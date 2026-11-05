import { query } from "@/lib/db";

export function lerId(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Disciplina "vazia" = só o criador como membro, sem atividades,
// materiais nem planos. Texto fixo (nunca recebe dados do usuário).
export const SQL_DISCIPLINA_VAZIA = `
  NOT EXISTS (SELECT 1 FROM cursa x
               WHERE x.fk_disciplina_id_disciplina = d.id_disciplina
                 AND x.fk_usuario_id_usuario <> d.fk_usuario_id_criador)
  AND NOT EXISTS (SELECT 1 FROM atividade a
                   WHERE a.fk_disciplina_id_disciplina = d.id_disciplina)
  AND NOT EXISTS (SELECT 1 FROM material m
                   WHERE m.fk_disciplina_id_disciplina = d.id_disciplina)
  AND NOT EXISTS (SELECT 1 FROM plano_estudos p
                   WHERE p.fk_disciplina_id_disciplina = d.id_disciplina)`;

// Devolve a disciplina só se o usuário for membro; senão, null.
export async function buscarDisciplinaDoUsuario(disciplinaId, userId) {
  const r = await query(
    `SELECT d.id_disciplina AS id,
            d.nome,
            d.nome_professor AS professor,
            d.semestre_letivo,
            d.cor,
            d.codigo_compartilhamento,
            u.nome AS criador_nome,
            (d.fk_usuario_id_criador = $2) AS is_criador,
            (${SQL_DISCIPLINA_VAZIA}) AS vazia
       FROM cursa c
       JOIN disciplina d ON d.id_disciplina = c.fk_disciplina_id_disciplina
       JOIN usuario u ON u.id_usuario = d.fk_usuario_id_criador
      WHERE c.fk_disciplina_id_disciplina = $1
        AND c.fk_usuario_id_usuario = $2`,
    [disciplinaId, userId]
  );
  return r.rows[0] ?? null;
}

export function validarDisciplina(body) {
  const nome = String(body?.nome ?? "").trim();
  const professor = String(body?.professor ?? "").trim();
  const semestre = String(body?.semestre_letivo ?? "").trim();
  const cor = String(body?.cor ?? "#7c3aed").trim();

  if (!nome || nome.length > 100) {
    return { erro: "Informe o nome da disciplina (até 100 caracteres)." };
  }
  if (professor.length > 150) {
    return { erro: "Nome do professor muito longo (máximo 150)." };
  }
  if (!semestre || semestre.length > 20) {
    return { erro: "Informe o semestre letivo, por exemplo 2026.1." };
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(cor)) {
    return { erro: "Cor inválida." };
  }
  return { valores: { nome, professor: professor || null, semestre, cor } };
}