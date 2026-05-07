// 1. IMPORTAÇÕES E CONFIGURAÇÕES INICIAIS
require("dotenv").config(); // DEVE ser a primeira linha
const express = require("express");
const cors = require("cors");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

// 2. MIDDLEWARES GERAIS
app.use(cors());
app.use(express.json()); // Permite ler arquivos .json
app.use('/uploads', express.static('uploads')); // Torna a pasta uploads acessível para o navegador

// Inicializa a conexão com o banco de dados
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

// 4. MIDDLEWARE DE SEGURANÇA (Verificação de Token)
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

// ==========================================
// 5. ROTAS PÚBLICAS (Não exigem Token)
// ==========================================

// Rota de Health Check (Checagem de Saúde)
app.get("/", (req, res) => {
    res.json({ status: "🚀 API do StudyX rodando perfeitamente!" });
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

// ==========================================
// 6. ROTAS PROTEGIDAS (Exigem Token Válido)
// ==========================================

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
    const { id } = req.params; // Pega o ID da matéria que está na URL
    const { nome, professor, cor } = req.body; // Pega os novos dados digitados

    try {
        const client = await db.connect();
        
        // O "AND usuario_id = $5" é a sua trava de segurança!
        const resultado = await client.query(
            "UPDATE materias SET nome = $1, professor = $2, cor = $3 WHERE id = $4 AND usuario_id = $5 RETURNING *",
            [nome, professor, cor, id, req.usuario.id]
        );
        
        client.release();

        // Se rowCount for 0, significa que a matéria não existe ou é de outro usuário
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
app.post("/tarefas", verificarToken, async (req, res) => {
    const { materia_id, titulo, data_entrega, prioridade, descricao, tipo, conteudos } = req.body;
    try {
        const client = await db.connect();
        
        const check = await client.query("SELECT id FROM materias WHERE id = $1 AND usuario_id = $2", [materia_id, req.usuario.id]);
        if (check.rows.length === 0) {
            client.release();
            return res.status(403).json({ erro: "Acesso negado à matéria." });
        }

        const novaTarefa = await client.query(
            "INSERT INTO tarefas (materia_id, titulo, data_entrega, status, prioridade, descricao, tipo, conteudos) VALUES ($1, $2, $3, 'pendente', $4, $5, $6, $7) RETURNING *",
            [materia_id, titulo, data_entrega, prioridade, descricao, tipo, conteudos]
        );
        client.release();
        res.status(201).json(novaTarefa.rows[0]);
    } catch (error) {
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

// Rota de Teste (Usuários) - Útil para dev, mas considere apagar quando for lançar o app oficial
app.get("/usuarios", async (req, res) => {
    try {
        const client = await db.connect(); 
        const resultado = await client.query("SELECT * FROM usuarios");
        res.json(resultado.rows);
        client.release();
    } catch (error) {
        console.error("Deu ruim na busca:", error);
        res.status(500).json({ erro: "Falha ao buscar os usuários no banco" });
    }
});

// ==========================================
// 7. INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(port, () => {
    console.log(`🚀 Backend rodando na porta ${port}`);
});