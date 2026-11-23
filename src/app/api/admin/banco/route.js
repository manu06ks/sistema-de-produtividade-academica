import { barrar } from "@/lib/admin/auth";
import { carregarDados, criarTabelas, eliminarTabelas, recriarTudo, statusBanco, ErroAdmin } from "@/lib/admin/banco";

const ACOES = {
  criar: { executar: criarTabelas, ok: "Tabelas criadas.", destrutiva: false },
  carregar: { executar: carregarDados, ok: "Dados de demonstração carregados.", destrutiva: false },
  eliminar: { executar: eliminarTabelas, ok: "Todas as tabelas foram eliminadas.", destrutiva: true },
  recriar: { executar: recriarTudo, ok: "Banco recriado: tabelas eliminadas, criadas e carregadas.", destrutiva: true },
};

// POST /api/admin/banco  { acao: "criar" | "carregar" | "eliminar" | "recriar", confirmar?: true }
export async function POST(request) {
  const negado = await barrar(request);
  if (negado) return negado;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const acao = ACOES[body?.acao];
  if (!acao) return Response.json({ erro: "Ação desconhecida." }, { status: 400 });
  if (acao.destrutiva && body.confirmar !== true) {
    return Response.json({ erro: "Esta ação apaga dados e precisa de confirmação." }, { status: 400 });
  }

  try {
    await acao.executar();
    return Response.json({ mensagem: acao.ok, banco: await statusBanco() });
  } catch (err) {
    if (err instanceof ErroAdmin) return Response.json({ erro: err.message }, { status: err.status });
    console.error("Admin: erro na ação", body.acao, err);
    return Response.json({ erro: `Falha ao executar a ação: ${err.message}` }, { status: 500 });
  }
}
