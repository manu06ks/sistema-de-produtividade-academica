'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Inbox, Library, ListTodo } from 'lucide-react';
import IconeArquivo from '@/components/IconeArquivo';
import { dataCurta, formatarTamanho } from '@/lib/anexos';
import { diasAte, formatarDiaMes, hojeLocal } from '@/lib/datas';

// Busca uma lista na API. "preparar" tem de ser uma função declarada fora do
// componente, para não mudar a cada renderização.
function useLista(url, preparar) {
  const [estado, setEstado] = useState({ dados: null, erro: false }); // dados null = carregando
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error('falha');
        const dados = preparar(await r.json());
        if (ativo) setEstado({ dados, erro: false });
      } catch {
        if (ativo) setEstado({ dados: null, erro: true });
      }
    })();

    return () => {
      ativo = false;
    };
  }, [url, preparar, tentativa]);

  function recarregar() {
    setEstado({ dados: null, erro: false });
    setTentativa((n) => n + 1);
  }

  return { ...estado, recarregar };
}

// O "hoje" é lido aqui, num callback, e não durante a renderização.
const prepararAtividades = (lista) => ({ lista, hoje: hojeLocal() });
const prepararMateriais = (lista) => lista;

const CORES_PRAZO = {
  atrasado: 'text-destructive',
  urgente: 'text-orange-600',
  normal: 'text-muted-foreground',
};

function prazoDaAtividade(a, hoje) {
  if (!a.data_vencimento) return { texto: 'Sem data de entrega', situacao: 'normal' };
  const dias = diasAte(a.data_vencimento, hoje);
  const dia = formatarDiaMes(a.data_vencimento);
  if (dias < 0) return { texto: `Atrasada desde ${dia}`, situacao: 'atrasado' };
  if (dias === 0) return { texto: 'Entrega hoje', situacao: 'urgente' };
  if (dias === 1) return { texto: 'Entrega amanhã', situacao: 'urgente' };
  return { texto: `Entrega em ${dia}`, situacao: dias <= 2 ? 'urgente' : 'normal' };
}

function Cabecalho({ Icone, titulo, quantidade }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-foreground">
      <Icone className="h-3.5 w-3.5 text-primary" /> {titulo}
      {quantidade !== null && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full border border-border/50 bg-card px-1.5 text-[11px] font-bold text-muted-foreground">
          {quantidade}
        </span>
      )}
    </h3>
  );
}

function Vazio({ children }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">
      <Inbox className="h-5 w-5" />
      {children}
    </div>
  );
}

function Falha({ texto, onTentar }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-medium text-destructive">
      {texto}
      <button
        type="button"
        onClick={onTentar}
        className="rounded-lg bg-destructive/10 px-3 py-1 font-semibold hover:bg-destructive/20"
      >
        Tentar de novo
      </button>
    </div>
  );
}

// As tarefas em aberto e os arquivos da biblioteca de uma disciplina.
// onAbrirAtividade é opcional: com ele, clicar numa tarefa abre os detalhes dela.
export default function DisciplinaRelacionados({ disciplinaId, onAbrirAtividade }) {
  const tarefasApi = useLista('/api/atividades', prepararAtividades);
  const arquivosApi = useLista(`/api/materiais?disciplina_id=${disciplinaId}`, prepararMateriais);

  // A API devolve as atividades de todas as disciplinas: aqui ficam só as desta
  // que ainda não foram concluídas (já na ordem da data de entrega).
  const tarefas = tarefasApi.dados
    ? tarefasApi.dados.lista.filter(
        (a) => a.disciplina_id === Number(disciplinaId) && a.status !== 'Concluído'
      )
    : null;
  const arquivos = arquivosApi.dados;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      <section aria-label="Tarefas em aberto" className="min-w-0">
        <Cabecalho Icone={ListTodo} titulo="Tarefas em aberto" quantidade={tarefas ? tarefas.length : null} />

        {tarefasApi.erro ? (
          <Falha texto="Não foi possível carregar as tarefas." onTentar={tarefasApi.recarregar} />
        ) : tarefas === null ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Carregando...</p>
        ) : tarefas.length === 0 ? (
          <Vazio>Nenhuma tarefa em aberto nesta disciplina.</Vazio>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {tarefas.map((a) => {
              const prazo = prazoDaAtividade(a, tarefasApi.dados.hoje);
              const conteudo = (
                <>
                  <span className="block truncate text-sm font-semibold text-foreground" title={a.titulo}>
                    {a.titulo}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px]">
                    <span className="font-bold text-foreground">{a.tipo_atividade}</span>
                    <span className="text-muted-foreground">• {a.status}</span>
                    <span className={`font-semibold ${CORES_PRAZO[prazo.situacao]}`}>• {prazo.texto}</span>
                  </span>
                </>
              );
              return (
                <li key={a.id}>
                  {onAbrirAtividade ? (
                    <button
                      type="button"
                      onClick={() => onAbrirAtividade(a)}
                      className="block w-full rounded-xl border border-border/50 bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/60"
                    >
                      {conteudo}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">{conteudo}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="Biblioteca da disciplina" className="min-w-0">
        <Cabecalho Icone={Library} titulo="Biblioteca" quantidade={arquivos ? arquivos.length : null} />

        {arquivosApi.erro ? (
          <Falha texto="Não foi possível carregar a biblioteca." onTentar={arquivosApi.recarregar} />
        ) : arquivos === null ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Carregando...</p>
        ) : arquivos.length === 0 ? (
          <Vazio>Nenhum arquivo na biblioteca desta disciplina.</Vazio>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {arquivos.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-secondary/30 p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground">
                  <IconeArquivo tipo={item.tipo} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground" title={item.nome}>
                    {item.nome}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {item.tipo} • {formatarTamanho(item.tamanho_kb)} • {item.eh_meu ? 'Você' : item.autor_nome} •{' '}
                    {dataCurta(item.data_upload)}
                  </p>
                </div>
                <a
                  href={`/api/materiais/${item.id}/baixar`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir ${item.nome}`}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}