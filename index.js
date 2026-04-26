// O dotenv DEVE ser carregado antes de qualquer outra coisa
require("dotenv").config();

const express = require("express");
const db = require("./db"); // Importa o arquivo db.js

const bcrypt = require("bcrypt");//biblioteca de criptografia
const jwt = require("jsonwebtoken"); //biblioteca de token

const app = express();
const port = process.env.PORT || 3000;

//bibliotecas para os arquivos
const multer = require("multer");
const path = require("path");
const fs = require("fs");

app.use(express.static('public')); //ler a pasta public

app.use(express.json());//ler os qrquivos .json

// Inicializa a conexão com o banco de dados
db.connect();

// Configuração de onde e como os arquivos serão salvos
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

// Torna a pasta uploads acessível para o navegador
app.use('/uploads', express.static('uploads'));

// --- ROTA DE UPLOAD DE MATERIAL ---
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

// --- ROTA PARA LISTAR MATERIAIS ---
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

// Middleware para verificar o Token JWT
function verificarToken(req, res, next) {
    // Procura o token no cabeçalho de autorização da requisição
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN_AQUI"

    if (!token) {
        return res.status(401).json({ erro: "Acesso negado. Token não fornecido." });
    }

    try {
        // Verifica se o token é válido e não expirou usando o seu segredo
        const usuarioDecodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Pendura os dados do usuário na requisição para a rota poder usar
        req.usuario = usuarioDecodificado; 
        
        // Manda o Express seguir em frente para a rota que o usuário tentou acessar
        next(); 
    } catch (error) {
        res.status(403).json({ erro: "Token inválido ou expirado." });
    }
}


app.get("/", (req, res) => {
    res.json({
        message: "Funcionando!"
    });
}); // Caminho e função de callback

// Rota para testar a busca de usuários no banco de dados
app.get("/usuarios", async (req, res) => {
    try {
        // Pega a conexão com o banco
        const client = await db.connect(); 
        
        // Executa a busca na tabela usuarios
        const resultado = await client.query("SELECT * FROM usuarios");
        
        // Devolve o resultado em formato JSON para a tela
        res.json(resultado.rows);
        
        // Libera a conexão de volta pro pool
        client.release();
    } catch (error) {
        console.error("Deu ruim na busca:", error);
        res.status(500).json({ erro: "Falha ao buscar os usuários no banco" });
    }
});

app.post("/cadastro", async (req, res) => {
    //Pega os dados que o usuário enviou (vamos enviar isso pelo HTML depois)
    const { nome, email, senha } = req.body;

    try {
        const client = await db.connect();

        //Verifica se o e-mail já existe no banco
        const usuarioExistente = await client.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (usuarioExistente.rows.length > 0) {
            client.release();
            return res.status(400).json({ erro: "Este e-mail já está em uso!" });
        }

        // Criptografa a senha (o '10' é o nível de complexidade do embaralhamento)
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        //Salva no banco com a senha protegida
        const novoUsuario = await client.query(
            "INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email",
            [nome, email, senhaCriptografada]
        );

        client.release();
        
        // Devolve os dados do usuário recém-criado (sem a senha!)
        res.status(201).json({ mensagem: "Usuário criado com sucesso!", usuario: novoUsuario.rows[0] });

    } catch (error) {
        console.error("Erro no cadastro:", error);
        res.status(500).json({ erro: "Erro interno no servidor" });
    }
});

app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    try {
        const client = await db.connect();

        //Busca o usuário pelo e-mail
        const resultado = await client.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        const usuario = resultado.rows[0];

        client.release();

        //Se o usuário não existir, barra o acesso
        if (!usuario) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos" });
        }

        //Compara a senha digitada com a senha criptografada do banco
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos" });
        }

        //Cria o Token JWT (o "crachá" válido por 1 hora)
        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome }, // Dados guardados no crachá
            process.env.JWT_SECRET,                 // A assinatura secreta
            { expiresIn: "1h" }                     // Validade
        );

        //Entrega o token para o frontend
        res.json({ 
            mensagem: "Login realizado com sucesso!", 
            token: token 
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ erro: "Erro interno no servidor" });
    }
});

app.listen(port, () => {
    console.log(`Backend rodando na porta ${port}`);
});

// Rota PROTEGIDA: só acessa quem tem o token válido
app.get("/dados-painel", verificarToken, async (req, res) => {
    try {
        // Como o middleware deixou passar, sabemos quem é o usuário através do req.usuario
        const userId = req.usuario.id;

        // Vamos mandar uma mensagem personalizada usando o nome que estava dentro do token
        res.json({ 
            mensagem: `Bem-vinda de volta ao StudyX, ${req.usuario.nome}!`,
            info: "Aqui ficarão as suas matérias e tarefas em breve."
        });
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar dados do painel" });
    }
});

// --- ROTAS DE MATÉRIAS ---
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

// --- ROTAS DE TAREFAS (KANBAN) ---
app.post("/tarefas", verificarToken, async (req, res) => {
    // Recebe todos os novos campos do Frontend
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
        // Agora trazemos também a COR da matéria no JOIN!
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