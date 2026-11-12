import { getSession } from "@/lib/session";
import { ErroPedido, gerarPlano, lerHoje, listarPlanos, resumoDeUso } from "@/lib/planos";

// GET /api/planos -> { planos: [...], uso: { hoje:{usados,limite}, mes:{...} } }
// Só os planos do próprio aluno, do mais novo para o mais antigo.
export async function GET() {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  try {
    const hoje = await lerHoje();
    const [planos, uso] = await Promise.all([listarPlanos(sessao.userId), resumoDeUso(sessao.userId, hoje)]);
    return Response.json({ planos, uso, hoje });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao carregar os planos." }, { status: 500 });
  }
}

// POST /api/planos  { disciplina_id, data_alvo: "AAAA-MM-DD", horas_por_dia, conteudos? }
// Gera um plano com a IA, grava e devolve { plano, uso }.
export async function POST(request) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    return Response.json(await gerarPlano(sessao.userId, body), { status: 201 });
  } catch (err) {
    if (err instanceof ErroPedido) {
      return Response.json({ erro: err.message, ...err.extra }, { status: err.status });
    }
    console.error(err);
    return Response.json({ erro: "Erro interno ao gerar o plano." }, { status: 500 });
  }
}