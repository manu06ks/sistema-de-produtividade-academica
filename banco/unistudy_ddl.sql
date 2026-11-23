-- =====================================================================
-- UniStudy - DDL PostgreSQL
-- Baseado nos modelos conceitual e lógico mais recentes
-- As tabelas são criadas em ordem de dependência, com as FKs inline.
-- Rode em um banco VAZIO (psql ou pgAdmin > Query Tool).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Função de apoio: normaliza um nome para comparação (sem acentos,
--    minúsculas, sem espaços repetidos). Usada nos índices únicos de
--    Instituicao e Curso, que impedem cadastros repetidos.
--    "  Engenharia   de COMPUTAÇÃO " -> "engenharia de computacao"
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION norm_nome(texto TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
STRICT
AS $$
  SELECT lower(btrim(regexp_replace(
           translate(texto,
                     'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
                     'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'),
           '\s+', ' ', 'g')))
$$;

-- ---------------------------------------------------------------------
-- 2.1 Instituição, Curso e Usuário
-- ---------------------------------------------------------------------
CREATE TABLE Instituicao (
    id_instituicao SERIAL PRIMARY KEY,
    nome           VARCHAR(150) NOT NULL,
    sigla          VARCHAR(20)
);

CREATE TABLE Curso (
    id_curso SERIAL PRIMARY KEY,
    nome     VARCHAR(100) NOT NULL,
    fk_Instituicao_id_instituicao INT NOT NULL,
    CONSTRAINT fk_curso_instituicao
        FOREIGN KEY (fk_Instituicao_id_instituicao)
        REFERENCES Instituicao (id_instituicao)
        ON DELETE RESTRICT
);

CREATE TABLE Usuario (
    id_usuario    SERIAL PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    senha_hash    VARCHAR(255) NOT NULL,
    data_cadastro TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fk_Curso_id_curso INT NOT NULL,
    CONSTRAINT fk_usuario_curso
        FOREIGN KEY (fk_Curso_id_curso)
        REFERENCES Curso (id_curso)
        ON DELETE RESTRICT          -- apagar um curso NÃO deve apagar usuários
);

-- e-mail único sem diferenciar maiúsculas/minúsculas
CREATE UNIQUE INDEX uq_usuario_email ON Usuario (LOWER(email));

-- ---------------------------------------------------------------------
-- 2.2 Disciplinas
-- ---------------------------------------------------------------------
CREATE TABLE Disciplina (
    id_disciplina   SERIAL PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    semestre_letivo VARCHAR(20)  NOT NULL,      -- ex.: '2026.1'
    nome_professor  VARCHAR(150),
    codigo_compartilhamento VARCHAR(8) NOT NULL, -- código para outros alunos entrarem
    cor             VARCHAR(7)   NOT NULL DEFAULT '#7c3aed',
    fk_Usuario_id_criador   INT  NOT NULL,
    CONSTRAINT uq_disciplina_codigo UNIQUE (codigo_compartilhamento),
    CONSTRAINT ck_disciplina_cor
        CHECK (cor ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT fk_disciplina_criador
        FOREIGN KEY (fk_Usuario_id_criador)
        REFERENCES Usuario (id_usuario)
        ON DELETE RESTRICT
);

CREATE TABLE cursa (
    fk_Usuario_id_usuario       INT NOT NULL,
    fk_Disciplina_id_disciplina INT NOT NULL,
    PRIMARY KEY (fk_Usuario_id_usuario, fk_Disciplina_id_disciplina),
    CONSTRAINT fk_cursa_usuario
        FOREIGN KEY (fk_Usuario_id_usuario)
        REFERENCES Usuario (id_usuario)
        ON DELETE CASCADE,
    CONSTRAINT fk_cursa_disciplina
        FOREIGN KEY (fk_Disciplina_id_disciplina)
        REFERENCES Disciplina (id_disciplina)
        ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 2.3 Atividades compartilhadas (Kanban e calendário)
-- Atividade = dados comuns a todos. Atividade_Usuario = convite e
-- acompanhamento individual de cada aluno.
-- ---------------------------------------------------------------------
CREATE TABLE Atividade (
    id_atividade    SERIAL PRIMARY KEY,
    titulo          VARCHAR(150) NOT NULL,
    descricao       TEXT,
    data_vencimento DATE,
    tipo_atividade  VARCHAR(50)  NOT NULL,
    peso_nota       NUMERIC(5,2),
    -- TRUE = o autor compartilhou com a turma. Quem entra na disciplina
    -- depois recebe convite das atividades compartilhadas ainda em aberto.
    compartilhada   BOOLEAN NOT NULL DEFAULT FALSE,
    fk_Disciplina_id_disciplina INT NOT NULL,
    -- autor da atividade (quem envia os convites)
    fk_Usuario_id_criador       INT NOT NULL,
    -- atividade compartilhada nunca é apagada fisicamente
    CONSTRAINT fk_atividade_disciplina
        FOREIGN KEY (fk_Disciplina_id_disciplina)
        REFERENCES Disciplina (id_disciplina)
        ON DELETE RESTRICT,
    CONSTRAINT fk_atividade_criador
        FOREIGN KEY (fk_Usuario_id_criador)
        REFERENCES Usuario (id_usuario)
        ON DELETE RESTRICT,
    CONSTRAINT ck_atividade_tipo
        CHECK (tipo_atividade IN ('Tarefa', 'Prova', 'Trabalho')),
    CONSTRAINT ck_atividade_peso
        CHECK (peso_nota IS NULL OR peso_nota >= 0)
);

CREATE TABLE Atividade_Usuario (
    fk_Usuario_id_usuario     INT NOT NULL,
    fk_Atividade_id_atividade INT NOT NULL,
    status_convite VARCHAR(20) NOT NULL DEFAULT 'Pendente',
    status         VARCHAR(50) NOT NULL DEFAULT 'A Fazer',
    prioridade     VARCHAR(20) NOT NULL DEFAULT 'Média',
    -- exclusão lógica: quando o aluno "exclui", só some para ele.
    -- NULL = visível. O Kanban mostra apenas status_convite = 'Aceita'
    -- e removida_em IS NULL.
    removida_em    TIMESTAMP,
    PRIMARY KEY (fk_Usuario_id_usuario, fk_Atividade_id_atividade),
    CONSTRAINT fk_atvusu_usuario
        FOREIGN KEY (fk_Usuario_id_usuario)
        REFERENCES Usuario (id_usuario)
        ON DELETE CASCADE,
    CONSTRAINT fk_atvusu_atividade
        FOREIGN KEY (fk_Atividade_id_atividade)
        REFERENCES Atividade (id_atividade)
        ON DELETE RESTRICT,
    CONSTRAINT ck_atvusu_convite
        CHECK (status_convite IN ('Pendente', 'Aceita', 'Recusada')),
    CONSTRAINT ck_atvusu_status
        CHECK (status IN ('A Fazer', 'Fazendo', 'Concluído')),
    CONSTRAINT ck_atvusu_prioridade
        CHECK (prioridade IN ('Baixa', 'Média', 'Alta'))
);

-- ---------------------------------------------------------------------
-- 2.4 Sessões de estudo (SmartTimer)
-- A FK composta garante que a sessão pertence a um par (usuário, atividade)
-- que existe em Atividade_Usuario. A regra "timer só para atividade
-- Aceita" fica na aplicação. As horas nunca são apagadas em cascata.
-- ---------------------------------------------------------------------
CREATE TABLE Sessao_Estudo (
    id_sessao           SERIAL PRIMARY KEY,
    -- horários (início e fim) gravados em UTC pela aplicação
    data_hora_inicio    TIMESTAMP NOT NULL,
    data_hora_fim       TIMESTAMP,              -- NULL enquanto o timer está rodando
    tempo_total_minutos INT,
    fk_Usuario_id_usuario     INT NOT NULL,
    fk_Atividade_id_atividade INT NOT NULL,
    CONSTRAINT fk_sessao_atividade_usuario
        FOREIGN KEY (fk_Usuario_id_usuario, fk_Atividade_id_atividade)
        REFERENCES Atividade_Usuario (fk_Usuario_id_usuario, fk_Atividade_id_atividade)
        ON DELETE RESTRICT,
    CONSTRAINT ck_sessao_periodo
        CHECK (data_hora_fim IS NULL OR data_hora_fim >= data_hora_inicio),
    CONSTRAINT ck_sessao_tempo
        CHECK (tempo_total_minutos IS NULL OR tempo_total_minutos >= 0)
);

-- No máximo UMA sessão aberta (timer rodando) por usuário.
-- Índice único parcial: só entram no índice as linhas com data_hora_fim NULL.
CREATE UNIQUE INDEX uq_sessao_aberta_por_usuario
    ON Sessao_Estudo (fk_Usuario_id_usuario)
    WHERE data_hora_fim IS NULL;

-- ---------------------------------------------------------------------
-- 2.5 Grupos de estudo
-- ---------------------------------------------------------------------
-- As horas de cada membro NÃO são guardadas aqui: o ranking é calculado a
-- partir de Sessao_Estudo (por usuário e período), então não há dado duplicado.
-- As datas são gravadas pela aplicação no horário de São Paulo.
CREATE TABLE Grupo_Estudos (
    id_grupo     SERIAL PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL,
    descricao    TEXT,
    data_criacao DATE    NOT NULL DEFAULT CURRENT_DATE,
    status_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    codigo_convite VARCHAR(8) NOT NULL,          -- código para outros alunos entrarem
    CONSTRAINT uq_grupo_codigo UNIQUE (codigo_convite)
);

CREATE TABLE participa (
    fk_Usuario_id_usuario     INT NOT NULL,
    fk_Grupo_Estudos_id_grupo INT NOT NULL,
    data_ingresso DATE          NOT NULL DEFAULT CURRENT_DATE,
    papel_membro  VARCHAR(20)   NOT NULL DEFAULT 'Membro',
    PRIMARY KEY (fk_Usuario_id_usuario, fk_Grupo_Estudos_id_grupo),
    CONSTRAINT fk_participa_usuario
        FOREIGN KEY (fk_Usuario_id_usuario)
        REFERENCES Usuario (id_usuario)
        ON DELETE CASCADE,
    CONSTRAINT fk_participa_grupo
        FOREIGN KEY (fk_Grupo_Estudos_id_grupo)
        REFERENCES Grupo_Estudos (id_grupo)
        ON DELETE CASCADE,
    CONSTRAINT ck_participa_papel
        CHECK (papel_membro IN ('Administrador', 'Membro'))
);

-- ---------------------------------------------------------------------
-- 2.6 Biblioteca digital
-- O arquivo em si fica no Azure Blob Storage (container privado). Aqui só
-- ficam os dados dele. "url" guarda o CAMINHO dentro do container (por
-- exemplo disciplina-3/<código>.pdf), nunca um endereço público: o download
-- passa pela API, que confere o acesso e gera um link temporário.
-- Material é da disciplina: todos os membros veem. Quem apaga: o autor ou o
-- criador da disciplina (regra da aplicação).
-- Se fk_Atividade_id_atividade estiver preenchida, o arquivo é o ANEXO dessa
-- atividade (no máximo um por atividade) e não aparece na biblioteca.
-- data_upload é gravada em UTC pela aplicação.
-- tipo = categoria (PDF, Imagem, Documento, Apresentação, Planilha, Texto).
-- ---------------------------------------------------------------------
CREATE TABLE Material (
    id_material  SERIAL PRIMARY KEY,
    nome_arquivo VARCHAR(200) NOT NULL,
    formato      VARCHAR(10),                   -- extensão (pdf, png, docx...)
    tamanho_kb   INT,
    url          TEXT         NOT NULL,
    data_upload  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo         VARCHAR(50),
    fk_Disciplina_id_disciplina INT NOT NULL,
    fk_Usuario_id_autor         INT NOT NULL,
    fk_Atividade_id_atividade   INT,
    CONSTRAINT uq_material_url UNIQUE (url),
    CONSTRAINT fk_material_disciplina
        FOREIGN KEY (fk_Disciplina_id_disciplina)
        REFERENCES Disciplina (id_disciplina)
        ON DELETE CASCADE,
    CONSTRAINT fk_material_autor
        FOREIGN KEY (fk_Usuario_id_autor)
        REFERENCES Usuario (id_usuario)
        ON DELETE RESTRICT,
    CONSTRAINT fk_material_atividade
        FOREIGN KEY (fk_Atividade_id_atividade)
        REFERENCES Atividade (id_atividade)
        ON DELETE RESTRICT,
    CONSTRAINT ck_material_tamanho
        CHECK (tamanho_kb IS NULL OR tamanho_kb >= 0)
);

-- No máximo UM anexo por atividade.
CREATE UNIQUE INDEX uq_material_anexo_atividade
    ON Material (fk_Atividade_id_atividade)
    WHERE fk_Atividade_id_atividade IS NOT NULL;

-- ---------------------------------------------------------------------
-- 2.7 Planejamento de estudos com IA
-- Cada plano pertence a um aluno e a uma disciplina. Um plano pode ter várias
-- requisições auditadas (1:N). O histórico de tokens SOBREVIVE ao plano
-- apagado (o vínculo vira NULL), porque o gasto com a IA aconteceu do mesmo
-- jeito e conta no limite diário do aluno.
-- ---------------------------------------------------------------------
CREATE TABLE Plano_Estudos (
    id_plano SERIAL PRIMARY KEY,
    data     DATE NOT NULL DEFAULT CURRENT_DATE,
    conteudo TEXT NOT NULL,
    fk_Disciplina_id_disciplina INT NOT NULL,
    fk_Usuario_id_usuario       INT NOT NULL,
    CONSTRAINT fk_plano_disciplina
        FOREIGN KEY (fk_Disciplina_id_disciplina)
        REFERENCES Disciplina (id_disciplina)
        ON DELETE CASCADE,
    CONSTRAINT fk_plano_usuario
        FOREIGN KEY (fk_Usuario_id_usuario)
        REFERENCES Usuario (id_usuario)
        ON DELETE CASCADE
);

CREATE TABLE Historico_Tokens_IA (
    id_historico   SERIAL PRIMARY KEY,
    data_requi     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tokens_entrada INT           NOT NULL,
    tokens_saida   INT           NOT NULL,
    custo_total    NUMERIC(12,6) NOT NULL,
    fk_Plano_Estudos_id_plano INT,          -- NULL: plano apagado, ou resposta da IA que não virou plano
    fk_Usuario_id_usuario     INT NOT NULL,
    CONSTRAINT fk_historico_plano
        FOREIGN KEY (fk_Plano_Estudos_id_plano)
        REFERENCES Plano_Estudos (id_plano)
        ON DELETE SET NULL,
    CONSTRAINT fk_historico_usuario
        FOREIGN KEY (fk_Usuario_id_usuario)
        REFERENCES Usuario (id_usuario)
        ON DELETE CASCADE,
    CONSTRAINT ck_historico_tokens
        CHECK (tokens_entrada >= 0 AND tokens_saida >= 0),
    CONSTRAINT ck_historico_custo
        CHECK (custo_total >= 0)
);

-- ---------------------------------------------------------------------
-- Índices em FKs (o PostgreSQL NÃO cria índice automático para FK).
-- Nas tabelas com PK composta, a PK já cobre a 1ª coluna.
-- ---------------------------------------------------------------------
-- Nomes únicos (ignorando maiúsculas, acentos e espaços repetidos): o banco
-- impede instituições e cursos repetidos mesmo com dois cadastros simultâneos.
CREATE UNIQUE INDEX uq_instituicao_nome
    ON Instituicao (norm_nome(nome));
CREATE UNIQUE INDEX uq_curso_instituicao_nome
    ON Curso (fk_Instituicao_id_instituicao, norm_nome(nome));
CREATE INDEX idx_curso_instituicao     ON Curso (fk_Instituicao_id_instituicao);
CREATE INDEX idx_usuario_curso         ON Usuario (fk_Curso_id_curso);
CREATE INDEX idx_cursa_disciplina      ON cursa (fk_Disciplina_id_disciplina);
CREATE INDEX idx_disciplina_criador    ON Disciplina (fk_Usuario_id_criador);
CREATE INDEX idx_atividade_disciplina  ON Atividade (fk_Disciplina_id_disciplina);
CREATE INDEX idx_atividade_criador     ON Atividade (fk_Usuario_id_criador);
CREATE INDEX idx_atvusu_atividade      ON Atividade_Usuario (fk_Atividade_id_atividade);
CREATE INDEX idx_sessao_usuario_ativ   ON Sessao_Estudo (fk_Usuario_id_usuario, fk_Atividade_id_atividade);
CREATE INDEX idx_participa_grupo       ON participa (fk_Grupo_Estudos_id_grupo);
CREATE INDEX idx_material_disciplina   ON Material (fk_Disciplina_id_disciplina);
CREATE INDEX idx_material_autor        ON Material (fk_Usuario_id_autor);
CREATE INDEX idx_plano_disciplina      ON Plano_Estudos (fk_Disciplina_id_disciplina);
CREATE INDEX idx_plano_usuario         ON Plano_Estudos (fk_Usuario_id_usuario, data DESC);
CREATE INDEX idx_historico_plano       ON Historico_Tokens_IA (fk_Plano_Estudos_id_plano);
CREATE INDEX idx_historico_usuario_data ON Historico_Tokens_IA (fk_Usuario_id_usuario, data_requi);
