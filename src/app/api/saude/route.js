import { connection } from "next/server";
import { query } from "@/lib/db";

// GET /api/saude -> diz se o app está no ar e se alcança o banco.
// Serve para testar o deploy. É pública, então só devolve sim/não:
// nenhum valor de variável e nenhum texto de erro sai daqui.
export async function GET() {
  await connection();

  const config = {
    segredoSessao: (process.env.SESSION_SECRET ?? "").length >= 32,
    armazenamento: Boolean(
      process.env.AZURE_STORAGE_CONNECTION_STRING && process.env.AZURE_STORAGE_CONTAINER
    ),
    ia: Boolean(process.env.GEMINI_API_KEY),
  };

  try {
    await query("SELECT 1");
    return Response.json(
      { ok: true, banco: "ok", config },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Falha na checagem de saúde:", err);
    return Response.json(
      { ok: false, banco: "falhou", config },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}