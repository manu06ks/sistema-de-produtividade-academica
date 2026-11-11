import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSession } from '@/lib/session';
import { SQL_AGORA_UTC, SQL_INICIO_ISO, lerInteiroPositivo } from '@/lib/sessoes';

// POST /api/sessoes  { atividade_id }  -> abre a sessão (o timer começou)
export async function POST(request) {
  const sessao = await getSession();
  if (!sessao) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 });
  }
  const userId = sessao.userId;

  let corpo = null;
  try {
    corpo = await request.json();
  } catch {
    // corpo vazio ou inválido: cai na validação abaixo
  }
  const atividadeId = lerInteiroPositivo(corpo?.atividade_id);
  if (!atividadeId) {
    return NextResponse.json({ erro: 'Informe a atividade.' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) A atividade está no quadro DESTE aluno? (aceita e não escondida)
    //    FOR UPDATE trava a linha até o fim da transação.
    const { rows } = await client.query(
      `SELECT status
         FROM atividade_usuario
        WHERE fk_usuario_id_usuario = $1
          AND fk_atividade_id_atividade = $2
          AND status_convite = 'Aceita'
          AND removida_em IS NULL
        FOR UPDATE`,
      [userId, atividadeId]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ erro: 'Atividade não encontrada.' }, { status: 404 });
    }
    const statusAtual = rows[0].status;
    if (statusAtual === 'Concluído') {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { erro: 'Esta atividade já foi concluída.' },
        { status: 409 }
      );
    }

    // 2) Descarta qualquer sessão ABERTA anterior (só abertas: as fechadas,
    //    que guardam as horas, nunca são tocadas).
    await client.query(
      `DELETE FROM sessao_estudo
        WHERE fk_usuario_id_usuario = $1 AND data_hora_fim IS NULL`,
      [userId]
    );

    // 3) Abre a nova sessão. O horário vem do relógio do servidor, em UTC.
    const ins = await client.query(
      `INSERT INTO sessao_estudo
              (data_hora_inicio, fk_usuario_id_usuario, fk_atividade_id_atividade)
       VALUES (${SQL_AGORA_UTC}, $1, $2)
       RETURNING id_sessao AS id, ${SQL_INICIO_ISO} AS inicio`,
      [userId, atividadeId]
    );

    // 4) Se estava em "A Fazer", passa para "Fazendo".
    let moveuParaFazendo = false;
    if (statusAtual === 'A Fazer') {
      await client.query(
        `UPDATE atividade_usuario
            SET status = 'Fazendo'
          WHERE fk_usuario_id_usuario = $1 AND fk_atividade_id_atividade = $2`,
        [userId, atividadeId]
      );
      moveuParaFazendo = true;
    }

    await client.query('COMMIT');
    return NextResponse.json(
      {
        id: ins.rows[0].id,
        inicio: ins.rows[0].inicio,
        atividade_id: atividadeId,
        moveu_para_fazendo: moveuParaFazendo,
      },
      { status: 201 }
    );
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    // 23505: duas abas iniciaram ao mesmo tempo (índice único de sessão aberta)
    if (e.code === '23505') {
      return NextResponse.json(
        { erro: 'Já existe um timer em andamento. Tente novamente.' },
        { status: 409 }
      );
    }
    // 23503: a atividade deixou de existir no meio do caminho
    if (e.code === '23503') {
      return NextResponse.json({ erro: 'Atividade não encontrada.' }, { status: 404 });
    }
    console.error('Erro ao abrir sessão:', e);
    return NextResponse.json({ erro: 'Erro ao iniciar o timer.' }, { status: 500 });
  } finally {
    client.release();
  }
}