import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { buscarSessaoAberta } from '@/lib/sessoes';

// GET /api/sessoes/atual -> { sessao } com a sessão aberta, ou { sessao: null }
// (Como lê o cookie de sessão, a rota já é dinâmica: não precisa de connection().)
export async function GET() {
  const sessao = await getSession();
  if (!sessao) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const aberta = await buscarSessaoAberta(sessao.userId);
    return NextResponse.json({ sessao: aberta });
  } catch (e) {
    console.error('Erro ao buscar sessão atual:', e);
    return NextResponse.json({ erro: 'Erro ao buscar o timer.' }, { status: 500 });
  }
}