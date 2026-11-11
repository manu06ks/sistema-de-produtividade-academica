'use client';

import Link from 'next/link';
import { Timer, Pause, Coffee } from 'lucide-react';
import { useTimer } from '@/components/TimerProvider';
import { formatarTempo } from '@/lib/timer';

// Contador compacto do cabeçalho: aparece em qualquer tela enquanto há uma sessão.
export default function TimerPill() {
  const { estado, segundosFoco, segundosDescanso } = useTimer();
  if (estado.sessaoId === null) return null;

  const descansando = estado.modo === 'pausa';
  const correndo = descansando ? estado.pausaFimEm !== null : estado.retomadoEm !== null;
  const segundos = descansando ? segundosDescanso : segundosFoco;

  const Icone = descansando ? Coffee : correndo ? Timer : Pause;
  const situacao = descansando ? 'descansando' : correndo ? 'estudando' : 'em pausa';

  return (
    <Link
      href="/dashboard"
      title={`${estado.titulo} (${situacao})`}
      className="flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
    >
      <Icone className={`h-4 w-4 ${correndo && !descansando ? 'animate-pulse' : ''}`} />
      <span role="timer" className="font-mono tabular-nums">
        {formatarTempo(segundos)}
      </span>
      <span className="hidden max-w-[9rem] truncate font-semibold md:inline">{estado.titulo}</span>
    </Link>
  );
}