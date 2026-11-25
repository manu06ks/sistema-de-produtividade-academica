--- Insere as Universidades ---
INSERT INTO Instituicao (id_instituicao, nome, sigla)
VALUES (1, 'Universidade Federal de Santa Catarina', 'UFSC');

INSERT INTO Instituicao (id_instituicao, nome, sigla)
VALUES (2, 'Universidade Federal do Rio de Janeiro', 'UFRJ');

INSERT INTO Instituicao (id_instituicao, nome, sigla)
VALUES (3, 'Universidade Federal do Rio Grande do Sul', 'UFRGS');

INSERT INTO Instituicao (id_instituicao, nome, sigla)
VALUES (4, 'Pontificia Universidade Catolica', 'PUC');

--- Insere os Cursos ---
INSERT INTO Curso (id_curso, nome, fk_instituicao_id_instituicao)
VALUES (1, 'Engenharia de Computacao', 1);

INSERT INTO Curso (id_curso, nome, fk_instituicao_id_instituicao)
VALUES (2, 'Gestao da Tecnologia da Informacao', 4);

INSERT INTO Curso (id_curso, nome, fk_instituicao_id_instituicao)
VALUES (3, 'Defesa e Gestao Estrategica Internacional', 2);

INSERT INTO Curso (id_curso, nome, fk_instituicao_id_instituicao)
VALUES (4, 'Biomedicina', 3);


--- Popular Tabelas para testes ---
--- Insere os Usuarios ---

