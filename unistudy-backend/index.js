require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const gruposRouter = require("./grupos");
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
app.use(cors({
    origin: ['http://localhost:5173', 'https://blue-flower-03f9edf0f.7.azurestaticapps.net'], // Adicione aqui os links que podem acessar a API
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// MIDDLEWARES GERAIS
app.use(express.json()); // Permite ler arquivos .json
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

db.connect();

// CONFIGURAÇÃO DO UPLOAD DE ARQUIVOS (Multer)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde os arquivos vão ficar
    },
    filename: (req, file, cb) => {
        // Gera um nome único para o arquivo (data + nome original)
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage: storage });

//SEGURANÇA (Verificação de Token)
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN_AQUI"

    if (!token) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }

    try {
        const usuarioDecodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = usuarioDecodificado; // Pendura os dados na requisição
        next(); // Manda o Express seguir em frente
    } catch (error) {
        res.status(403).json({ erro: "Token inválido ou expirado." });
    }
}

// ROTAS PÚBLICAS (Não exigem Token)

// Rota de Health Check (Checagem de Saúde)
app.get("/", (req, res) => {
    res.json({ status: "API do UniStudy rodando perfeitamente!" });
});

// Cadastro de novos usuários
app.post("/cadastro", async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        const client = await db.connect();

        const usuarioExistente = await client.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (usuarioExistente.rows.length > 0) {
            client.release();
            return res.status(400).json({ erro: "Este e-mail já está em uso!" });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const novoUsuario = await client.query(
            "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
            [nome, email, senhaCriptografada]
        );

        client.release();
        res.status(201).json({ mensagem: "Usuário criado com sucesso!", usuario: novoUsuario.rows[0] });
    } catch (error) {
        console.error("Erro no cadastro:", error);
        res.status(500).json({ erro: "Erro interno no servidor" });
    }
});

// Login
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;
    try {
        const client = await db.connect();
        const resultado = await client.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        const usuario = resultado.rows[0];
        client.release();

        if (!usuario) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos" });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos" });
        }

        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ mensagem: "Login realizado com sucesso!", token: token });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ erro: "Erro interno no servidor" });
    }
});

// ROTAS PROTEGIDAS (exigem Token)

// --- GRUPOS DE ESTUDO ---
// Conecta o roteador de grupo
app.use("/grupos", verificarToken, gruposRouter);

// Painel de boas-vindas
app.get("/dados-painel", verificarToken, async (req, res) => {
    try {
        res.json({ 
            mensagem: `Bem-vinda de volta ao UniStudy, ${req.usuario.nome}!`,
            info: "Aqui ficarão as suas matérias e tarefas em breve."
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar dados do painel" });
    }
});

// --- MATÉRIAS ---
app.post("/materias", verificarToken, async (req, res) => {
    const { nome, professor, cor } = req.body;
    
    // Gera um código de 6 caracteres (letras e números)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) codigo += chars[Math.floor(Math.random() * chars.length)];

    try {
        const client = await db.connect();
        
        // 1. Cria a matéria com o código
        const novaMateria = await client.query(
            "INSERT INTO materias (usuario_id, nome, professor, cor, codigo_compartilhamento) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [req.usuario.id, nome, professor, cor, codigo]
        );
        const materiaId = novaMateria.rows[0].id;

        // 2. Inscreve você mesma na matéria
        await client.query(
            "INSERT INTO materia_inscricoes (usuario_id, materia_id) VALUES ($1, $2)",
            [req.usuario.id, materiaId]
        );

        client.release();
        res.status(201).json(novaMateria.rows[0]);
    } catch (error) {
        console.error("Erro ao criar matéria:", error);
        res.status(500).json({ erro: "Falha ao salvar a matéria." });
    }
});

app.get("/materias", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();
        const result = await client.query(`
            SELECT m.*, u.nome as criador_nome, 
            CASE WHEN m.usuario_id = $1 THEN true ELSE false END as is_criador
            FROM materias m
            JOIN materia_inscricoes mi ON m.id = mi.materia_id
            JOIN usuarios u ON m.usuario_id = u.id
            WHERE mi.usuario_id = $1
        `, [req.usuario.id]);
        client.release();
        res.json(result.rows);
    } catch (error) { console.error(error); res.status(500).json({ erro: "Erro." }); }
});

