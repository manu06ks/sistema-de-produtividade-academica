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


router.post('/:id/eventos', async (req, res) => {
  const { id } = req.params; // ID do grupo
  const criador_id = req.usuario.id;
  const { titulo, tipo, data_evento, descricao, hora_evento } = req.body;

  try {
    // 1. Verifica se o usuário é do grupo e tem permissão (criador ou moderador)
    const membro = await db.query(
      "SELECT papel FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2",
      [id, criador_id]
    );

    if (membro.rows.length === 0 || membro.rows[0].papel === 'membro') {
      return res.status(403).json({ erro: 'Apenas moderadores podem sugerir eventos.' });
    }

    // 2. Cria o evento
    const result = await db.query(
      `INSERT INTO grupo_eventos (grupo_id, criador_id, titulo, tipo, data_evento, descricao, hora_evento)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, criador_id, titulo, tipo, data_evento, descricao || '', hora_evento || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao criar evento.' });
  }
});

// GET /grupos/:id/eventos — Lista os eventos e verifica se eu já votei
router.get('/:id/eventos', async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.usuario.id;

  try {
    // Essa query busca os eventos e já faz um JOIN para descobrir se o aluno logado já votou
    const result = await db.query(`
      SELECT e.*, 
             r.resposta AS meu_voto
      FROM grupo_eventos e
      LEFT JOIN grupo_eventos_respostas r 
             ON e.id = r.evento_id AND r.usuario_id = $2
      WHERE e.grupo_id = $1 AND e.removido_em IS NULL
      ORDER BY e.data_evento ASC
    `, [id, usuario_id]);

    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao buscar eventos.' });
  }
});

// POST /grupos/:id/eventos/:eid/responder — Aluno clica em Aceitar ou Recusar
router.post('/:id/eventos/:eid/responder', async (req, res) => {
  const { eid } = req.params; // ID do evento
  const usuario_id = req.usuario.id;
  const { resposta } = req.body; // 'aceito' ou 'ignorado'

  try {
    // O comando "ON CONFLICT" faz um "Upsert": se o aluno já tinha votado, ele apenas atualiza o voto!
    const result = await db.query(`
      INSERT INTO grupo_eventos_respostas (evento_id, usuario_id, resposta)
      VALUES ($1, $2, $3)
      ON CONFLICT (evento_id, usuario_id) 
      DO UPDATE SET resposta = EXCLUDED.resposta, respondido_em = NOW()
      RETURNING *
    `, [eid, usuario_id, resposta]);

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao registrar resposta.' });
  }
});

// GET /grupos/:id/stats/membros — Ranking de horas por membro (Apenas pós-entrada)
router.get('/:id/stats/membros', async (req, res) => {
  const { id } = req.params;
  const usuario_id = req.usuario.id;

  try {
    //  Verifica se quem está pedindo é membro do grupo (Privacidade) [cite: 31]
    const membro = await db.query(
      'SELECT id FROM grupo_membros WHERE grupo_id = $1 AND usuario_id = $2',
      [id, usuario_id]
    );
    
    if (membro.rows.length === 0) {
      return res.status(403).json({ erro: 'Acesso negado. Você não está neste grupo.' });
    }

    // Calcula as horas contando APENAS o que foi estudado DEPOIS de entrar no grupo
    // Cruzamos a tabela de sessões com o momento que o aluno entrou no grupo [cite: 41, 42]
    const ranking = await db.query(`
        SELECT 
        u.id, 
        u.nome,
        COALESCE(SUM(se.duracao_segundos), 0) AS total_segundos
        FROM grupo_membros gm
        JOIN usuarios u ON gm.usuario_id = u.id
        LEFT JOIN sessoes_estudo se 
                ON se.usuario_id = u.id 
            AND se.criado_em >= gm.entrou_em
        WHERE gm.grupo_id = $1
        GROUP BY u.id, u.nome
        ORDER BY total_segundos DESC
        `, [id]);

    res.json(ranking.rows);
  } catch (e) {
    console.error("Erro ao buscar horas dos membros:", e);
    res.status(500).json({ erro: 'Erro ao calcular ranking do grupo.' });
  }
});

module.exports = router;