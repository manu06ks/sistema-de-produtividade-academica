import { connection } from "next/server";
import { barrar } from "@/lib/admin/auth";
import { executarConsulta } from "@/lib/admin/consultas";

// GET /api/admin/consultas/1 | 2 | 3 -> executa a consulta do relatório e devolve colunas, linhas e o SQL
export async function GET(request, { params }) {
  await connection();
  const negado = await barrar(request);
  if (negado) return negado;
  const id = Number((await params).n);
  try {
    const resultado = await executarConsulta(id);
    if (!resultado) return Response.json({ erro: "Consulta não encontrada." }, { status: 404 });
    return Response.json(resultado, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err?.code === "42P01") {
      return Response.json(
        { erro: "As tabelas não existem. Use 'Criar tabelas' e 'Carregar dados' em Banco de dados." },
        { status: 409 }
      );
    }
    console.error("Admin: erro na consulta", id, err);
    return Response.json({ erro: "Erro ao executar a consulta." }, { status: 500 });
  }
}
