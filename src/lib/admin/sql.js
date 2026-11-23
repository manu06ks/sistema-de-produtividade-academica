// GERADO a partir dos arquivos da pasta banco/ (unistudy_ddl.sql, unistudy_carga.sql e
// unistudy_drop.sql). Fica embutido em JS para funcionar no servidor standalone do Azure,
// que não leva arquivos soltos junto. Para alterar, edite os .sql e gere este arquivo de novo.

export const DDL = String.raw`-- =====================================================================
-- UniStudy - DDL PostgreSQL (versão 8, final)
-- Baseado nos modelos conceitual e lógico mais recentes.
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
`;

export const CARGA = String.raw`-- =====================================================================
-- UniStudy - carga de dados de demonstração (gerada; não editar à mão)
-- Rode DEPOIS do script DDL, em banco com as tabelas vazias.
-- Com esta carga, as 3 consultas da seção 6 do relatório devolvem
-- exatamente os resultados apresentados no relatório.
-- __SENHA_HASH__ é substituído pelo hash bcrypt da senha de demonstração.
-- =====================================================================

INSERT INTO Instituicao (id_instituicao, nome, sigla) VALUES
  (1, 'Universidade Federal de Santa Catarina', 'UFSC'),
  (2, 'Universidade do Estado de Santa Catarina', 'UDESC');

INSERT INTO Curso (id_curso, nome, fk_Instituicao_id_instituicao) VALUES
  (1, 'Engenharia de Computação', 1),
  (2, 'Ciência da Computação', 1),
  (3, 'Engenharia Elétrica', 1),
  (4, 'Ciência da Computação', 2);

INSERT INTO Usuario (id_usuario, nome, email, senha_hash, data_cadastro, fk_Curso_id_curso) VALUES
  (1, 'Cathryn Haddick', 'cathryn.haddick@unistudy.demo', '__SENHA_HASH__', '2026-08-03 09:00:00', 1),
  (2, 'Yankee Colbourne', 'yankee.colbourne@unistudy.demo', '__SENHA_HASH__', '2026-08-06 10:00:00', 1),
  (3, 'Zsazsa Penticost', 'zsazsa.penticost@unistudy.demo', '__SENHA_HASH__', '2026-08-09 11:00:00', 2),
  (4, 'Suzann Milsap', 'suzann.milsap@unistudy.demo', '__SENHA_HASH__', '2026-08-12 12:00:00', 2),
  (5, 'Viv Bapty', 'viv.bapty@unistudy.demo', '__SENHA_HASH__', '2026-08-15 13:00:00', 1),
  (6, 'Stirling Augar', 'stirling.augar@unistudy.demo', '__SENHA_HASH__', '2026-08-18 14:00:00', 3),
  (7, 'Michail Varcoe', 'michail.varcoe@unistudy.demo', '__SENHA_HASH__', '2026-08-21 15:00:00', 1),
  (8, 'Hewitt Fust', 'hewitt.fust@unistudy.demo', '__SENHA_HASH__', '2026-08-24 16:00:00', 2),
  (9, 'Lea Goodings', 'lea.goodings@unistudy.demo', '__SENHA_HASH__', '2026-08-27 17:00:00', 1),
  (10, 'Derron Maccree', 'derron.maccree@unistudy.demo', '__SENHA_HASH__', '2026-08-30 18:00:00', 2),
  (11, 'Mela Pes', 'mela.pes@unistudy.demo', '__SENHA_HASH__', '2026-09-02 19:00:00', 4),
  (12, 'Herc Garnsworth', 'herc.garnsworth@unistudy.demo', '__SENHA_HASH__', '2026-09-05 20:00:00', 1),
  (13, 'Joleen Debold', 'joleen.debold@unistudy.demo', '__SENHA_HASH__', '2026-09-08 21:00:00', 3),
  (14, 'Arch Barns', 'arch.barns@unistudy.demo', '__SENHA_HASH__', '2026-09-11 22:00:00', 2),
  (15, 'Nathanael Pottell', 'nathanael.pottell@unistudy.demo', '__SENHA_HASH__', '2026-09-14 23:00:00', 1),
  (16, 'Robin Stirton', 'robin.stirton@unistudy.demo', '__SENHA_HASH__', '2026-09-18 00:00:00', 2),
  (17, 'Marina Duarte', 'marina.duarte@unistudy.demo', '__SENHA_HASH__', '2026-09-21 01:00:00', 3),
  (18, 'Pedro Alves', 'pedro.alves@unistudy.demo', '__SENHA_HASH__', '2026-09-24 02:00:00', 1),
  (19, 'Camila Ribeiro', 'camila.ribeiro@unistudy.demo', '__SENHA_HASH__', '2026-09-27 03:00:00', 2);

INSERT INTO Disciplina (id_disciplina, nome, semestre_letivo, nome_professor, codigo_compartilhamento, cor, fk_Usuario_id_criador) VALUES
  (1, 'Banco de Dados I', '2026.2', 'Alexandre Leopoldo Gonçalves', 'BD1A2B', '#7c3aed', 1),
  (2, 'Arquitetura de Computadores', '2026.2', 'Fernanda Nogueira', 'ARQ3C4', '#2563eb', 6),
  (3, 'Sistemas Digitais', '2026.2', 'Roberto Camargo', 'SD5E6F', '#0891b2', 6),
  (4, 'Estruturas de Dados', '2026.2', 'Patrícia Medeiros', 'ED7G8H', '#16a34a', 1),
  (5, 'Engenharia de Software', '2026.2', 'Helena Vasconcelos', 'ES9J2K', '#ea580c', 2),
  (6, 'Redes de Computadores', '2026.2', 'Marcos Tavares', 'RC3L4M', '#db2777', 3),
  (7, 'Cálculo II', '2026.2', 'Sérgio Albuquerque', 'CA5N6P', '#ca8a04', 13),
  (8, 'Sistemas Operacionais', '2026.2', 'Luciana Prado', 'SO7Q8R', '#dc2626', 7);

INSERT INTO cursa (fk_Usuario_id_usuario, fk_Disciplina_id_disciplina) VALUES
  (1, 1),
  (5, 1),
  (9, 1),
  (10, 1),
  (11, 1),
  (12, 1),
  (16, 1),
  (17, 1),
  (19, 1),
  (6, 2),
  (7, 2),
  (9, 2),
  (11, 2),
  (16, 2),
  (17, 2),
  (2, 3),
  (6, 3),
  (7, 3),
  (8, 3),
  (13, 3),
  (16, 3),
  (17, 3),
  (19, 3),
  (1, 4),
  (4, 4),
  (10, 4),
  (13, 4),
  (14, 4),
  (16, 4),
  (18, 4),
  (2, 5),
  (3, 5),
  (5, 5),
  (15, 5),
  (17, 5),
  (18, 5),
  (1, 6),
  (3, 6),
  (4, 6),
  (8, 6),
  (15, 6),
  (18, 6),
  (19, 6),
  (6, 7),
  (10, 7),
  (13, 7),
  (15, 7),
  (16, 7),
  (19, 7),
  (1, 8),
  (2, 8),
  (7, 8),
  (9, 8),
  (18, 8);

INSERT INTO Atividade (id_atividade, titulo, descricao, data_vencimento, tipo_atividade, peso_nota, compartilhada, fk_Disciplina_id_disciplina, fk_Usuario_id_criador) VALUES
  (1, 'Modelagem ER do trabalho final', 'Atividade de demonstração: Modelagem ER do trabalho final.', '2026-10-28', 'Trabalho', 2.5, TRUE, 1, 5),
  (2, 'Lista de exercícios de álgebra relacional', 'Atividade de demonstração: Lista de exercícios de álgebra relacional.', '2026-11-28', 'Tarefa', 1.0, TRUE, 1, 1),
  (3, 'Prova 1 - Modelo relacional', 'Atividade de demonstração: Prova 1 - Modelo relacional.', '2026-12-03', 'Prova', 3.0, TRUE, 1, 10),
  (4, 'Consultas SQL com agregação', 'Atividade de demonstração: Consultas SQL com agregação.', '2026-10-07', 'Tarefa', 1.0, TRUE, 1, 9),
  (5, 'Lista de exercícios de pipeline', 'Atividade de demonstração: Lista de exercícios de pipeline.', '2026-12-03', 'Tarefa', 1.0, TRUE, 2, 7),
  (6, 'Prova 1 - Hierarquia de memória', 'Atividade de demonstração: Prova 1 - Hierarquia de memória.', '2026-11-15', 'Prova', 3.0, TRUE, 2, 16),
  (7, 'Trabalho de simulação de cache', 'Atividade de demonstração: Trabalho de simulação de cache.', '2026-11-22', 'Trabalho', 2.5, TRUE, 2, 6),
  (8, 'Projeto de contador síncrono', 'Atividade de demonstração: Projeto de contador síncrono.', '2026-11-14', 'Trabalho', 2.5, TRUE, 3, 7),
  (9, 'Lista de álgebra booleana', 'Atividade de demonstração: Lista de álgebra booleana.', '2026-11-19', 'Tarefa', 1.0, TRUE, 3, 8),
  (10, 'Prova 1 - Circuitos sequenciais', 'Atividade de demonstração: Prova 1 - Circuitos sequenciais.', '2026-11-03', 'Prova', 3.0, TRUE, 3, 6),
  (11, 'Prática com FPGA', 'Atividade de demonstração: Prática com FPGA.', '2026-10-15', 'Trabalho', 2.5, TRUE, 3, 2),
  (12, 'Lista de árvores binárias', 'Atividade de demonstração: Lista de árvores binárias.', '2026-11-12', 'Tarefa', 1.0, TRUE, 4, 4),
  (13, 'Trabalho de tabelas hash', 'Atividade de demonstração: Trabalho de tabelas hash.', '2026-10-08', 'Trabalho', 2.5, TRUE, 4, 1),
  (14, 'Prova 1 - Estruturas lineares', 'Atividade de demonstração: Prova 1 - Estruturas lineares.', '2026-10-16', 'Prova', 3.0, TRUE, 4, 10),
  (15, 'Documento de requisitos', 'Atividade de demonstração: Documento de requisitos.', '2026-11-28', 'Trabalho', 2.5, TRUE, 5, 5),
  (16, 'Diagrama de classes', 'Atividade de demonstração: Diagrama de classes.', '2026-11-28', 'Trabalho', 2.5, TRUE, 5, 2),
  (17, 'Prova 1 - Processos de software', 'Atividade de demonstração: Prova 1 - Processos de software.', '2026-11-18', 'Prova', 3.0, TRUE, 5, 3),
  (18, 'Lista de endereçamento IP', 'Atividade de demonstração: Lista de endereçamento IP.', '2026-11-20', 'Tarefa', 1.0, TRUE, 6, 3),
  (19, 'Relatório de laboratório TCP/IP', 'Atividade de demonstração: Relatório de laboratório TCP/IP.', '2026-11-15', 'Trabalho', 2.5, TRUE, 6, 1),
  (20, 'Prova 1 - Camada de transporte', 'Atividade de demonstração: Prova 1 - Camada de transporte.', '2026-11-04', 'Prova', 3.0, TRUE, 6, 4),
  (21, 'Lista 1 - Integrais', 'Atividade de demonstração: Lista 1 - Integrais.', '2026-10-26', 'Tarefa', 1.0, TRUE, 7, 15),
  (22, 'Prova 1 - Integrais múltiplas', 'Atividade de demonstração: Prova 1 - Integrais múltiplas.', '2026-11-11', 'Prova', 3.0, TRUE, 7, 10),
  (23, 'Lista 2 - Séries', 'Atividade de demonstração: Lista 2 - Séries.', '2026-10-23', 'Tarefa', 1.0, TRUE, 7, 13),
  (24, 'Trabalho de escalonamento de processos', 'Atividade de demonstração: Trabalho de escalonamento de processos.', '2026-11-24', 'Trabalho', 2.5, TRUE, 8, 7),
  (25, 'Prova 1 - Sincronização', 'Atividade de demonstração: Prova 1 - Sincronização.', '2026-12-03', 'Prova', 3.0, TRUE, 8, 9);

INSERT INTO Atividade_Usuario (fk_Usuario_id_usuario, fk_Atividade_id_atividade, status_convite, status, prioridade, removida_em) VALUES
  (5, 1, 'Aceita', 'A Fazer', 'Média', NULL),
  (9, 1, 'Aceita', 'Concluído', 'Baixa', NULL),
  (16, 1, 'Aceita', 'A Fazer', 'Média', NULL),
  (19, 1, 'Aceita', 'Concluído', 'Baixa', NULL),
  (1, 2, 'Aceita', 'A Fazer', 'Alta', NULL),
  (17, 2, 'Aceita', 'A Fazer', 'Média', NULL),
  (10, 3, 'Aceita', 'Concluído', 'Baixa', NULL),
  (11, 3, 'Aceita', 'A Fazer', 'Média', NULL),
  (16, 3, 'Aceita', 'Fazendo', 'Média', NULL),
  (9, 4, 'Aceita', 'Concluído', 'Baixa', NULL),
  (12, 4, 'Aceita', 'Concluído', 'Alta', NULL),
  (16, 4, 'Aceita', 'Concluído', 'Baixa', NULL),
  (7, 5, 'Aceita', 'Concluído', 'Baixa', NULL),
  (9, 5, 'Aceita', 'Concluído', 'Baixa', NULL),
  (16, 6, 'Aceita', 'Concluído', 'Média', NULL),
  (17, 6, 'Aceita', 'Concluído', 'Média', NULL),
  (6, 7, 'Aceita', 'Concluído', 'Média', NULL),
  (11, 7, 'Aceita', 'A Fazer', 'Alta', NULL),
  (7, 8, 'Aceita', 'A Fazer', 'Média', NULL),
  (19, 8, 'Aceita', 'Concluído', 'Média', NULL),
  (8, 9, 'Aceita', 'Concluído', 'Alta', NULL),
  (16, 9, 'Aceita', 'A Fazer', 'Baixa', NULL),
  (6, 10, 'Aceita', 'Concluído', 'Média', NULL),
  (13, 10, 'Aceita', 'Fazendo', 'Média', NULL),
  (2, 11, 'Aceita', 'Concluído', 'Média', NULL),
  (17, 11, 'Aceita', 'Concluído', 'Média', NULL),
  (4, 12, 'Aceita', 'Concluído', 'Média', NULL),
  (13, 12, 'Aceita', 'Fazendo', 'Média', NULL),
  (14, 12, 'Aceita', 'A Fazer', 'Baixa', NULL),
  (1, 13, 'Aceita', 'Concluído', 'Baixa', NULL),
  (18, 13, 'Aceita', 'Concluído', 'Baixa', NULL),
  (10, 14, 'Aceita', 'Fazendo', 'Baixa', NULL),
  (16, 14, 'Aceita', 'Concluído', 'Média', NULL),
  (5, 15, 'Aceita', 'A Fazer', 'Média', NULL),
  (17, 15, 'Aceita', 'Concluído', 'Média', NULL),
  (2, 16, 'Aceita', 'Concluído', 'Média', NULL),
  (15, 16, 'Aceita', 'Concluído', 'Média', NULL),
  (3, 17, 'Aceita', 'Concluído', 'Média', NULL),
  (18, 17, 'Aceita', 'Fazendo', 'Alta', NULL),
  (3, 18, 'Aceita', 'Concluído', 'Alta', NULL),
  (15, 18, 'Aceita', 'A Fazer', 'Média', NULL),
  (19, 18, 'Aceita', 'A Fazer', 'Alta', NULL),
  (1, 19, 'Aceita', 'A Fazer', 'Média', NULL),
  (18, 19, 'Aceita', 'Concluído', 'Média', NULL),
  (4, 20, 'Aceita', 'Fazendo', 'Alta', NULL),
  (8, 20, 'Aceita', 'Concluído', 'Baixa', NULL),
  (15, 21, 'Aceita', 'A Fazer', 'Média', NULL),
  (19, 21, 'Aceita', 'A Fazer', 'Média', NULL),
  (10, 22, 'Aceita', 'Concluído', 'Média', NULL),
  (16, 22, 'Aceita', 'Concluído', 'Média', NULL),
  (6, 23, 'Aceita', 'A Fazer', 'Alta', NULL),
  (13, 23, 'Aceita', 'Fazendo', 'Média', NULL),
  (1, 24, 'Aceita', 'A Fazer', 'Média', NULL),
  (2, 24, 'Aceita', 'Fazendo', 'Média', NULL),
  (7, 24, 'Aceita', 'Concluído', 'Média', NULL),
  (9, 25, 'Aceita', 'Fazendo', 'Alta', NULL),
  (18, 25, 'Aceita', 'Concluído', 'Alta', NULL),
  (17, 3, 'Pendente', 'A Fazer', 'Média', NULL),
  (18, 6, 'Pendente', 'A Fazer', 'Alta', NULL),
  (19, 13, 'Recusada', 'A Fazer', 'Baixa', NULL),
  (4, 17, 'Recusada', 'A Fazer', 'Baixa', NULL),
  (5, 8, 'Aceita', 'Concluído', 'Média', '2026-11-10 14:30:00');

INSERT INTO Sessao_Estudo (id_sessao, data_hora_inicio, data_hora_fim, tempo_total_minutos, fk_Usuario_id_usuario, fk_Atividade_id_atividade) VALUES
  (1, '2026-10-06 17:00:00', '2026-10-06 18:15:00', 75, 14, 12),
  (2, '2026-10-09 08:10:00', '2026-10-09 08:20:00', 10, 18, 17),
  (3, '2026-10-09 14:20:00', '2026-10-09 15:20:00', 60, 11, 3),
  (4, '2026-10-09 16:40:00', '2026-10-09 18:40:00', 120, 13, 10),
  (5, '2026-10-09 19:00:00', '2026-10-09 20:45:00', 105, 5, 1),
  (6, '2026-10-11 19:20:00', '2026-10-11 20:20:00', 60, 15, 18),
  (7, '2026-10-13 08:40:00', '2026-10-13 10:10:00', 90, 1, 24),
  (8, '2026-10-13 10:20:00', '2026-10-13 10:55:00', 35, 19, 21),
  (9, '2026-10-14 07:40:00', '2026-10-14 09:25:00', 105, 1, 2),
  (10, '2026-10-15 16:30:00', '2026-10-15 16:47:00', 17, 17, 6),
  (11, '2026-10-16 16:40:00', '2026-10-16 18:55:00', 135, 2, 16),
  (12, '2026-10-17 11:30:00', '2026-10-17 13:45:00', 135, 6, 23),
  (13, '2026-10-17 20:40:00', '2026-10-17 22:40:00', 120, 4, 12),
  (14, '2026-10-19 13:30:00', '2026-10-19 14:00:00', 30, 17, 6),
  (15, '2026-10-20 09:10:00', '2026-10-20 10:40:00', 90, 10, 14),
  (16, '2026-10-22 09:50:00', '2026-10-22 11:50:00', 120, 8, 9),
  (17, '2026-10-24 08:30:00', '2026-10-24 08:57:00', 27, 18, 13),
  (18, '2026-10-24 19:10:00', '2026-10-24 21:19:00', 129, 17, 2),
  (19, '2026-10-25 12:50:00', '2026-10-25 13:23:00', 33, 19, 18),
  (20, '2026-10-28 11:10:00', '2026-10-28 11:20:00', 10, 19, 8),
  (21, '2026-10-28 18:30:00', '2026-10-28 18:46:00', 16, 17, 2),
  (22, '2026-10-29 13:00:00', '2026-10-29 14:30:00', 90, 7, 8),
  (23, '2026-10-31 18:20:00', '2026-10-31 18:30:00', 10, 17, 11),
  (24, '2026-11-01 19:50:00', '2026-11-01 20:03:00', 13, 17, 11),
  (25, '2026-11-02 12:00:00', '2026-11-02 13:30:00', 90, 6, 7),
  (26, '2026-11-02 12:30:00', '2026-11-02 12:56:00', 26, 18, 25),
  (27, '2026-11-02 14:20:00', '2026-11-02 14:41:00', 21, 17, 15),
  (28, '2026-11-03 07:50:00', '2026-11-03 08:00:00', 10, 19, 1),
  (29, '2026-11-03 17:10:00', '2026-11-03 18:40:00', 90, 1, 19),
  (30, '2026-11-05 15:10:00', '2026-11-05 16:25:00', 75, 10, 3),
  (31, '2026-11-05 16:00:00', '2026-11-05 16:10:00', 10, 19, 21),
  (32, '2026-11-07 08:50:00', '2026-11-07 10:05:00', 75, 3, 18),
  (33, '2026-11-07 09:10:00', '2026-11-07 10:55:00', 105, 8, 9),
  (34, '2026-11-07 12:30:00', '2026-11-07 13:04:00', 34, 18, 25),
  (35, '2026-11-07 19:50:00', '2026-11-07 21:05:00', 75, 9, 5),
  (36, '2026-11-09 08:00:00', '2026-11-09 09:30:00', 90, 2, 11),
  (37, '2026-11-09 15:50:00', '2026-11-09 16:07:00', 17, 17, 2),
  (38, '2026-11-10 20:30:00', '2026-11-10 23:00:00', 150, 6, 7),
  (39, '2026-11-11 13:40:00', '2026-11-11 14:40:00', 60, 16, 1),
  (40, '2026-11-12 14:50:00', '2026-11-12 16:35:00', 105, 1, 2),
  (41, '2026-11-14 16:40:00', '2026-11-14 18:55:00', 135, 3, 17),
  (42, '2026-11-15 10:00:00', '2026-11-15 11:30:00', 90, 1, 13),
  (43, '2026-11-15 14:10:00', '2026-11-15 14:28:00', 18, 18, 13),
  (44, '2026-11-15 17:00:00', '2026-11-15 18:15:00', 75, 11, 7),
  (45, '2026-11-16 20:30:00', '2026-11-16 20:47:00', 17, 17, 15),
  (46, '2026-11-17 13:10:00', '2026-11-17 15:40:00', 150, 7, 5),
  (47, '2026-11-17 15:50:00', '2026-11-17 17:58:00', 128, 17, 2),
  (48, '2026-11-19 08:30:00', '2026-11-19 09:13:00', 43, 17, 6);

INSERT INTO Grupo_Estudos (id_grupo, nome, descricao, data_criacao, status_ativo, codigo_convite) VALUES
  (1, 'Algoritmos e Sistemas', 'Revisão semanal de algoritmos e sistemas.', '2026-09-10', TRUE, 'ALG123'),
  (2, 'Hardware e FPGA UFSC', 'Estudos de hardware, FPGA e sistemas digitais.', '2026-09-13', TRUE, 'HWF456'),
  (3, 'Maratona Banco de Dados', 'Preparação para a prova de Banco de Dados I.', '2026-09-16', TRUE, 'MBD789'),
  (4, 'Monitoria Cálculo II', 'Lista de exercícios e monitoria de Cálculo II.', '2026-09-19', TRUE, 'MCA234');

INSERT INTO participa (fk_Usuario_id_usuario, fk_Grupo_Estudos_id_grupo, data_ingresso, papel_membro) VALUES
  (1, 1, '2026-09-12', 'Administrador'),
  (2, 1, '2026-09-13', 'Membro'),
  (3, 1, '2026-09-14', 'Membro'),
  (4, 1, '2026-09-15', 'Membro'),
  (5, 1, '2026-09-16', 'Membro'),
  (6, 2, '2026-09-15', 'Administrador'),
  (7, 2, '2026-09-16', 'Membro'),
  (8, 2, '2026-09-17', 'Membro'),
  (2, 2, '2026-09-18', 'Membro'),
  (9, 2, '2026-09-19', 'Membro'),
  (1, 3, '2026-09-18', 'Administrador'),
  (6, 3, '2026-09-19', 'Membro'),
  (3, 3, '2026-09-20', 'Membro'),
  (10, 3, '2026-09-21', 'Membro'),
  (11, 3, '2026-09-22', 'Membro'),
  (12, 3, '2026-09-23', 'Membro'),
  (13, 4, '2026-09-21', 'Administrador'),
  (14, 4, '2026-09-22', 'Membro'),
  (15, 4, '2026-09-23', 'Membro'),
  (16, 4, '2026-09-24', 'Membro');

INSERT INTO Material (id_material, nome_arquivo, formato, tamanho_kb, url, data_upload, tipo, fk_Disciplina_id_disciplina, fk_Usuario_id_autor, fk_Atividade_id_atividade) VALUES
  (1, 'Modelagem ER - slides.pdf', 'pdf', 840, 'demo/bd1/modelagem-er-slides.pdf', '2026-10-02 10:15:00', 'Slides', 1, 1, NULL),
  (2, 'Resumo de SQL.pdf', 'pdf', 312, 'demo/bd1/resumo-sql.pdf', '2026-10-20 18:40:00', 'Resumo', 1, 3, NULL),
  (3, 'Pipeline MIPS.pdf', 'pdf', 1210, 'demo/arq/pipeline-mips.pdf', '2026-10-08 09:05:00', 'Slides', 2, 6, NULL),
  (4, 'Enunciado do trabalho final.pdf', 'pdf', 96, 'demo/bd1/enunciado-trabalho-final.pdf', '2026-11-01 08:30:00', 'Anexo', 1, 1, 1);

INSERT INTO Plano_Estudos (id_plano, data, conteudo, fk_Disciplina_id_disciplina, fk_Usuario_id_usuario) VALUES
  (1, '2026-11-22', '{"versao": 1, "modelo": "gemini-3.1-flash-lite", "parametros": {"data_inicio": "2026-11-22", "data_alvo": "2026-11-25", "horas_por_dia": 1.5, "conteudos": "Modelo relacional e SQL"}, "plano": {"resumo": "Foco na prova de Modelo relacional, com revisão espaçada e lista de exercícios na véspera.", "dias": [{"data": "2026-11-23", "foco": "Modelo relacional e chaves", "blocos": [{"titulo": "Revisar chaves primárias e estrangeiras no modelo relacional", "minutos": 40, "tipo": "revisao", "atividade_id": 3, "detalhes": "Resuma com suas palavras e liste 3 exemplos."}, {"titulo": "Resolver 6 exercícios de álgebra relacional", "minutos": 45, "tipo": "exercicios", "atividade_id": 2, "detalhes": "Comece pelos de junção."}]}, {"data": "2026-11-24", "foco": "Consultas SQL", "blocos": [{"titulo": "Escrever 5 consultas com GROUP BY e HAVING", "minutos": 50, "tipo": "exercicios", "atividade_id": 4, "detalhes": "Confira o resultado no PostgreSQL."}]}, {"data": "2026-11-25", "foco": "Dia livre para descansar", "blocos": []}], "dicas": ["Resolva os exercícios sem consultar o resumo.", "Revise os erros da lista anterior antes da prova."]}, "ajustes": [], "atividades": [{"id": 2, "titulo": "Lista de exercícios de álgebra relacional", "tipo": "Tarefa", "vencimento": "2026-11-28"}, {"id": 3, "titulo": "Prova 1 - Modelo relacional", "tipo": "Prova", "vencimento": "2026-12-03"}, {"id": 4, "titulo": "Consultas SQL com agregação", "tipo": "Tarefa", "vencimento": "2026-10-07"}], "tentativas": 1, "tokens_estimados": 2100}', 1, 1);

INSERT INTO Historico_Tokens_IA (id_historico, data_requi, tokens_entrada, tokens_saida, custo_total, fk_Plano_Estudos_id_plano, fk_Usuario_id_usuario) VALUES
  (1, '2026-11-22 15:12:00', 2300, 1800, 0.003275, 1, 1),
  (2, '2026-11-22 15:20:00', 1950, 0, 0.000487, NULL, 1);

-- Ajusta as sequências (SERIAL) para os próximos INSERTs começarem depois dos ids desta carga.
SELECT setval(pg_get_serial_sequence('Instituicao', 'id_instituicao'), (SELECT MAX(id_instituicao) FROM Instituicao));
SELECT setval(pg_get_serial_sequence('Curso', 'id_curso'), (SELECT MAX(id_curso) FROM Curso));
SELECT setval(pg_get_serial_sequence('Usuario', 'id_usuario'), (SELECT MAX(id_usuario) FROM Usuario));
SELECT setval(pg_get_serial_sequence('Disciplina', 'id_disciplina'), (SELECT MAX(id_disciplina) FROM Disciplina));
SELECT setval(pg_get_serial_sequence('Atividade', 'id_atividade'), (SELECT MAX(id_atividade) FROM Atividade));
SELECT setval(pg_get_serial_sequence('Sessao_Estudo', 'id_sessao'), (SELECT MAX(id_sessao) FROM Sessao_Estudo));
SELECT setval(pg_get_serial_sequence('Grupo_Estudos', 'id_grupo'), (SELECT MAX(id_grupo) FROM Grupo_Estudos));
SELECT setval(pg_get_serial_sequence('Material', 'id_material'), (SELECT MAX(id_material) FROM Material));
SELECT setval(pg_get_serial_sequence('Plano_Estudos', 'id_plano'), (SELECT MAX(id_plano) FROM Plano_Estudos));
SELECT setval(pg_get_serial_sequence('Historico_Tokens_IA', 'id_historico'), (SELECT MAX(id_historico) FROM Historico_Tokens_IA));
`;

export const DROP = String.raw`-- =====================================================================
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
`;
