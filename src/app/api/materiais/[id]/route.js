import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";
import { apagarArquivo } from "@/lib/armazenamento";
import { buscarMaterialDoMembro } from "@/lib/materiais";

// DELETE /api/materiais/:id -> quem enviou ou o criador da disciplina
export async function DELETE(_request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return Response.json({ erro: "Não autenticado." }, { status: 401 });
  }

  const materialId = lerId((await params).id);
  if (!materialId) {
    return Response.json({ erro: "Arquivo não encontrado." }, { status: 404 });
  }

  try {
    const material = await buscarMaterialDoMembro(materialId, sessao.userId);
    if (!material) {
      return Response.json({ erro: "Arquivo não encontrado." }, { status: 404 });
    }
    if (!material.pode_apagar) {
      return Response.json(
        { erro: "Só quem enviou o arquivo ou o criador da disciplina pode apagá-lo." },
        { status: 403 }
      );
    }

    // Primeiro a linha do banco: é ela que a tela usa. Se o Azure falhar depois,
    // sobra um arquivo solto lá (sem ninguém ver), nunca uma linha sem arquivo.
    await query("DELETE FROM material WHERE id_material = $1", [materialId]);
    try {
      await apagarArquivo(material.caminho);
    } catch (err) {
      console.error("Arquivo solto no Azure:", material.caminho, err);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao apagar o arquivo." }, { status: 500 });
  }
}