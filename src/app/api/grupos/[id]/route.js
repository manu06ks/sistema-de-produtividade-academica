import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";
import { buscarGrupoDoUsuario, validarGrupo } from "@/lib/grupos";

// GET /api/grupos/:id -> detalhes (só para membros)
export async function GET(_request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const grupoId = lerId((await params).id);
  if (!grupoId) {
    return Response.json({ erro: "Grupo não encontrado." }, { status: 404 });
  }

  try {
    const grupo = await buscarGrupoDoUsuario(grupoId, sessao.userId);
    if (!grupo) {
      return Response.json({ erro: "Grupo não encontrado." }, { status: 404 });
    }
    return Response.json(grupo);
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno." }, { status: 500 });
  }
}

// PUT /api/grupos/:id  { nome, descricao, status_ativo? } -> só administradores
export async function PUT(request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const grupoId = lerId((await params).id);
  if (!grupoId) {
    return Response.json({ erro: "Grupo não encontrado." }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  try {
    const atual = await buscarGrupoDoUsuario(grupoId, sessao.userId);
    if (!atual) {
      return Response.json({ erro: "Grupo não encontrado." }, { status: 404 });
    }
    if (!atual.is_admin) {
      return Response.json(
        { erro: "Só um administrador pode editar o grupo." },
        { status: 403 }
      );
    }

    const validado = validarGrupo(body);
    if (validado.erro) {
      return Response.json({ erro: validado.erro }, { status: 400 });
    }

    let ativo = atual.status_ativo;
    if (body.status_ativo !== undefined) {
      if (typeof body.status_ativo !== "boolean") {
        return Response.json({ erro: "Situação do grupo inválida." }, { status: 400 });
      }
      ativo = body.status_ativo;
    }

    await query(
      `UPDATE grupo_estudos
          SET nome = $2, descricao = $3, status_ativo = $4
        WHERE id_grupo = $1`,
      [grupoId, validado.valores.nome, validado.valores.descricao, ativo]
    );

    return Response.json(await buscarGrupoDoUsuario(grupoId, sessao.userId));
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao salvar o grupo." }, { status: 500 });
  }
}