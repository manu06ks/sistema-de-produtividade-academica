import { connection } from "next/server";
import { barrar } from "@/lib/admin/auth";
import { alterar, excluir, inserir, listar, traduzirErro } from "@/lib/admin/crud";

async function lerBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

const respostaDeErro = async (err, operacao, tabela) => {
  const { status, erro } = await traduzirErro(err, operacao, tabela);
  return Response.json({ erro }, { status });
};

// GET /api/admin/tabelas/:tabela?pagina=1 -> linhas da tabela (20 por página)
export async function GET(request, { params }) {
  await connection();
  const negado = await barrar(request);
  if (negado) return negado;
  const { tabela } = await params;
  try {
    const pagina = new URL(request.url).searchParams.get("pagina");
    return Response.json(await listar(tabela, pagina), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return respostaDeErro(err, "consultar", tabela);
  }
}

// POST /api/admin/tabelas/:tabela  { valores: { coluna: valor } } -> inclui um registro
export async function POST(request, { params }) {
  const negado = await barrar(request);
  if (negado) return negado;
  const { tabela } = await params;
  const body = await lerBody(request);
  if (!body?.valores) return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  try {
    return Response.json({ registro: await inserir(tabela, body.valores) }, { status: 201 });
  } catch (err) {
    return respostaDeErro(err, "inserir", tabela);
  }
}

// PUT /api/admin/tabelas/:tabela  { chave: { pk: valor }, valores: { coluna: valor } } -> altera um registro
export async function PUT(request, { params }) {
  const negado = await barrar(request);
  if (negado) return negado;
  const { tabela } = await params;
  const body = await lerBody(request);
  if (!body?.chave || !body?.valores) return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  try {
    return Response.json({ registro: await alterar(tabela, body.chave, body.valores) });
  } catch (err) {
    return respostaDeErro(err, "alterar", tabela);
  }
}

// DELETE /api/admin/tabelas/:tabela  { chave: { pk: valor } } -> exclui um registro
export async function DELETE(request, { params }) {
  const negado = await barrar(request);
  if (negado) return negado;
  const { tabela } = await params;
  const body = await lerBody(request);
  if (!body?.chave) return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  try {
    await excluir(tabela, body.chave);
    return Response.json({ ok: true });
  } catch (err) {
    return respostaDeErro(err, "excluir", tabela);
  }
}
