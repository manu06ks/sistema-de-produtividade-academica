import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";
import { apagarPlano, buscarPlano } from "@/lib/planos";

// GET /api/planos/:id -> { plano }
// Plano de outro aluno responde 404, igual a um plano que não existe.
export async function GET(_request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const id = lerId((await params).id);
  if (!id) {
    return Response.json({ erro: "Plano não encontrado." }, { status: 404 });
  }

  try {
    const plano = await buscarPlano(id, sessao.userId);
    if (!plano) {
      return Response.json({ erro: "Plano não encontrado." }, { status: 404 });
    }
    return Response.json({ plano });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao carregar o plano." }, { status: 500 });
  }
}

// DELETE /api/planos/:id
// Apaga o plano. O registro de tokens/custo permanece (fica sem plano), porque
// o gasto com a IA aconteceu de qualquer jeito e conta no limite do dia.
export async function DELETE(_request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const id = lerId((await params).id);
  if (!id) {
    return Response.json({ erro: "Plano não encontrado." }, { status: 404 });
  }

  try {
    const apagou = await apagarPlano(id, sessao.userId);
    if (!apagou) {
      return Response.json({ erro: "Plano não encontrado." }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao apagar o plano." }, { status: 500 });
  }
}