const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./db');

function gerarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 6; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)];
  }
  return codigo;
}

// POST /grupos — criar grupo
router.post('/', async (req, res) => {
  const { nome, descricao, senha } = req.body;
  const criador_id = req.usuario.id;
  if (!nome || !senha) {
    return res.status(400).json({ erro: 'Nome e senha são obrigatórios.' });
  }
  try {
    const senha_hash = await bcrypt.hash(senha, 10);
    const codigo_convite = gerarCodigo();
    const result = await db.query(
      `INSERT INTO grupos (nome, descricao, senha_hash, codigo_convite, criador_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, codigo_convite`,
      [nome, descricao, senha_hash, codigo_convite, criador_id]
    );
    const grupo = result.rows[0];
    await db.query(
      `INSERT INTO grupo_membros (grupo_id, usuario_id, papel)
       VALUES ($1, $2, 'criador')`,
      [grupo.id, criador_id]
    );
    res.status(201).json(grupo);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao criar grupo.' });
  }
});

// POST /grupos/entrar — entrar com código e senha
router.post('/entrar', async (req, res) => {
  const { codigo_convite, senha } = req.body;
  const usuario_id = req.usuario.id;
  if (!codigo_convite || !senha) {
    return res.status(400).json({ erro: 'Código e senha são obrigatórios.' });
  }
  try {
    const result = await db.query(
      'SELECT * FROM grupos WHERE codigo_convite = $1',
      [codigo_convite.toUpperCase()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Grupo não encontrado.' });
    }
    const grupo = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, grupo.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }
    const jaMembro = await db.query(
      'SELECT id FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2',
      [grupo.id, usuario_id]
    );
    if (jaMembro.rows.length > 0) {
      return res.status(400).json({ erro: 'Você já é membro deste grupo.' });
    }
    await db.query(
      `INSERT INTO grupo_membros (grupo_id, usuario_id, papel)
       VALUES ($1, $2, 'membro')`,
      [grupo.id, usuario_id]
    );
    res.json({ mensagem: 'Entrou no grupo com sucesso!', grupo_id: grupo.id, nome: grupo.nome });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao entrar no grupo.' });
  }
});

// GET /grupos/meus — listar grupos do usuário logado
router.get('/meus', async (req, res) => {
  const usuario_id = req.usuario.id;
  try {
    const result = await db.query(
      `SELECT g.id, g.nome, g.descricao, g.codigo_convite, gm.papel,
              (SELECT COUNT(*) FROM grupo_membros WHERE grupo_id = g.id) AS total_membros
       FROM grupos g
       JOIN grupo_membros gm ON gm.grupo_id = g.id
       WHERE gm.usuario_id = $1
       ORDER BY g.criado_em DESC`,
      [usuario_id]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar grupos.' });
  }
});

// GET /grupos/:id — detalhes do grupo
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.usuario.id;
  try {
    const membro = await db.query(
      'SELECT papel FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2',
      [id, usuario_id]
    );
    if (membro.rows.length === 0) {
      return res.status(403).json({ erro: 'Você não é membro deste grupo.' });
    }
    const grupo = await db.query('SELECT * FROM grupos WHERE id = $1', [id]);
    const membros = await db.query(
      `SELECT u.id, u.nome, gm.papel, gm.entrou_em
       FROM grupo_membros gm
       JOIN usuarios u ON u.id = gm.usuario_id
       WHERE gm.grupo_id = $1
       ORDER BY gm.entrou_em ASC`,
      [id]
    );
    res.json({ ...grupo.rows[0], membros: membros.rows });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar grupo.' });
  }
});

// DELETE /grupos/:id/sair — sair do grupo
router.delete('/:id/sair', async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.usuario.id;
  try {
    await db.query(
      'DELETE FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2',
      [id, usuario_id]
    );
    res.json({ mensagem: 'Você saiu do grupo.' });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao sair do grupo.' });
  }
});

// GET /:id/stats/membros — Ranking de horas por membro
router.get('/:id/stats/membros', async (req, res) => {
  const { id } = req.params;
  const { periodo } = req.query; 

  let dataFiltro = new Date();
  if (periodo === 'diario') {
    dataFiltro.setHours(0, 0, 0, 0); 
  } else if (periodo === 'semanal') {
    dataFiltro.setDate(dataFiltro.getDate() - 7); 
  } else if (periodo === 'mensal') {
    dataFiltro.setDate(dataFiltro.getDate() - 30); 
  }

  try {
    // ::int garante que o Javascript entenda o número.
    // Troquei para s.criado_em (verifique se na sua tabela sessoes_estudo o nome é esse mesmo)
    const query = `
      SELECT u.id, u.nome, u.esta_estudando, COALESCE(SUM(s.duracao_segundos), 0)::int AS total_segundos
      FROM usuarios u
      JOIN grupo_membros gm ON u.id = gm.usuario_id
      LEFT JOIN sessoes_estudo s ON u.id = s.usuario_id AND s.criado_em >= $1
      WHERE gm.grupo_id = $2
      GROUP BY u.id, u.nome, u.esta_estudando
      ORDER BY total_segundos DESC, u.nome ASC
    `;
    
    const ranking = await db.query(query, [dataFiltro, id]);
    res.json(ranking.rows);

  } catch (erro) {
    console.error("ERRO NO RANKING SQL:", erro); // Olhe o terminal do Node se a tela ficar vazia de novo!
    res.status(500).json({ erro: 'Erro ao buscar ranking' });
  }
});

module.exports = router;