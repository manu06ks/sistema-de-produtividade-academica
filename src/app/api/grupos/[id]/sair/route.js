import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";

// POST /api/grupos/:id/sair
// Se o único administrador sai, o membro mais antigo assume. Se o grupo
// ficar vazio, ele é apagado.
export async function POST(_request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const grupoId = lerId((await params).id);
  if (!grupoId) {
    return Response.json({ erro: "Grupo não encontrado." }, { status: 404 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Trava o grupo: quem entra ao mesmo tempo espera esta transação terminar.
    const trava = await client.query(
      "SELECT 1 FROM grupo_estudos WHERE id_grupo = $1 FOR UPDATE",
      [grupoId]
    );
    if (trava.rows.length === 0) {
      await client.query("ROLLBACK");
      return Response.json({ erro: "Grupo não encontrado." }, { status: 404 });
    }

    // Todos os membros, do mais antigo para o mais novo.
    const membros = (
      await client.query(
        `SELECT fk_usuario_id_usuario AS usuario_id, papel_membro AS papel
           FROM participa
          WHERE fk_grupo_estudos_id_grupo = $1
          ORDER BY data_ingresso, fk_usuario_id_usuario
            FOR UPDATE`,
        [grupoId]
      )
    ).rows;

    const eu = membros.find((m) => m.usuario_id === sessao.userId);
    if (!eu) {
      await client.query("ROLLBACK");
      return Response.json({ erro: "Grupo não encontrado." }, { status: 404 });
    }

    await client.query(
      `DELETE FROM participa
        WHERE fk_grupo_estudos_id_grupo = $1 AND fk_usuario_id_usuario = $2`,
      [grupoId, sessao.userId]
    );

    const restantes = membros.filter((m) => m.usuario_id !== sessao.userId);
    let grupoApagado = false;
    let novoAdminId = null;

    if (restantes.length === 0) {
      await client.query("DELETE FROM grupo_estudos WHERE id_grupo = $1", [grupoId]);
      grupoApagado = true;
    } else if (
      eu.papel === "Administrador" &&
      !restantes.some((m) => m.papel === "Administrador")
    ) {
      novoAdminId = restantes[0].usuario_id;
      await client.query(
        `UPDATE participa
            SET papel_membro = 'Administrador'
          WHERE fk_grupo_estudos_id_grupo = $1 AND fk_usuario_id_usuario = $2`,
        [grupoId, novoAdminId]
      );
    }

    await client.query("COMMIT");
    return Response.json({ ok: true, grupo_apagado: grupoApagado, novo_admin_id: novoAdminId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return Response.json({ erro: "Erro interno ao sair do grupo." }, { status: 500 });
  } finally {
    client.release();
  }
}