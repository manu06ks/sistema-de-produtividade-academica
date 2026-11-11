import { getSession } from "@/lib/session";
import { lerId } from "@/lib/disciplinas";
import { gerarLinkDownload } from "@/lib/armazenamento";
import { FORMATOS, nomeParaDownload } from "@/lib/arquivos";
import { atividadeVisivelPara, buscarMaterialDoMembro } from "@/lib/materiais";

// GET /api/materiais/:id/baixar -> confere o acesso e redireciona para um
// link do Azure que vale por 5 minutos.
export async function GET(_request, { params }) {
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

    // Anexo de atividade: só quem aceitou a atividade (e não a removeu do quadro).
    if (material.atividade_id) {
      const atividade = await atividadeVisivelPara(material.atividade_id, sessao.userId);
      if (!atividade) {
        return Response.json({ erro: "Arquivo não encontrado." }, { status: 404 });
      }
    }

    const link = await gerarLinkDownload(
      material.caminho,
      nomeParaDownload(material.nome, material.formato),
      FORMATOS[material.formato]?.contentType ?? "application/octet-stream"
    );

    return new Response(null, {
      status: 302,
      headers: { Location: link, "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error(err);
    return Response.json({ erro: "Erro interno ao abrir o arquivo." }, { status: 500 });
  }
}