require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const gruposRouter = require("./grupos");

const app = express();
const port = process.env.PORT || 3000;
app.use(cors({
    origin: ['http://localhost:5173', 'https://o-link-do-seu-frontend-na-vercel.com'], // Adicione aqui os links que podem acessar a API
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// 2. MIDDLEWARES GERAIS
app.use(express.json()); // Permite ler arquivos .json
app.use('/uploads', express.static('uploads')); // Torna a pasta uploads acessível para o navegador

db.connect();

// 3. CONFIGURAÇÃO DO UPLOAD DE ARQUIVOS (Multer)
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

// MIDDLEWARE DE SEGURANÇA (Verificação de Token)
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN_AQUI"

    if (!token) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }

    try {
        // CORRIGIDO: Adicionado o jwt.
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
    res.json({ status: "API do StudyX rodando perfeitamente!" });
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

        // CORRIGIDO: Adicionado o bcrypt.
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

        // CORRIGIDO: Adicionado o bcrypt.
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos" });
        }

        // CORRIGIDO: Adicionado o jwt.
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
            mensagem: `Bem-vinda de volta ao StudyX, ${req.usuario.nome}!`,
            info: "Aqui ficarão as suas matérias e tarefas em breve."
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar dados do painel" });
    }
});

// --- MATÉRIAS ---
app.post("/materias", verificarToken, async (req, res) => {
    const { nome, professor, cor } = req.body;
    try {
        const client = await db.connect();
        const novaMateria = await client.query(
            "INSERT INTO materias (usuario_id, nome, professor, cor) VALUES ($1, $2, $3, $4) RETURNING *",
            [req.usuario.id, nome, professor, cor]
        );
        client.release();
        res.status(201).json(novaMateria.rows[0]);
    } catch (error) {
        res.status(500).json({ erro: "Falha ao salvar a matéria." });
    }
});

app.get("/materias", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();
        const materias = await client.query("SELECT * FROM materias WHERE usuario_id = $1", [req.usuario.id]);
        client.release();
        res.json(materias.rows);
    } catch (error) {
        res.status(500).json({ erro: "Falha ao carregar as matérias." });
    }
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
    
    // Se o usuário enviou um arquivo, pegamos os dados do multer, senão fica null
    const nome_arquivo = req.file ? req.file.originalname : null;
    const caminho_arquivo = req.file ? req.file.path : null;

    try {
        const client = await db.connect();
        
        // Verificação de segurança da matéria
        const check = await client.query("SELECT id FROM materias WHERE id = $1 AND usuario_id = $2", [materia_id, req.usuario.id]);
        if (check.rows.length === 0) {
            client.release();
            return res.status(403).json({ erro: "Acesso negado à matéria." });
        }

        const novaTarefa = await client.query(
            `INSERT INTO tarefas 
                (materia_id, titulo, data_entrega, status, prioridade, descricao, tipo, conteudos, nome_arquivo, caminho_arquivo) 
             VALUES 
                ($1, $2, $3, 'pendente', $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [
                materia_id, 
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
            WHERE m.usuario_id = $1
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
        res.status(500).json({ erro: "Erro ao buscar biblioteca." });
    }
});

// --- ROTA PARA SALVAR SESSÃO DE ESTUDO ---
app.post("/sessoes-estudo", verificarToken, async (req, res) => {
    const { tarefa_id, duracao_segundos } = req.body;
    try {
        // CORRIGIDO: Retirado o .db duplicado
        const client = await db.connect();
        const novaSessao = await client.query(
            "INSERT INTO sessoes_estudo (tarefa_id, duracao_segundos) VALUES ($1, $2) RETURNING *",
            [tarefa_id, duracao_segundos]
        );
        client.release();
        res.status(201).json(novaSessao.rows[0]);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao salvar sessão de estudo." });
    }
});




// --- ESTATÍSTICAS / ANALYTICS ---
app.get("/estatisticas", verificarToken, async (req, res) => {
    try {
        const client = await db.connect();

        // 1. Soma o tempo gasto em cada Matéria (Para o Gráfico de Barras)
        const tempoPorMateria = await client.query(`
            SELECT 
                m.nome as materia, 
                m.cor, 
                SUM(s.duracao_segundos) as total_segundos
            FROM sessoes_estudo s
            JOIN tarefas t ON s.tarefa_id = t.id
            JOIN materias m ON t.materia_id = m.id
            WHERE m.usuario_id = $1
            GROUP BY m.nome, m.cor
        `, [req.usuario.id]);

        // 2. Soma o tempo gasto por Tipo: Prova vs Tarefa (Para o Gráfico de Pizza)
        const tempoPorTipo = await client.query(`
            SELECT 
                t.tipo, 
                SUM(s.duracao_segundos) as total_segundos
            FROM sessoes_estudo s
            JOIN tarefas t ON s.tarefa_id = t.id
            JOIN materias m ON t.materia_id = m.id
            WHERE m.usuario_id = $1
            GROUP BY t.tipo
        `, [req.usuario.id]);

        client.release();

        // Envia as duas respostas juntas para o Frontend
        res.json({
            porMateria: tempoPorMateria.rows,
            porTipo: tempoPorTipo.rows
        });

    } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        res.status(500).json({ erro: "Erro ao calcular o tempo de estudo." });
    }
});

//INICIALIZAÇÃO DO SERVIDOR
app.listen(port, () => {
    console.log(` Backend rodando na porta ${port}`);
});