app.get("/materias/:id/membros", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();
        const result = await client.query(`
            SELECT u.id, u.nome FROM materia_inscricoes mi 
            JOIN usuarios u ON mi.usuario_id = u.id WHERE mi.materia_id = $1
        `, [req.params.id]);
        client.release();
        res.json(result.rows);
    } catch (error) { console.error(error); res.status(500).json({ erro: "Erro." }); }
});

app.post("/materias/entrar", verificarToken, async (req, res) => {
    const { codigo_compartilhamento } = req.body;
    try {
        const client = await db.connect();
        const mat = await client.query("SELECT * FROM materias WHERE codigo_compartilhamento = $1", [codigo_compartilhamento]);
        
        if (mat.rows.length === 0) {
            client.release(); return res.status(404).json({ erro: "Código inválido." });
        }
        const materia = mat.rows[0];

        if (materia.usuario_id === req.usuario.id) {
            client.release(); return res.status(400).json({ erro: "Você é o criador desta disciplina." });
        }

        const checkInscrito = await client.query("SELECT id FROM materia_inscricoes WHERE materia_id = $1 AND usuario_id = $2", [materia.id, req.usuario.id]);
        if (checkInscrito.rows.length > 0) {
            client.release(); return res.status(400).json({ erro: "Você já está na disciplina." });
        }

        // Cria a notificação para o CRIADOR autorizar
        await client.query(`
            INSERT INTO notificacoes (destinatario_id, remetente_id, materia_id, tipo_notificacao, status)
            VALUES ($1, $2, $3, 'inscricao', 'pendente')
        `, [materia.usuario_id, req.usuario.id, materia.id]);

        client.release();
        res.json({ mensagem: "Pedido de entrada enviado ao criador!" });
    } catch (error) { console.error(error); res.status(500).json({ erro: "Erro." }); }
});
app.delete("/materias/:id/sair", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();
        const mat = await client.query("SELECT usuario_id FROM materias WHERE id = $1", [req.params.id]);
        
        if (mat.rows.length > 0 && mat.rows[0].usuario_id === req.usuario.id) {
            client.release(); return res.status(400).json({ erro: "Criadores devem usar a opção Apagar Disciplina." });
        }
        
        await client.query("DELETE FROM materia_inscricoes WHERE materia_id = $1 AND usuario_id = $2", [req.params.id, req.usuario.id]);
        client.release();
        res.json({ mensagem: "Você saiu da disciplina." });
    } catch (error) { console.error(error); res.status(500).json({ erro: "Erro." }); }
});
// --- ROTA PARA EDITAR MATÉRIA ---
app.put("/materias/:id", verificarToken, async (req, res) => {
    const { id } = req.params; 
    const { nome, professor, cor } = req.body; 

    try {
        const client = await db.connect();
        
        const resultado = await client.query(
            "UPDATE materias SET nome = $1, professor = $2, cor = $3 WHERE id = $4 AND usuario_id = $5 RETURNING *",
            [nome, professor, cor, id, req.usuario.id]
        );
        
        client.release();

        if (resultado.rowCount === 0) {
            return res.status(404).json({ erro: "Matéria não encontrada ou acesso negado." });
        }

        res.json({ 
            mensagem: "Disciplina atualizada com sucesso!", 
            materia: resultado.rows[0] 
        });
    } catch (error) {
        console.error("Erro ao editar matéria:", error);
        res.status(500).json({ erro: "Falha ao editar a disciplina." });
    }
});

