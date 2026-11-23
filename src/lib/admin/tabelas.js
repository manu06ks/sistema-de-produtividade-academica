// As 13 tabelas do UniStudy, na ordem de criação do DDL (quem não depende de ninguém primeiro).
// "nome" é o nome real no PostgreSQL (minúsculo, porque o DDL não usa aspas);
// "titulo" é como aparece no relatório.
export const TABELAS = [
  { nome: "instituicao", titulo: "Instituicao" },
  { nome: "curso", titulo: "Curso" },
  { nome: "usuario", titulo: "Usuario" },
  { nome: "disciplina", titulo: "Disciplina" },
  { nome: "cursa", titulo: "cursa" },
  { nome: "atividade", titulo: "Atividade" },
  { nome: "atividade_usuario", titulo: "Atividade_Usuario" },
  { nome: "sessao_estudo", titulo: "Sessao_Estudo" },
  { nome: "grupo_estudos", titulo: "Grupo_Estudos" },
  { nome: "participa", titulo: "participa" },
  { nome: "material", titulo: "Material" },
  { nome: "plano_estudos", titulo: "Plano_Estudos" },
  { nome: "historico_tokens_ia", titulo: "Historico_Tokens_IA" },
];

export const NOMES_TABELAS = TABELAS.map((t) => t.nome);

export function tabelaConhecida(nome) {
  return TABELAS.find((t) => t.nome === nome) ?? null;
}
