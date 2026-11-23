import { connection } from "next/server";
import { barrar } from "@/lib/admin/auth";
import { configuracaoIA, iaConfigurada } from "@/lib/ia";
import { ErroPedido, gerarPlano } from "@/lib/planos";
import { query } from "@/lib/db";

// GET /api/admin/ia -> configuração da IA, quem pode pedir um plano e o consumo registrado.
export async function GET(request) {
  await connection();
  const negado = await barrar(request);
  if (negado) return negado;

  const config = configuracaoIA();
  try {
    const [usuarios, matriculas, uso, ultimas] = await Promise.all([
      query(`SELECT id_usuario AS id, nome FROM usuario ORDER BY nome`),
      query(
        `SELECT c.fk_usuario_id_usuario AS usuario_id, d.id_disciplina AS id, d.nome
           FROM cursa c JOIN disciplina d ON d.id_disciplina = c.fk_disciplina_id_disciplina
          ORDER BY d.nome`
      ),
      query(
        `SELECT COUNT(*)::int AS chamadas,
                COALESCE(SUM(tokens_entrada), 0)::float8 AS tokens_entrada,
                COALESCE(SUM(tokens_saida), 0)::float8 AS tokens_saida,
                COALESCE(SUM(custo_total), 0)::float8 AS custo
           FROM historico_tokens_ia`
      ),
      query(
        `SELECT h.id_historico AS id, u.nome AS usuario, h.tokens_entrada, h.tokens_saida,
                h.custo_total::float8 AS custo, to_char(h.data_requi, 'DD/MM/YYYY HH24:MI') AS quando,
                (h.fk_plano_estudos_id_plano IS NOT NULL) AS gerou_plano
           FROM historico_tokens_ia h JOIN usuario u ON u.id_usuario = h.fk_usuario_id_usuario
          ORDER BY h.id_historico DESC LIMIT 8`
      ),
    ]);
    return Response.json(
      {
        configurada: iaConfigurada(),
        modelo: config.modelo,
        usuarios: usuarios.rows,
        matriculas: matriculas.rows,
        uso: uso.rows[0],
        ultimas: ultimas.rows,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    if (err?.code === "42P01") {
      return Response.json({ erro: "As tabelas não existem. Crie e carregue o banco primeiro." }, { status: 409 });
    }
    console.error("Admin IA:", err);
    return Response.json({ erro: "Erro ao ler os dados da IA." }, { status: 500 });
  }
}

// POST /api/admin/ia { usuario_id, disciplina_id, data_alvo, horas_por_dia, conteudos }
// Gera um plano de estudos com o Gemini para o estudante escolhido (mesma função do app).
export async function POST(request) {
  const negado = await barrar(request);
  if (negado) return negado;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }
  const usuarioId = Number(body?.usuario_id);
  if (!Number.isInteger(usuarioId) || usuarioId < 1) {
    return Response.json({ erro: "Escolha o estudante." }, { status: 400 });
  }
  if (!iaConfigurada()) {
    return Response.json({ erro: "A IA não está configurada: defina GEMINI_API_KEY no servidor." }, { status: 503 });
  }

  try {
    return Response.json(await gerarPlano(usuarioId, body), { status: 201 });
  } catch (err) {
    if (err instanceof ErroPedido) {
      return Response.json({ erro: err.message, ...err.extra }, { status: err.status });
    }
    console.error("Admin IA: erro ao gerar plano:", err);
    return Response.json({ erro: "Erro interno ao gerar o plano." }, { status: 500 });
  }
}
