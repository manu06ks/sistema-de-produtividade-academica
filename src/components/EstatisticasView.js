'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Clock, Flame, ListChecks } from 'lucide-react';
import { useTimer } from '@/components/TimerProvider';
import GraficoDias from '@/components/GraficoDias';
import BarrasDisciplinas from '@/components/BarrasDisciplinas';
import MapaHorarios from '@/components/MapaHorarios';
import { PERIODOS_RANKING, dataBR, formatarMinutos } from '@/lib/ranking';
import { DIAS_SEMANA, diaDaSemanaDe } from '@/lib/calendario';

const ATUALIZAR_A_CADA_MS = 30000;

function textoSequencia(resumo) {
  const { sequencia_dias: dias, estudou_hoje: hoje } = resumo;
  if (dias === 0) return 'Estude hoje para começar uma sequência.';
  return hoje ? 'Hoje já conta.' : 'Estude hoje para não perder a sequência.';
}

function Cartao({ icone: Icone, titulo, valor, detalhe }) {
  return (
    <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icone className="h-4 w-4 text-primary" /> {titulo}
      </p>
      <p className="text-2xl font-bold text-foreground">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}

export default function EstatisticasView() {
  const { estado } = useTimer();
  const sessaoId = estado.sessaoId; // muda quando você inicia, salva ou descarta um timer

  const [periodo, setPeriodo] = useState('semanal');
  const [dados, setDados] = useState(null); // resposta da API; guarda também o período a que pertence
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0); // aumenta no botão "Tentar de novo"

  // Carrega ao abrir, ao trocar de período, quando o seu timer muda (sessaoId),
  // quando você volta para a aba e a cada 30 segundos.
  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const r = await fetch(`/api/estatisticas?periodo=${periodo}`);
        if (!r.ok) throw new Error('falha');
        const resposta = await r.json();
        if (!ativo) return;
        setDados(resposta);
        setErro(false);
      } catch {
        if (ativo) setErro(true);
      }
    }

    function seVisivel() {
      if (document.visibilityState === 'visible') carregar();
    }

    carregar();
    const intervalo = setInterval(seVisivel, ATUALIZAR_A_CADA_MS);
    document.addEventListener('visibilitychange', seVisivel);

    return () => {
      ativo = false;
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', seVisivel);
    };
  }, [periodo, sessaoId, tentativa]);

  // Enquanto chega a resposta do período recém-escolhido, ainda temos a do
  // anterior: não a mostramos como se fosse a nova.
  const carregando = dados === null || dados.periodo !== periodo;
  const resumo = dados?.resumo;
  const melhorDia = resumo?.melhor_dia;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-primary">Estatísticas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {carregando || !dados
              ? 'Acompanhe o seu tempo de estudo.'
              : dados.inicio === dados.fim
                ? dataBR(dados.inicio)
                : `${dataBR(dados.inicio)} a ${dataBR(dados.fim)}`}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Período das estatísticas"
          className="flex gap-1 self-start rounded-xl bg-secondary p-1 sm:self-auto"
        >
          {PERIODOS_RANKING.map((p) => (
            <button
              key={p.valor}
              type="button"
              role="tab"
              aria-selected={periodo === p.valor}
              onClick={() => setPeriodo(p.valor)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                periodo === p.valor
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      {estado.sessaoId && (
        <p className="rounded-xl bg-primary/5 p-3 text-xs font-medium text-foreground">
          Há um timer em andamento. O tempo dele entra nas estatísticas quando for salvo.
        </p>
      )}

      {erro && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive sm:flex-row sm:items-center"
        >
          <span>Não foi possível carregar as estatísticas.</span>
          <button
            type="button"
            onClick={() => setTentativa((n) => n + 1)}
            className="self-start rounded-lg border border-destructive/30 px-3 py-1 text-xs font-bold hover:bg-destructive/10"
          >
            Tentar de novo
          </button>
        </div>
      )}

      {carregando ? (
        !erro && (
          <p className="py-16 text-center text-sm text-muted-foreground">Carregando estatísticas...</p>
        )
      ) : (
        <div role="tabpanel" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Cartao
              icone={Clock}
              titulo="Tempo focado"
              valor={formatarMinutos(resumo.total_minutos)}
              detalhe={`${resumo.dias_estudados} de ${resumo.dias_no_periodo} ${
                resumo.dias_no_periodo === 1 ? 'dia' : 'dias'
              } com estudo`}
            />
            <Cartao
              icone={ListChecks}
              titulo="Sessões"
              valor={String(resumo.sessoes)}
              detalhe={
                resumo.sessoes > 0
                  ? `média de ${formatarMinutos(resumo.media_minutos)} por sessão`
                  : 'nenhuma sessão salva'
              }
            />
            <Cartao
              icone={CalendarCheck}
              titulo="Melhor dia"
              valor={melhorDia ? formatarMinutos(melhorDia.minutos) : '—'}
              detalhe={
                melhorDia
                  ? `${DIAS_SEMANA[diaDaSemanaDe(melhorDia.data)].longo}, ${dataBR(melhorDia.data)}`
                  : 'ainda sem estudo no período'
              }
            />
            <Cartao
              icone={Flame}
              titulo="Sequência"
              valor={`${resumo.sequencia_dias} ${resumo.sequencia_dias === 1 ? 'dia' : 'dias'}`}
              detalhe={textoSequencia(resumo)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            <GraficoDias dias={dados.dias} periodo={dados.periodo} />
            <BarrasDisciplinas disciplinas={dados.disciplinas} />
            <MapaHorarios padroes={dados.padroes} />
          </div>
        </div>
      )}
    </div>
  );
}