--- Senha padrao para todos os usuarios = Teste@123 --- 
INSERT INTO Usuario (id_usuario, nome, email, senha_hash, data_cadastro, fk_Curso_id_curso) VALUES
(1, 'Cathryn Haddick', 'chaddick0@cornell.edu', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2025-11-29 00:00:00', 1),
(2, 'Stirling Augar', 'saugar1@comsenz.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-10-02 00:00:00', 2),
(3, 'Zsazsa Penticost', 'zpenticost2@businesswire.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-01-15 00:00:00', 3),
(4, 'Herbert Kintzel', 'hkintzel3@bigcartel.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-06-03 00:00:00', 4),
(5, 'Mela Pes', 'mpes4@comcast.net', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-10-10 00:00:00', 1),
(6, 'Gustav Gutch', 'ggutch5@dailymail.co.uk', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-05-30 00:00:00', 2),
(7, 'Derron Maccree', 'dmaccree6@foxnews.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-06-15 00:00:00', 3),
(8, 'Odelia Kienl', 'okienl7@tamu.edu', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-04-11 00:00:00', 4),
(9, 'Britta Hulstrom', 'bhulstrom8@sina.com.cn', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-03-30 00:00:00', 1),
(10, 'Nicolle Keiling', 'nkeiling9@arizona.edu', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-04-19 00:00:00', 2),
(11, 'Michail Varcoe', 'mvarcoea@weather.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-08-19 00:00:00', 3),
(12, 'Suzann Milsap', 'smilsapb@engadget.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-03-11 00:00:00', 4),
(13, 'Hewitt Fust', 'hfustc@sina.com.cn', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-11-03 00:00:00', 1),
(14, 'Nathanael Pottell', 'npottelld@shutterfly.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-10-03 00:00:00', 2),
(15, 'Terrence Eales', 'tealese@w3.org', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-11-03 00:00:00', 3),
(16, 'Joleen Debold', 'jdeboldf@hibu.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-04-28 00:00:00', 4),
(17, 'Gabbi Cadding', 'gcaddingg@trellian.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-06-04 00:00:00', 1),
(18, 'Kessia Tucker', 'ktuckerh@instagram.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-10-29 00:00:00', 2),
(19, 'Yankee Colbourne', 'ycolbournei@reddit.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-07-26 00:00:00', 3),
(20, 'Livia Kyte', 'lkytej@microsoft.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-03-31 00:00:00', 4),
(21, 'Temp Sturges', 'tsturgesk@instagram.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-01-07 00:00:00', 1),
(22, 'Herc Garnsworth', 'hgarnsworthl@discuz.net', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-03-09 00:00:00', 2),
(23, 'Lenore Roseborough', 'lroseboroughm@cloudflare.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2025-12-29 00:00:00', 3),
(24, 'Robin Stirton', 'rstirtonn@purevolume.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2025-12-20 00:00:00', 4),
(25, 'Viv Bapty', 'vbaptyo@storify.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-02-09 00:00:00', 1),
(26, 'Burl Derrington', 'bderringtonp@go.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-06-20 00:00:00', 2),
(27, 'Wendi Lening', 'wleningq@si.edu', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-10-27 00:00:00', 3),
(28, 'Lea Goodings', 'lgoodingsr@nytimes.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-11-04 00:00:00', 4),
(29, 'Arch Barns', 'abarnss@t-online.de', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-07-12 00:00:00', 1),
(30, 'Bryon Hoofe', 'bhoofet@xing.com', '$2b$10$LTs74lZaPoKwi8bLy0MD1.3JbI0FDtJ40UVerdGLTQhJXFjvODh4S', '2026-06-24 00:00:00', 2);

-- Ajusta as sequences: os ids acima foram informados na mão, então o próximo
-- cadastro feito pela aplicação (SERIAL) precisa começar depois deles.
SELECT setval(pg_get_serial_sequence('instituicao', 'id_instituicao'), (SELECT MAX(id_instituicao) FROM Instituicao));
SELECT setval(pg_get_serial_sequence('curso', 'id_curso'), (SELECT MAX(id_curso) FROM Curso));
SELECT setval(pg_get_serial_sequence('usuario', 'id_usuario'), (SELECT MAX(id_usuario) FROM Usuario));





--- Popular para Consulta 01 e 02 ---
-- =====================================================================
-- 1. DISCIPLINAS (8 disciplinas do semestre 2026.2)
-- =====================================================================
INSERT INTO Disciplina (id_disciplina, nome, semestre_letivo, nome_professor, codigo_compartilhamento, cor, fk_Usuario_id_criador) VALUES
(1, 'Banco de Dados I',          '2026.2', 'Prof. Alexandre Leopoldo Gonçalves', 'BD2026', '#2563eb', 1),
(2, 'Sistemas Digitais',         '2026.2', 'Prof. Rodrigo',                      'SD2026', '#16a34a', 2),
(3, 'Engenharia de Software',    '2026.2', 'Prof. Marina Silva',                 'ES2026', '#9333ea', 3),
(4, 'Estruturas de Dados',       '2026.2', 'Prof. Carlos Mendes',                'ED2026', '#ea580c', 5),
(5, 'Redes de Computadores',     '2026.2', 'Prof. Fernando Souza',               'RC2026', '#0891b2', 7),
(6, 'Arquitetura de Computadores','2026.2','Prof. Henrique Costa',               'AC2026', '#dc2626', 11),
(7, 'Cálculo II',                '2026.2', 'Profa. Patrícia Oliveira',           'CA2026', '#ca8a04', 14),
(8, 'Sistemas Operacionais',     '2026.2', 'Prof. Eduardo Santos',               'SO2026', '#4f46e5', 19);

SELECT setval(pg_get_serial_sequence('disciplina', 'id_disciplina'), 8);

-- =====================================================================
-- 2. MATRÍCULAS (Tabela Cursa - todos os 30 usuários distribuídos)
-- =====================================================================
INSERT INTO Cursa (fk_Usuario_id_usuario, fk_Disciplina_id_disciplina) VALUES
-- Banco de Dados I (10 alunos)
(1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1),(8,1),(9,1),(10,1),
-- Sistemas Digitais (8 alunos)
(1,2),(2,2),(6,2),(7,2),(11,2),(12,2),(13,2),(14,2),
-- Engenharia de Software (8 alunos)
(3,3),(4,3),(8,3),(9,3),(15,3),(16,3),(17,3),(18,3),
-- Estruturas de Dados (8 alunos)
(1,4),(5,4),(10,4),(19,4),(20,4),(21,4),(22,4),(23,4),
-- Redes de Computadores (7 alunos)
(7,5),(12,5),(15,5),(24,5),(25,5),(26,5),(27,5),
-- Arquitetura de Computadores (7 alunos)
(2,6),(11,6),(13,6),(19,6),(28,6),(29,6),(30,6),
-- Cálculo II (6 alunos)
(14,7),(16,7),(20,7),(24,7),(28,7),(29,7),
-- Sistemas Operacionais (6 alunos)
(3,8),(17,8),(19,8),(21,8),(25,8),(30,8);

-- =====================================================================
-- 3. ATIVIDADES (16 atividades distribuídas nas 8 disciplinas)
-- =====================================================================
INSERT INTO Atividade (id_atividade, titulo, descricao, data_vencimento, tipo_atividade, peso_nota, compartilhada, fk_Disciplina_id_disciplina, fk_Usuario_id_criador) VALUES
(1,  'Modelagem Conceitual e Lógica UniStudy', 'Entregar diagramas no brModelo',       '2026-11-15', 'Trabalho', 3.00, TRUE, 1, 1),
(2,  'Lista de Consultas SQL e Joins',         'Resolver 10 exercícios de agregação',  '2026-11-25', 'Tarefa',   1.50, TRUE, 1, 1),
(3,  'Prova 2 - Normalização e Transações',    'Conteúdo completo da unidade 2',       '2026-12-02', 'Prova',    4.00, TRUE, 1, 1),
(4,  'Projeto FIFO em Verilog',                'Síntese e simulação no Quartus Prime', '2026-11-20', 'Trabalho', 3.50, TRUE, 2, 2),
(5,  'Prova de Máquinas de Estado',            'FSM Mealy e Moore',                    '2026-11-30', 'Prova',    5.00, TRUE, 2, 2),
(6,  'Diagrama de Casos de Uso e Requisitos',  'Documentação RF e RNF',                '2026-11-18', 'Trabalho', 2.50, TRUE, 3, 3),
(7,  'Sprints e Backlog Ágil',                 'Planejamento Scrum',                   '2026-11-27', 'Tarefa',   1.50, TRUE, 3, 3),
(8,  'Implementação de Árvore AVL em C++',     'Balanceamento e rotações',             '2026-11-28', 'Tarefa',   2.00, TRUE, 4, 5),
(9,  'Prova Prática de Grafos',                'BFS, DFS e Dijkstra',                  '2026-12-04', 'Prova',    4.00, TRUE, 4, 5),
(10, 'Captura de Pacotes PPPoE no Wireshark',  'Análise de autenticação PAP/CHAP',     '2026-11-21', 'Trabalho', 2.50, TRUE, 5, 7),
(11, 'Lista de Sub-redes IPv4 e IPv6',         'Cálculo CIDR e VLSM',                  '2026-11-29', 'Tarefa',   1.50, TRUE, 5, 7),
(12, 'Processador MIPS Pipeline em Verilog',   'Datapath e tratamento de hazards',     '2026-12-01', 'Trabalho', 4.50, TRUE, 6, 11),
(13, 'Prova de Hierarquia de Memória',         'Cache L1/L2 e memória virtual',        '2026-12-06', 'Prova',    4.00, TRUE, 6, 11),
(14, 'Lista 08 - Derivadas e Otimização',      'Taxa relacionada e regra da cadeia',   '2026-11-19', 'Tarefa',   2.00, TRUE, 7, 14),
(15, 'Prova 3 - Integrais Múltiplas',          'Coordenadas polares e cilíndricas',    '2026-12-05', 'Prova',    4.00, TRUE, 7, 14),
(16, 'Escalonador de Processos e Semáforos',   'Concorrência em C com pthreads',       '2026-12-03', 'Trabalho', 3.50, TRUE, 8, 19);

SELECT setval(pg_get_serial_sequence('atividade', 'id_atividade'), 16);

-- =====================================================================
-- 4. ATIVIDADE_USUARIO (56 registros aqui + 12 no complemento mais abaixo = 68:
--    Aceitas, Pendentes, Recusadas e Removidas)
-- =====================================================================
INSERT INTO Atividade_Usuario (fk_Usuario_id_usuario, fk_Atividade_id_atividade, status_convite, status, prioridade, removida_em) VALUES
-- Banco de Dados I (final: 12 aceitas válidas, 6 concluídas = 50.0%; + 3 casos ignorados aqui)
(1,  1, 'Aceita',   'Concluído', 'Alta',  NULL),
(2,  1, 'Aceita',   'Concluído', 'Alta',  NULL),
(3,  1, 'Aceita',   'Concluído', 'Média', NULL),
(4,  1, 'Aceita',   'Fazendo',   'Média', NULL),
(1,  2, 'Aceita',   'Concluído', 'Alta',  NULL),
(2,  2, 'Aceita',   'Concluído', 'Média', NULL),
(5,  2, 'Aceita',   'Fazendo',   'Média', NULL),
(1,  3, 'Aceita',   'Fazendo',   'Alta',  NULL),
(2,  3, 'Aceita',   'Fazendo',   'Alta',  NULL),
(6,  3, 'Aceita',   'A Fazer',   'Alta',  NULL),
(7,  3, 'Aceita',   'Fazendo',   'Alta',  NULL),
(8,  1, 'Pendente', 'A Fazer',   'Baixa', NULL),                  -- ignorada (Pendente)
(9,  2, 'Recusada', 'A Fazer',   'Baixa', NULL),                  -- ignorada (Recusada)
(10, 3, 'Aceita',   'Concluído', 'Alta',  '2026-11-20 12:00:00'), -- ignorada (removida_em)

-- Sistemas Digitais (final: 8 aceitas válidas, 5 concluídas = 62.5%; + 1 Pendente)
(1,  4, 'Aceita', 'Concluído', 'Alta',  NULL),
(2,  4, 'Aceita', 'Concluído', 'Alta',  NULL),
(6,  4, 'Aceita', 'Concluído', 'Média', NULL),
(11, 4, 'Aceita', 'Fazendo',   'Alta',  NULL),
(2,  5, 'Aceita', 'Concluído', 'Alta',  NULL),
(12, 5, 'Aceita', 'Concluído', 'Média', NULL),
(13, 5, 'Aceita', 'A Fazer',   'Alta',  NULL),
(1,  5, 'Pendente', 'Fazendo', 'Baixa', NULL),                  -- ignorada (Pendente)

-- Engenharia de Software (final: 6 aceitas válidas, 4 concluídas = 66.7%; + 1 Pendente)
(3,  6, 'Aceita',   'Concluído', 'Alta',  NULL),
(8,  6, 'Aceita',   'Concluído', 'Média', NULL),
(15, 6, 'Aceita',   'Concluído', 'Média', NULL),
(4,  7, 'Aceita',   'Concluído', 'Baixa', NULL),
(16, 7, 'Aceita',   'Fazendo',   'Média', NULL),
(17, 7, 'Aceita',   'A Fazer',   'Baixa', NULL),
(18, 6, 'Pendente', 'A Fazer',   'Baixa', NULL),

-- Estruturas de Dados (final: 7 aceitas válidas, 4 concluídas = 57.1%)
(1,  8, 'Aceita', 'Concluído', 'Alta',  NULL),
(5,  8, 'Aceita', 'Concluído', 'Alta',  NULL),
(10, 8, 'Aceita', 'Fazendo',   'Média', NULL),
(19, 9, 'Aceita', 'Concluído', 'Alta',  NULL),
(20, 9, 'Aceita', 'Fazendo',   'Alta',  NULL),
(21, 9, 'Aceita', 'A Fazer',   'Média', NULL),

-- Redes de Computadores (final: 7 aceitas válidas, 3 concluídas = 42.9%)
(7,  10, 'Aceita', 'Concluído', 'Alta',  NULL),
(12, 10, 'Aceita', 'Fazendo',   'Média', NULL),
(24, 10, 'Aceita', 'A Fazer',   'Média', NULL),
(25, 11, 'Aceita', 'Concluído', 'Baixa', NULL),
(26, 11, 'Aceita', 'Fazendo',   'Baixa', NULL),

-- Arquitetura de Computadores (final: 6 aceitas válidas, 5 concluídas = 83.3%; + 1 Recusada)
(11, 12, 'Aceita', 'Concluído', 'Alta',  NULL),
(13, 12, 'Aceita', 'Concluído', 'Alta',  NULL),
(13, 13, 'Aceita', 'Concluído', 'Alta',  NULL),
(19, 12, 'Aceita', 'Concluído', 'Alta',  NULL),
(19, 13, 'Recusada', 'Concluído', 'Alta',  NULL),
(28, 13, 'Aceita', 'Concluído', 'Média', NULL),
(29, 13, 'Aceita', 'Fazendo',   'Alta',  NULL),

-- Cálculo II (final: 6 aceitas válidas, 2 concluídas = 33.3%)
(14, 14, 'Aceita', 'Concluído', 'Alta',  NULL),
(16, 14, 'Aceita', 'Fazendo',   'Média', NULL),
(20, 14, 'Aceita', 'A Fazer',   'Média', NULL),
(24, 15, 'Aceita', 'Fazendo',   'Alta',  NULL),
(28, 15, 'Aceita', 'A Fazer',   'Alta',  NULL),

-- Sistemas Operacionais (final: 5 aceitas válidas, 2 concluídas = 40.0%)
(3,  16, 'Aceita', 'Concluído', 'Alta',  NULL),
(17, 16, 'Aceita', 'Fazendo',   'Média', NULL),
(25, 16, 'Aceita', 'Fazendo',   'Alta',  NULL),
(30, 16, 'Aceita', 'A Fazer',   'Média', NULL);


-- =====================================================================
-- 5. SESSÕES DE ESTUDO (50 sessões: 48 encerradas + 2 abertas)
-- =====================================================================
INSERT INTO Sessao_Estudo (id_sessao, data_hora_inicio, data_hora_fim, tempo_total_minutos, fk_Usuario_id_usuario, fk_Atividade_id_atividade) VALUES
-- Banco de Dados I (11 sessões = 810 min = 13.5 horas)
(1,  '2026-11-05 14:00:00', '2026-11-05 15:30:00', 90, 1, 1),
(2,  '2026-11-06 19:00:00', '2026-11-06 20:30:00', 90, 2, 1),
(3,  '2026-11-07 09:00:00', '2026-11-07 10:15:00', 75, 3, 1),
(4,  '2026-11-08 16:00:00', '2026-11-08 17:00:00', 60, 4, 1),
(5,  '2026-11-10 10:00:00', '2026-11-10 11:30:00', 90, 1, 2),
(6,  '2026-11-11 20:00:00', '2026-11-11 21:15:00', 75, 2, 2),
(7,  '2026-11-12 15:00:00', '2026-11-12 16:00:00', 60, 5, 2),
(8,  '2026-11-14 08:30:00', '2026-11-14 09:30:00', 60, 6, 3),
(9,  '2026-11-16 18:00:00', '2026-11-16 19:30:00', 90, 7, 3),
(10, '2026-11-18 14:00:00', '2026-11-18 15:15:00', 75, 1, 3),
(11, '2026-11-20 21:00:00', '2026-11-20 21:45:00', 45, 2, 3),

-- Arquitetura de Computadores (8 sessões = 630 min = 10.5 horas)
(12, '2026-11-06 13:00:00', '2026-11-06 14:30:00', 90, 11, 12),
(13, '2026-11-08 19:00:00', '2026-11-08 20:30:00', 90, 13, 12),
(14, '2026-11-10 15:00:00', '2026-11-10 16:30:00', 90, 19, 12),
(15, '2026-11-12 10:00:00', '2026-11-12 11:15:00', 75, 11, 12),
(16, '2026-11-15 17:00:00', '2026-11-15 18:15:00', 75, 28, 13),
(17, '2026-11-17 09:00:00', '2026-11-17 10:15:00', 75, 29, 13),
(18, '2026-11-19 20:00:00', '2026-11-19 21:15:00', 75, 13, 13),
(19, '2026-11-21 14:00:00', '2026-11-21 15:00:00', 60, 19, 13),

-- Sistemas Digitais (8 sessões = 555 min = 9.3 horas)
(20, '2026-11-07 13:30:00', '2026-11-07 15:00:00', 90, 2,  4),
(21, '2026-11-09 18:00:00', '2026-11-09 19:15:00', 75, 1,  4),
(22, '2026-11-11 14:00:00', '2026-11-11 15:00:00', 60, 6,  4),
(23, '2026-11-13 20:00:00', '2026-11-13 21:15:00', 75, 11, 4),
(24, '2026-11-15 08:30:00', '2026-11-15 09:45:00', 75, 2,  5),
(25, '2026-11-17 16:00:00', '2026-11-17 17:00:00', 60, 12, 5),
(26, '2026-11-19 21:00:00', '2026-11-19 22:00:00', 60, 13, 5),
(27, '2026-11-21 10:00:00', '2026-11-21 11:00:00', 60, 1,  5),

-- Estruturas de Dados (6 sessões = 420 min = 7.0 horas)
(28, '2026-11-08 10:00:00', '2026-11-08 11:30:00', 90, 1,  8),
(29, '2026-11-10 16:00:00', '2026-11-10 17:15:00', 75, 5,  8),
(30, '2026-11-13 19:00:00', '2026-11-13 20:00:00', 60, 10, 8),
(31, '2026-11-16 14:00:00', '2026-11-16 15:15:00', 75, 19, 9),
(32, '2026-11-18 18:30:00', '2026-11-18 19:30:00', 60, 20, 9),
(33, '2026-11-20 09:00:00', '2026-11-20 10:00:00', 60, 21, 9),

-- Engenharia de Software (5 sessões = 315 min = 5.3 horas)
(34, '2026-11-09 14:00:00', '2026-11-09 15:15:00', 75, 3,  6),
(35, '2026-11-11 17:00:00', '2026-11-11 18:00:00', 60, 8,  6),
(36, '2026-11-14 19:30:00', '2026-11-14 20:30:00', 60, 15, 6),
(37, '2026-11-17 10:00:00', '2026-11-17 11:00:00', 60, 4,  7),
(38, '2026-11-20 15:00:00', '2026-11-20 16:00:00', 60, 16, 7),

-- Redes de Computadores (4 sessões = 255 min = 4.3 horas)
(39, '2026-11-10 20:00:00', '2026-11-10 21:15:00', 75, 7,  10),
(40, '2026-11-13 15:00:00', '2026-11-13 16:00:00', 60, 12, 10),
(41, '2026-11-16 11:00:00', '2026-11-16 12:00:00', 60, 25, 11),
(42, '2026-11-19 16:30:00', '2026-11-19 17:30:00', 60, 26, 11),

-- Cálculo II (3 sessões = 180 min = 3.0 horas)
(43, '2026-11-12 08:00:00', '2026-11-12 09:00:00', 60, 14, 14),
(44, '2026-11-15 14:00:00', '2026-11-15 15:00:00', 60, 16, 14),
(45, '2026-11-18 19:00:00', '2026-11-18 20:00:00', 60, 24, 15),

-- Sistemas Operacionais (3 sessões = 150 min = 2.5 horas)
(46, '2026-11-14 10:30:00', '2026-11-14 11:30:00', 60, 3,  16),
(47, '2026-11-17 18:00:00', '2026-11-17 18:45:00', 45, 17, 16),
(48, '2026-11-21 16:00:00', '2026-11-21 16:45:00', 45, 25, 16),

-- Sessões em andamento (data_hora_fim IS NULL - ignoradas nos cálculos)
(49, '2026-11-22 13:30:00', NULL, NULL, 1,  2),
(50, '2026-11-22 13:45:00', NULL, NULL, 11, 12);

SELECT setval(pg_get_serial_sequence('sessao_estudo', 'id_sessao'), 50);

-- Datas relativas a HOJE: a aplicação só conta sessões de "hoje", "esta semana"
-- e "este mês" (horário de São Paulo). Sem este ajuste, as sessões de nov/2026
-- ficariam fora da aba semanal e o ranking dos grupos e as estatísticas
-- apareceriam zerados. Move todas as sessões encerradas pelo mesmo número de
-- dias, de modo que a mais recente caia em ONTEM. Só as datas mudam: os minutos
-- continuam iguais, então as Consultas 01, 02 e 03 dão o mesmo resultado.
UPDATE Sessao_Estudo
   SET data_hora_inicio = data_hora_inicio + d.deslocamento,
       data_hora_fim    = data_hora_fim    + d.deslocamento
  FROM (SELECT ((NOW() AT TIME ZONE 'America/Sao_Paulo')::date - DATE '2026-11-22')
               * INTERVAL '1 day' AS deslocamento) AS d
 WHERE data_hora_fim IS NOT NULL;

-- =====================================================================
-- 6. GRUPOS DE ESTUDO E PARTICIPAÇÃO (4 grupos com 20 participações)
-- =====================================================================
INSERT INTO Grupo_Estudos (id_grupo, nome, descricao, data_criacao, status_ativo, codigo_convite) VALUES
(1, 'Maratona Banco de Dados',  'Listas SQL, modelagem e revisão para P2 de DEC7129', '2026-11-01', TRUE, 'GRPBD01'),
(2, 'Hardware e FPGA UFSC',     'Projetos em Verilog, Quartus Prime e MIPS Pipeline', '2026-11-04', TRUE, 'GRPHW02'),
(3, 'Algoritmos e Sistemas',    'Estruturas de dados em C++, SO e Redes',             '2026-11-07', TRUE, 'GRPAS03'),
(4, 'Monitoria Cálculo II',     'Resolução de listas de derivadas e integrais',       '2026-11-10', TRUE, 'GRPCA04');

SELECT setval(pg_get_serial_sequence('grupo_estudos', 'id_grupo'), 4);

INSERT INTO participa (fk_Usuario_id_usuario, fk_Grupo_Estudos_id_grupo, data_ingresso, papel_membro) VALUES
-- Grupo 1: Maratona Banco de Dados (o usuário 22 não tem sessões: aparece com 0 minutos)
(1,  1, '2026-11-01', 'Administrador'),
(2,  1, '2026-11-02', 'Membro'),
(3,  1, '2026-11-03', 'Membro'),
(5,  1, '2026-11-04', 'Membro'),
(7,  1, '2026-11-05', 'Membro'),
(22, 1, '2026-11-06', 'Membro'), -- caso de teste com 0 minutos estudados

-- Grupo 2: Hardware e FPGA UFSC
(11, 2, '2026-11-04', 'Administrador'),
(2,  2, '2026-11-04', 'Membro'),
(13, 2, '2026-11-05', 'Membro'),
(19, 2, '2026-11-06', 'Membro'),
(28, 2, '2026-11-08', 'Membro'),

-- Grupo 3: Algoritmos e Sistemas
(19, 3, '2026-11-07', 'Administrador'),
(1,  3, '2026-11-07', 'Membro'),
(3,  3, '2026-11-08', 'Membro'),
(12, 3, '2026-11-09', 'Membro'),
(25, 3, '2026-11-10', 'Membro'),

-- Grupo 4: Monitoria Cálculo II
(14, 4, '2026-11-10', 'Administrador'),
(16, 4, '2026-11-11', 'Membro'),
(24, 4, '2026-11-12', 'Membro'),
(29, 4, '2026-11-13', 'Membro');

-- =====================================================================
-- Consulta 01 --
-- =====================================================================
SELECT d.nome AS disciplina,
COUNT(s.id_sessao) AS sessoes,
ROUND(SUM(s.tempo_total_minutos) / 60.0, 1) AS horas_estudadas
FROM sessao_estudo s
JOIN atividade a ON a.id_atividade = s.fk_atividade_id_atividade
JOIN disciplina d ON d.id_disciplina = a.fk_disciplina_id_disciplina
WHERE s.data_hora_fim IS NOT NULL
GROUP BY d.id_disciplina, d.nome
ORDER BY horas_estudadas DESC, d.nome;


-- =====================================================================
-- Consulta 02 --
-- =====================================================================
SELECT g.nome AS grupo,
u.nome AS membro,
COALESCE(SUM(s.tempo_total_minutos), 0) AS minutos_estudados
FROM grupo_estudos g
JOIN participa p ON p.fk_grupo_estudos_id_grupo = g.id_grupo
JOIN usuario u ON u.id_usuario = p.fk_usuario_id_usuario
LEFT JOIN sessao_estudo s
ON s.fk_usuario_id_usuario = u.id_usuario
AND s.data_hora_fim IS NOT NULL
GROUP BY g.id_grupo, g.nome, u.id_usuario, u.nome
ORDER BY g.nome, minutos_estudados DESC, u.nome;


-- =====================================================================
-- Complemento de casos de teste para a Consulta 6.3 (sobre a carga de 8 disciplinas)
-- =====================================================================
INSERT INTO Atividade_Usuario (fk_Usuario_id_usuario, fk_Atividade_id_atividade, status_convite, status, prioridade, removida_em) VALUES
-- Casos ignorados pelos filtros (WHERE status_convite = 'Aceita' AND removida_em IS NULL)
(14, 4,  'Pendente', 'A Fazer',   'Média', NULL),                  -- Sistemas Digitais (Pendente)
(15, 7,  'Recusada', 'A Fazer',   'Baixa', NULL),                  -- Engenharia de Software (Recusada)
(22, 8,  'Aceita',   'Concluído', 'Alta',  '2026-11-21 09:30:00'), -- Estruturas de Dados (Removida logicamente)
(27, 10, 'Pendente', 'A Fazer',   'Média', NULL),                  -- Redes de Computadores (Pendente)
(2,  12, 'Recusada', 'A Fazer',   'Baixa', NULL),                  -- Arquitetura de Computadores (Recusada)

-- Registros válidos (Aceita + removida_em IS NULL) para enriquecer os percentuais das disciplinas
(9,  3,  'Aceita',   'Concluído', 'Alta',  NULL),                  -- Banco de Dados I
(14, 5,  'Aceita',   'Fazendo',   'Alta',  NULL),                  -- Sistemas Digitais
(23, 9,  'Aceita',   'Concluído', 'Média', NULL),                  -- Estruturas de Dados
(15, 11, 'Aceita',   'Concluído', 'Média', NULL),                  -- Redes de Computadores
(27, 11, 'Aceita',   'A Fazer',   'Baixa', NULL),                  -- Redes de Computadores
(29, 14, 'Aceita',   'Concluído', 'Alta',  NULL),                  -- Cálculo II
(21, 16, 'Aceita',   'Concluído', 'Alta',  NULL);                  -- Sistemas Operacionais

-- =====================================================================
-- Consulta 03 --
-- =====================================================================
SELECT d.nome AS disciplina,
COUNT(*) AS atividades_aceitas,
COUNT(*) FILTER (WHERE au.status = 'Concluído') AS concluidas,
ROUND(100.0 * COUNT(*) FILTER (WHERE au.status = 'Concluído')
/ COUNT(*), 1) AS percentual_concluido
FROM atividade_usuario au
JOIN atividade a ON a.id_atividade = au.fk_atividade_id_atividade
JOIN disciplina d ON d.id_disciplina = a.fk_disciplina_id_disciplina
WHERE au.status_convite = 'Aceita'
AND au.removida_em IS NULL
GROUP BY d.id_disciplina, d.nome
ORDER BY percentual_concluido DESC, d.nome;