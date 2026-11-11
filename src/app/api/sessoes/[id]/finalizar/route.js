import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/session';
import {
  SQL_AGORA_UTC,
  SQL_DECORRIDO_SEGUNDOS,
  MAX_SEGUNDOS_SESSAO,
  TOLERANCIA_SEGUNDOS,
  MIN_SEGUNDOS_PARA_GRAVAR,
  lerInteiroPositivo,
} from '@/lib/sessoes';

// POST /api/sessoes/:id/finalizar  { segundos }
// "segundos" = tempo focado medido pelo navegador (sem as pausas).
export async function POST(request, { params }) {
  const sessao = await getSession();
  if (!sessao) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
  }
  const userId = sessao.userId;

  const { id } = await params;
  const sessaoId = lerInteiroPositivo(id);
  if (!sessaoId) {
    return NextResponse.json({ erro: 'Sessão inválida.' }, { status: 400 });
  }

  let corpo = null;
  try {
    corpo = await request.json();
  } catch {
    // cai na validação abaixo
  }
  const segundos = corpo?.segundos;
  if (!Number.isInteger(segundos) || segundos < 0 || segundos > MAX_SEGUNDOS_SESSAO) {
    return NextResponse.json({ erro: 'Tempo inválido.' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Só a sessão ABERTA deste usuário. FOR UPDATE evita finalizar duas vezes.
    const { rows } = await client.query(
      `SELECT ${SQL_DECORRIDO_SEGUNDOS} AS decorrido
         FROM sessao_estudo
        WHERE id_sessao = $1
          AND fk_usuario_id_usuario = $2
          AND data_hora_fim IS NULL
        FOR UPDATE`,
      [sessaoId, userId]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ erro: 'Sessão não encontrada.' }, { status: 404 });
    }

    // Anti-trapaça simples: não dá para estudar mais do que o tempo que passou.
    if (segundos > rows[0].decorrido + TOLERANCIA_SEGUNDOS) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { erro: 'O tempo informado é maior que o tempo real da sessão.' },
        { status: 400 }
      );
    }

    // Menos de 1 minuto: descarta, não vale poluir o histórico.
    if (segundos < MIN_SEGUNDOS_PARA_GRAVAR) {
      await client.query('DELETE FROM sessao_estudo WHERE id_sessao = $1', [sessaoId]);
      await client.query('COMMIT');
      return NextResponse.json({ gravada: false, minutos: 0 });
    }

    const minutos = Math.round(segundos / 60);
    await client.query(
      `UPDATE sessao_estudo
          SET data_hora_fim = ${SQL_AGORA_UTC},
              tempo_total_minutos = $2
        WHERE id_sessao = $1`,
      [sessaoId, minutos]
    );

    await client.query('COMMIT');
    return NextResponse.json({ gravada: true, minutos });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro ao finalizar sessão:', e);
    return NextResponse.json({ erro: 'Erro ao salvar a sessão.' }, { status: 500 });
  } finally {
    client.release();
  }
}