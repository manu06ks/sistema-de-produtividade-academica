import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST() {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  try {
    const r = await query(
      `UPDATE atividade_usuario
          SET removida_em = NOW()
        WHERE fk_usuario_id_usuario = $1
          AND status_convite = 'Aceita'
          AND status = 'Concluído'
          AND removida_em IS NULL`,
      [sessao.userId]
    );
    return Response.json({ ocultadas: r.rowCount });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}