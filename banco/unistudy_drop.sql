-- =====================================================================
-- UniStudy - elimina TODAS as tabelas do sistema (e a função auxiliar).
-- Ordem: das tabelas que dependem de outras para as independentes.
-- =====================================================================
DROP TABLE IF EXISTS
    Historico_Tokens_IA,
    Plano_Estudos,
    Material,
    Sessao_Estudo,
    Atividade_Usuario,
    Atividade,
    participa,
    Grupo_Estudos,
    cursa,
    Disciplina,
    Usuario,
    Curso,
    Instituicao
CASCADE;

DROP FUNCTION IF EXISTS norm_nome(TEXT);
