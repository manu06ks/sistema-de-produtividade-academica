'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles } from 'lucide-react';
import { diferencaDias } from '@/lib/calendario';
import { dataBR, formatarMinutos } from '@/lib/ranking';
import {
  ATALHOS_DATA,
  MAX_CONTEUDOS,
  MAX_DIAS_PLANO,
  OPCOES_HORAS,
  dataCompleta,
  rotuloHoras,
  somarDias,
} from '@/lib/planos-cliente';

const campoClass =
  'w-full rounded-xl border border-border/60 bg-input/50 p-3 text-sm font-medium text-foreground transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60';
const rotuloClass = 'text-[10px] font-bold uppercase tracking-wide text-muted-foreground';

export default function FormularioPlano({ disciplinas, hoje, uso, onGerado, onFalha }) {
  const { usados, limite } = uso.hoje;
  const esgotado = usados >= limite;
  const semDisciplinas = disciplinas.length === 0;

  // Com uma única disciplina, ela já vem escolhida.
  const [disciplinaId, setDisciplinaId] = useState(disciplinas.length === 1 ? String(disciplinas[0].id) : '');
  const [dataAlvo, setDataAlvo] = useState(() => somarDias(hoje, 6)); // 7 dias, contando hoje
  const [horas, setHoras] = useState('2');
  const [conteudos, setConteudos] = useState('');
  const [erro, setErro] = useState('');
  const [gerando, setGerando] = useState(false);
  const emAndamento = useRef(false); // trava de duplo clique (o estado só muda no próximo ciclo)

  const dataMaxima = somarDias(hoje, MAX_DIAS_PLANO - 1);
  const diasDoPlano =
    dataCompleta(dataAlvo) && dataAlvo >= hoje && dataAlvo <= dataMaxima ? diferencaDias(hoje, dataAlvo) + 1 : null;

  function conferir() {
    if (!disciplinaId) return 'Escolha a disciplina.';
    if (!dataCompleta(dataAlvo)) return 'Escolha a data-alvo.';
    if (dataAlvo < hoje) return 'A data-alvo não pode ser anterior a hoje.';
    if (dataAlvo > dataMaxima) {
      return `O plano pode ter no máximo ${MAX_DIAS_PLANO} dias. Escolha uma data até ${dataBR(dataMaxima)}.`;
    }
    return '';
  }

  async function enviar(e) {
    e.preventDefault();
    if (emAndamento.current || esgotado || semDisciplinas) return;

    const problema = conferir();
    if (problema) {
      setErro(problema);
      return;
    }

    emAndamento.current = true;
    setErro('');
    setGerando(true);
    try {
      const r = await fetch('/api/planos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disciplina_id: Number(disciplinaId),
          data_alvo: dataAlvo,
          horas_por_dia: Number(horas),
          conteudos: conteudos.trim(),
        }),
      });
      const corpo = await r.json().catch(() => null);
      if (!r.ok) {
        setErro(corpo?.erro ?? 'Não foi possível gerar o plano.');
        onFalha();
        return;
      }
      onGerado(corpo);
    } catch {
      // A resposta pode ter se perdido depois de a IA terminar: a lista é recarregada.
      setErro('Não foi possível falar com o servidor. Confira a conexão e veja se o plano apareceu na lista abaixo.');
      onFalha();
    } finally {
      emAndamento.current = false;
      setGerando(false);
    }
  }

  return (
    <section aria-labelledby="form-titulo" className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
      <h2 id="form-titulo" className="mb-1 flex items-center gap-2 text-lg font-bold text-foreground">
        <Sparkles className="h-5 w-5 text-primary" /> Novo plano de estudos
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        A IA monta um plano dia a dia, de hoje até a data-alvo, com base nas suas atividades e no quanto você já
        estudou.
      </p>

      {semDisciplinas && (
        <p className="mb-4 rounded-xl bg-secondary/50 p-3 text-sm text-muted-foreground">
          Você ainda não tem disciplinas. Crie ou entre em uma disciplina no{' '}
          <Link href="/dashboard" className="font-semibold text-primary underline">
            painel
          </Link>{' '}
          para gerar um plano.
        </p>
      )}

      {erro && (
        <div role="alert" className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {erro}
        </div>
      )}

      <form onSubmit={enviar} noValidate aria-busy={gerando}>
        <fieldset disabled={gerando || semDisciplinas} className="flex min-w-0 flex-col gap-4">
          <legend className="sr-only">Dados do plano</legend>

          <div className="flex flex-col gap-1">
            <label htmlFor="plano-disciplina" className={rotuloClass}>
              Disciplina
            </label>
            <select
              id="plano-disciplina"
              value={disciplinaId}
              onChange={(e) => setDisciplinaId(e.target.value)}
              className={campoClass}
            >
              {disciplinas.length !== 1 && <option value="">Escolha...</option>}
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="plano-data" className={rotuloClass}>
                Data-alvo (prova, entrega ou outra meta)
              </label>
              <input
                id="plano-data"
                type="date"
                value={dataAlvo}
                min={hoje}
                max={dataMaxima}
                onChange={(e) => setDataAlvo(e.target.value)}
                className={campoClass}
              />
              <div className="mt-1 flex flex-wrap gap-1.5" role="group" aria-label="Atalhos para a data-alvo">
                {ATALHOS_DATA.map((a) => (
                  <button
                    key={a.dias}
                    type="button"
                    onClick={() => setDataAlvo(somarDias(hoje, a.dias - 1))}
                    className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground transition-colors hover:bg-accent"
                  >
                    {a.rotulo}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground" data-resumo-dias>
                {diasDoPlano === null
                  ? `Escolha uma data entre hoje e ${dataBR(dataMaxima)}.`
                  : `Plano de ${diasDoPlano} ${diasDoPlano === 1 ? 'dia' : 'dias'}: de ${dataBR(hoje).slice(0, 5)} a ${dataBR(dataAlvo).slice(0, 5)}.`}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="plano-horas" className={rotuloClass}>
                Tempo de estudo por dia
              </label>
              <select
                id="plano-horas"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                className={campoClass}
              >
                {OPCOES_HORAS.map((h) => (
                  <option key={h} value={h}>
                    {rotuloHoras(h)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                É o máximo por dia: o plano nunca passa de {formatarMinutos(Math.round(Number(horas) * 60))}.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="plano-conteudos" className={rotuloClass}>
              Conteúdos ou observações (opcional)
            </label>
            <textarea
              id="plano-conteudos"
              value={conteudos}
              onChange={(e) => setConteudos(e.target.value)}
              maxLength={MAX_CONTEUDOS}
              rows={4}
              placeholder="Ex.: limites, derivadas, regra da cadeia. Se for prova, liste os assuntos que vão cair."
              className={`${campoClass} resize-y`}
            />
            <p className="text-right text-[11px] text-muted-foreground" data-contador>
              {conteudos.length}/{MAX_CONTEUDOS}
            </p>
          </div>

          <button
            type="submit"
            disabled={esgotado}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {gerando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando o plano...
              </>
            ) : esgotado ? (
              'Limite de hoje atingido'
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Gerar plano
              </>
            )}
          </button>
        </fieldset>
      </form>

      {gerando && (
        <p role="status" className="mt-3 text-center text-xs font-medium text-muted-foreground">
          A IA está montando o seu plano. Isso costuma levar de alguns segundos a 1 minuto. Não feche esta página.
        </p>
      )}
      {esgotado && !gerando && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Você usou os {limite} planos de hoje. O contador zera à meia-noite (horário de Brasília).
        </p>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Para montar o plano, enviamos à IA (Google Gemini) o nome e o professor da disciplina, o título, a descrição, o
        prazo e o peso das suas atividades dela, o tempo que você estudou e o texto acima. Não escreva dados pessoais
        nos conteúdos.
      </p>
    </section>
  );
}