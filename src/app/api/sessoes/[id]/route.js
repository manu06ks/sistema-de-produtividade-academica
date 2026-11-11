import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { lerInteiroPositivo } from '@/lib/sessoes';

// DELETE /api/sessoes/:id -> descarta a sessão ABERTA do próprio usuário.
// Sessões já finalizadas (as horas de estudo) nunca são apagadas por aqui.
export async function DELETE(_request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;
  const sessaoId = lerInteiroPositivo(id);
  if (!sessaoId) {
    return NextResponse.json({ erro: 'Sessão inválida.' }, { status: 400 });
  }

  try {
    const r = await query(
      `DELETE FROM sessao_estudo
        WHERE id_sessao = $1
          AND fk_usuario_id_usuario = $2
          AND data_hora_fim IS NULL`,
      [sessaoId, sessao.userId]
    );
    if (r.rowCount === 0) {
      return NextResponse.json({ erro: 'Sessão não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Erro ao descartar sessão:', e);
    return NextResponse.json({ erro: 'Erro ao descartar o timer.' }, { status: 500 });
  }
}