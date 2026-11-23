import { connection } from "next/server";
import { barrar, painelProtegido } from "@/lib/admin/auth";
import { statusBanco, EMAIL_DEMO, SENHA_DEMO } from "@/lib/admin/banco";
import { configuracaoIA, iaConfigurada } from "@/lib/ia";

// GET /api/admin/status -> estado do banco (quais tabelas existem e quantas linhas), da IA e do login de demonstração.
export async function GET(request) {
  await connection();
  const negado = await barrar(request);
  if (negado) return negado;

  const ia = { configurada: iaConfigurada(), modelo: configuracaoIA().modelo };
  const demo = { email: EMAIL_DEMO, senha: SENHA_DEMO };
  try {
    const banco = await statusBanco();
    return Response.json({ protegido: painelProtegido(), banco, ia, demo }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Admin: falha ao consultar o banco:", err);
    return Response.json(
      { erro: "Não foi possível conectar ao banco de dados. Confira as variáveis DB_* do servidor.", ia, demo },
      { status: 503 }
    );
  }
}
