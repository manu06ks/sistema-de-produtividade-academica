import { connection } from "next/server";
import { barrar } from "@/lib/admin/auth";
import { opcoesDeFk, traduzirErro } from "@/lib/admin/crud";

// GET /api/admin/tabelas/:tabela/opcoes?coluna=fk_... -> valores possíveis de uma chave estrangeira
export async function GET(request, { params }) {
  await connection();
  const negado = await barrar(request);
  if (negado) return negado;
  const { tabela } = await params;
  try {
    const coluna = new URL(request.url).searchParams.get("coluna") ?? "";
    return Response.json({ opcoes: await opcoesDeFk(tabela, coluna) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const { status, erro } = await traduzirErro(err, "consultar", tabela);
    return Response.json({ erro }, { status });
  }
}