// --- TAREFAS / KANBAN ---
app.post("/tarefas", verificarToken, upload.single('arquivo'), async (req, res) => {
    const { materia_id, titulo, data_entrega, prioridade, descricao, tipo, conteudos } = req.body;
    
    const nome_arquivo = req.file ? req.file.originalname : null;
    const caminho_arquivo = req.file ? req.file.path : null;
    const tipo_arquivo = req.file ? req.file.mimetype : null; 

    try {
        const client = await db.connect();
        
        // 1. NOVA VERIFICAÇÃO DE SEGURANÇA: Olha para as INSCRIÇÕES, e não para o dono
        const check = await client.query(
            "SELECT id FROM materia_inscricoes WHERE materia_id = $1 AND usuario_id = $2", 
            [materia_id, req.usuario.id]
        );
        
        if (check.rows.length === 0) {
            client.release();
            return res.status(403).json({ erro: "Acesso negado à matéria." });
        }

        // 2. INSERÇÃO: Adicionando o usuario_id na tabela tarefas
        const novaTarefa = await client.query(
            `INSERT INTO tarefas 
                (materia_id, usuario_id, titulo, data_entrega, status, prioridade, descricao, tipo, conteudos, nome_arquivo, caminho_arquivo) 
             VALUES 
                ($1, $2, $3, $4, 'pendente', $5, $6, $7, $8, $9, $10) 
             RETURNING *`,
            [
                materia_id, 
                req.usuario.id, 
                titulo, 
                data_entrega || null, 
                prioridade || 'media', 
                descricao || '', 
                tipo || 'tarefa', 
                tipo === 'prova' ? (conteudos || descricao) : null,
                nome_arquivo,
                caminho_arquivo
            ]
        );
        
        // Biblioteca Digital
        if (caminho_arquivo) {
            await client.query(
                `INSERT INTO materiais (usuario_id, materia_id, titulo, nome_arquivo, caminho_arquivo, tipo_arquivo) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    req.usuario.id, 
                    materia_id, 
                    `Anexo: ${titulo}`, 
                    nome_arquivo, 
                    caminho_arquivo, 
                    tipo_arquivo
                ]
            );
        }

        // 3. O GATILHO DAS NOTIFICAÇÕES
        const tarefaId = novaTarefa.rows[0].id;
        
        const membros = await client.query(
            "SELECT usuario_id FROM materia_inscricoes WHERE materia_id = $1 AND usuario_id != $2",
            [materia_id, req.usuario.id]
        );

        if (membros.rows.length > 0) {
            const values = membros.rows.map(m => `(${m.usuario_id}, ${req.usuario.id}, ${tarefaId}, 'pendente')`).join(',');
            
            await client.query(`
                INSERT INTO notificacoes (destinatario_id, remetente_id, tarefa_origem_id, status)
                VALUES ${values}
            `);
        }

        client.release();
        res.status(201).json(novaTarefa.rows[0]);
    } catch (error) {
        console.error("Erro ao criar tarefa:", error);
        res.status(500).json({ erro: "Erro ao criar tarefa." });
    }
});

app.get("/tarefas", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();
        const tarefas = await client.query(`
            SELECT t.*, m.nome as materia_nome, m.cor as materia_cor
            FROM tarefas t
            JOIN materias m ON t.materia_id = m.id
            WHERE t.usuario_id = $1
        `, [req.usuario.id]);
        client.release();
        res.json(tarefas.rows);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao carregar o Kanban." });
    }
});

// --- ROTA PARA ARQUIVAR TAREFAS CONCLUÍDAS ---
app.put("/tarefas/arquivar-concluidas", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();
        await client.query(`
            UPDATE tarefas SET status = 'arquivada' 
            WHERE status = 'concluida' 
            AND materia_id IN (SELECT id FROM materias WHERE usuario_id = $1)
        `, [req.usuario.id]);
        client.release();
        res.json({ mensagem: "Tarefas arquivadas e ocultadas do quadro!" });
    } catch (error) {
        console.error("Erro ao arquivar:", error);
        res.status(500).json({ erro: "Erro ao arquivar tarefas." });
    }
});

// --- ROTA PARA ATUALIZAR STATUS ---
app.put("/tarefas/:id/status", verificarToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const client = await db.connect();
        await client.query("UPDATE tarefas SET status = $1 WHERE id = $2", [status, id]);
        client.release();
        res.json({ mensagem: "Status atualizado!" });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao mover tarefa." });
    }
});

// --- ROTA PARA EDITAR TAREFA ---
app.put("/tarefas/:id", verificarToken, async (req, res) => {
    const { id } = req.params;
    const { titulo, data_entrega, descricao, tipo } = req.body;
    try {
        const client = await db.connect();
        
        // Segurança: Verifica se a tarefa pertence a uma matéria do usuário logado
        const check = await client.query(`
            SELECT t.id FROM tarefas t
            JOIN materias m ON t.materia_id = m.id
            WHERE t.id = $1 AND m.usuario_id = $2
        `, [id, req.usuario.id]);

        if (check.rowCount === 0) {
            client.release();
            return res.status(403).json({ erro: "Acesso negado à tarefa." });
        }

        await client.query(
            "UPDATE tarefas SET titulo = $1, data_entrega = $2, descricao = $3, tipo = $4 WHERE id = $5",
            [titulo, data_entrega, descricao, tipo, id]
        );
        client.release();
        res.json({ mensagem: "Tarefa atualizada com sucesso!" });
    } catch (error) {
        console.error("Erro ao editar tarefa:", error);
        res.status(500).json({ erro: "Erro ao atualizar tarefa." });
    }
});

// --- ROTA PARA DELETAR MATÉRIA (COM CASCATA) ---
app.delete("/materias/:id", verificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        const client = await db.connect();
        
        // 1. Verifica se a matéria existe e pertence ao usuario logado
        const check = await client.query("SELECT id FROM materias WHERE id = $1 AND usuario_id = $2", [id, req.usuario.id]);
        if (check.rowCount === 0) {
            client.release();
            return res.status(404).json({ erro: "Matéria não encontrada ou acesso negado." });
        }

        // 2. Limpeza em cascata (Evita o bloqueio do PostgreSQL)
        // Apaga as sessões do cronômetro ligadas às tarefas desta matéria
        await client.query("DELETE FROM sessoes_estudo WHERE tarefa_id IN (SELECT id FROM tarefas WHERE materia_id = $1)", [id]);
        
        // Apaga os PDFs e arquivos da biblioteca desta matéria
        await client.query("DELETE FROM materiais WHERE materia_id = $1", [id]);
        
        // Apaga as tarefas em si
        await client.query("DELETE FROM tarefas WHERE materia_id = $1", [id]);
        
        // 3. Finalmente, apaga a matéria limpa
        await client.query("DELETE FROM materias WHERE id = $1", [id]);
        
        client.release();
        res.json({ mensagem: "Matéria e todos os seus vínculos foram deletados com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar matéria:", error);
        res.status(500).json({ erro: "Falha ao deletar matéria." });
    }
});

// --- ROTA PARA DELETAR TAREFA (COM CASCATA) ---
app.delete("/tarefas/:id", verificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        const client = await db.connect();
        
        const check = await client.query(`
            SELECT t.id FROM tarefas t
            JOIN materias m ON t.materia_id = m.id
            WHERE t.id = $1 AND m.usuario_id = $2
        `, [id, req.usuario.id]);

        if (check.rowCount === 0) {
            client.release();
            return res.status(403).json({ erro: "Acesso negado à tarefa." });
        }

        // Limpa o cronômetro antes de apagar a tarefa
        await client.query("DELETE FROM sessoes_estudo WHERE tarefa_id = $1", [id]);
        await client.query("DELETE FROM tarefas WHERE id = $1", [id]);
        
        client.release();
        res.json({ mensagem: "Tarefa deletada com sucesso!" });
    } catch (error) {
        console.error("Erro ao deletar tarefa:", error);
        res.status(500).json({ erro: "Erro ao deletar tarefa." });
    }
});
// --- ROTA PARA EXCLUIR MATERIAL (Apenas para o usuário logado) ---
app.delete("/materiais/:id", verificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        const client = await db.connect();

        // Tenta deletar a linha que pertence EXATAMENTE ao usuário logado
        const result = await client.query(
            "DELETE FROM materiais WHERE id = $1 AND usuario_id = $2 RETURNING id", 
            [id, req.usuario.id]
        );

        if (result.rowCount === 0) {
            client.release();
            return res.status(404).json({ erro: "Material não encontrado ou você não tem permissão." });
        }

        client.release();
        res.json({ mensagem: "Material removido da sua biblioteca." });
    } catch (error) {
        console.error("Erro ao excluir material:", error);
        res.status(500).json({ erro: "Erro ao excluir material." });
    }
});

// --- ROTA PARA ARQUIVAR TAREFAS CONCLUÍDAS ---
app.put("/tarefas/arquivar-concluidas", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();
        // Muda o status de 'concluida' para 'arquivada' para sumir do Kanban
        await client.query(`
            UPDATE tarefas SET status = 'arquivada' 
            WHERE status = 'concluida' 
            AND materia_id IN (SELECT id FROM materias WHERE usuario_id = $1)
        `, [req.usuario.id]);
        client.release();
        res.json({ mensagem: "Tarefas arquivadas e ocultadas do quadro!" });
    } catch (error) {
        console.error("Erro ao arquivar:", error);
        res.status(500).json({ erro: "Erro ao arquivar tarefas." });
    }
});

// --- BIBLIOTECA DIGITAL / MATERIAIS ---
app.post("/materiais/upload", verificarToken, upload.single('arquivo'), async (req, res) => {
    const { materia_id, titulo } = req.body;
    const arquivo = req.file;

    if (!arquivo) {
        return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }

    try {
        const client = await db.connect();
        const novoMaterial = await client.query(
            "INSERT INTO materiais (usuario_id, materia_id, titulo, nome_arquivo, caminho_arquivo, tipo_arquivo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [req.usuario.id, materia_id, titulo, arquivo.filename, arquivo.path, arquivo.mimetype]
        );

        const materialId = novoMaterial.rows[0].id;
        const membros = await client.query(
            "SELECT usuario_id FROM materia_inscricoes WHERE materia_id = $1 AND usuario_id != $2",
            [materia_id, req.usuario.id]
        );

        if (membros.rows.length > 0) {
            const values = membros.rows.map(m => `(${m.usuario_id}, ${req.usuario.id}, ${materialId}, 'material', 'pendente')`).join(',');
            await client.query(`
                INSERT INTO notificacoes (destinatario_id, remetente_id, material_origem_id, tipo_notificacao, status)
                VALUES ${values}
            `);
        }

        client.release();
        res.status(201).json(novoMaterial.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: "Erro ao salvar material no banco." });
    }
});

app.get("/materiais", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();
        const resultado = await client.query(`
            SELECT mat.*, m.nome as materia_nome 
            FROM materiais mat
            JOIN materias m ON mat.materia_id = m.id
            WHERE mat.usuario_id = $1
            ORDER BY mat.data_upload DESC
        `, [req.usuario.id]);
        client.release();
        res.json(resultado.rows);
    } catch (error) {
        console.error("Erro ao buscar biblioteca:", error);
        res.status(500).json({ erro: "Erro ao buscar biblioteca." });
    }
});

// --- ROTA PARA SALVAR SESSÃO DE ESTUDO ---
app.post("/sessoes-estudo", verificarToken, async (req, res) => {
    const { tarefa_id, duracao_segundos } = req.body;
    try {
        const client = await db.connect();
        const novaSessao = await client.query(
            "INSERT INTO sessoes_estudo (tarefa_id, usuario_id, duracao_segundos) VALUES ($1, $2, $3) RETURNING *",
            [tarefa_id, req.usuario.id, duracao_segundos]
        );
        client.release();
        res.status(201).json(novaSessao.rows[0]);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao salvar sessão de estudo." });
    }
});


app.put('/usuarios/status-estudo', verificarToken, async (req, res) => {
  const { esta_estudando } = req.body;
  const usuario_id = req.usuario.id; 

  try {
    const client = await db.connect();
    await client.query(
      'UPDATE usuarios SET esta_estudando = $1 WHERE id = $2',
      [esta_estudando, usuario_id]
    );
    client.release();
    res.json({ sucesso: true });
  } catch (erro) {
    console.error("Erro ao atualizar status:", erro);
    res.status(500).json({ erro: 'Erro ao atualizar o status de estudo.' });
  }
});

// --- ESTATÍSTICAS / ANALYTICS ---
// ROTA DE ESTATÍSTICAS 
app.get("/estatisticas", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();
        const usuarioId = req.usuario.id;

        // 1. KPIs Gerais (Baseado nas suas tarefas reais)
        const kpis = await client.query(`
            SELECT 
                COUNT(id) as total_tarefas,
                COUNT(CASE WHEN status = 'concluida' THEN 1 END) as tarefas_concluidas
            FROM tarefas WHERE usuario_id = $1
        `, [usuarioId]);

        // 2. Tempo por Disciplina (Lê as horas salvas pelo seu SmartTimer!)
        let disciplinasReais = [];
        const disc = await client.query(`
            SELECT m.nome, m.cor, SUM(s.duracao_segundos) as total_segs
            FROM sessoes_estudo s
            JOIN tarefas t ON s.tarefa_id = t.id
            JOIN materias m ON t.materia_id = m.id
            WHERE t.usuario_id = $1
            GROUP BY m.nome, m.cor
            HAVING SUM(s.duracao_segundos) > 0
        `, [usuarioId]);
        
        disciplinasReais = disc.rows.map(d => ({
            nome: d.nome,
            cor: d.cor || '#7c3aed',
            horas: parseFloat((d.total_segs / 3600).toFixed(1))
        }));

        const horasTotais = disciplinasReais.reduce((acc, curr) => acc + curr.horas, 0);

        // 3. Volume de Entregas (Lê as tarefas dos últimos 7 dias reais)
        const entregas = await client.query(`
            SELECT 
                EXTRACT(DOW FROM data_entrega) as dia_semana,
                COUNT(id) as criadas,
                COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas
            FROM tarefas 
            WHERE usuario_id = $1 
              AND data_entrega >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY EXTRACT(DOW FROM data_entrega)
        `, [usuarioId]);

        const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const entregasReais = entregas.rows.map(e => ({
            dia: diasNomes[parseInt(e.dia_semana)],
            criadas: parseInt(e.criadas),
            concluidas: parseInt(e.concluidas)
        }));

        client.release();

        // DEVOLVE APENAS A REALIDADE PARA O FRONTEND
        res.json({
            horasTotais: horasTotais,
            comparacaoHoras: '',
            tarefasConcluidas: parseInt(kpis.rows[0].tarefas_concluidas || 0),
            tarefasTotal: parseInt(kpis.rows[0].total_tarefas || 0),
            streak: 0, 
            disciplinas: disciplinasReais,
            entregas: entregasReais,
            heatmap: null // Mantemos nulo até implementarmos a matriz real de 365 dias
        });

    } catch (error) {
        console.error("Erro ao gerar estatísticas:", error);
        res.status(500).json({ erro: "Erro ao gerar analytics." });
    }
});
//NOTIFICACOES

// --- ROTA PARA BUSCAR NOTIFICAÇÕES ---
app.get("/notificacoes", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();
        const result = await client.query(`
            SELECT n.id, u.nome as autor, 
                COALESCE(t.titulo, mat.titulo, n.titulo_tarefa) as tarefa, 
                m.nome as disciplina, 
                n.criado_em as tempo,
                n.tipo_notificacao
            FROM notificacoes n
            JOIN usuarios u ON n.remetente_id = u.id
            LEFT JOIN tarefas t ON n.tarefa_origem_id = t.id
            LEFT JOIN materiais mat ON n.material_origem_id = mat.id
            LEFT JOIN materias m ON m.id = COALESCE(t.materia_id, mat.materia_id, n.materia_id)
            WHERE n.destinatario_id = $1 AND n.status = 'pendente'
            ORDER BY n.criado_em DESC
        `, [req.usuario.id]);
        client.release();
        res.json(result.rows);
    } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        res.status(500).json({ erro: "Erro ao buscar notificações." });
    }
});
// --- ROTA PARA ACEITAR/RECUSAR TAREFA ---
app.post("/notificacoes/:id/responder", verificarToken, async (req, res) => {
    const { id } = req.params;
    const { aceitar } = req.body; 

    try {
        const client = await db.connect();
        const notif = await client.query("SELECT tarefa_origem_id, material_origem_id, tipo_notificacao, remetente_id, materia_id FROM notificacoes WHERE id = $1", [id]);

        if (notif.rows.length === 0) {
            client.release(); return res.status(404).json({ erro: "Aviso já respondido." });
        }

        if (!aceitar) {
            await client.query("UPDATE notificacoes SET status = 'recusada' WHERE id = $1", [id]);
            client.release(); return res.json({ mensagem: "Item recusado." });
        }

        const { tarefa_origem_id, material_origem_id, tipo_notificacao, remetente_id, materia_id } = notif.rows[0];

        // Aprovar a entrada do aluno
        if (tipo_notificacao === 'inscricao') {
            await client.query("INSERT INTO materia_inscricoes (usuario_id, materia_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [remetente_id, materia_id]);
        }

        // Se for um Material (Arquivo)
        else if (tipo_notificacao === 'material') {
            const matOriginal = await client.query("SELECT * FROM materiais WHERE id = $1", [material_origem_id]);
            if (matOriginal.rows.length > 0) {
                const m = matOriginal.rows[0];
                await client.query(`
                    INSERT INTO materiais (usuario_id, materia_id, titulo, nome_arquivo, caminho_arquivo, tipo_arquivo)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [req.usuario.id, m.materia_id, m.titulo, m.nome_arquivo, m.caminho_arquivo, m.tipo_arquivo]);
            }
        } 
        // Se for uma Tarefa
        else if (tipo_notificacao === 'tarefa') {
            const tarOriginal = await client.query("SELECT * FROM tarefas WHERE id = $1", [tarefa_origem_id]);
            if (tarOriginal.rows.length > 0) {
                const t = tarOriginal.rows[0];
                await client.query(`
                    INSERT INTO tarefas (materia_id, usuario_id, titulo, data_entrega, status, prioridade, descricao, tipo, conteudos, nome_arquivo, caminho_arquivo)
                    VALUES ($1, $2, $3, $4, 'pendente', $5, $6, $7, $8, $9, $10)
                `, [t.materia_id, req.usuario.id, t.titulo, t.data_entrega, t.prioridade, t.descricao, t.tipo, t.conteudos, t.nome_arquivo, t.caminho_arquivo]);
            }
        }

        await client.query("UPDATE notificacoes SET status = 'aceita' WHERE id = $1", [id]);
        client.release();
        res.json({ mensagem: "Adicionado com sucesso ao seu painel!" });
    } catch (error) {
        console.error("ERRO GRAVE:", error);
        res.status(500).json({ erro: "Erro ao processar." });
    }
});
//INICIALIZAÇÃO DO SERVIDOR
app.listen(port, () => {
    console.log(` Backend rodando na porta ${port}`);
});