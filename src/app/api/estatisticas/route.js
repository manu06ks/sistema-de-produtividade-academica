import { getSession } from "@/lib/session";
import { PERIODOS } from "@/lib/grupos";
import { buscarEstatisticas } from "@/lib/estatisticas";

// GET /api/estatisticas?periodo=diario|semanal|mensal
// Estatísticas do próprio aluno logado (nunca de outra pessoa).
export async function GET(request) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const periodo = new URL(request.url).searchParams.get("periodo") ?? "semanal";
  if (!PERIODOS.includes(periodo)) {
    return Response.json({ erro: "Período inválido." }, { status: 400 });
  }

  try {
    return Response.json(await buscarEstatisticas(sessao.userId, periodo));
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao carregar as estatísticas." }, { status: 500 });
  }
}