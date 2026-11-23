'use client';

import { BarChart3, Database, ExternalLink, ListChecks, Sparkles } from 'lucide-react';
import { classeCartao } from './api';

export const OPCOES = [
  {
    id: 'banco',
    numero: 1,
    titulo: 'Banco de dados',
    texto: 'Criar as tabelas a partir de um banco vazio, carregar os dados de demonstração e eliminar todas as tabelas.',
    icone: Database,
  },
  {
    id: 'tabelas',
    numero: 2,
    titulo: 'Tabelas (CRUD)',
    texto: 'Inserir, alterar, excluir e consultar registros em cada uma das 13 tabelas, respeitando as dependências.',
    icone: ListChecks,
  },
  {
    id: 'consultas',
    numero: 3,
    titulo: 'Consultas',
    texto: 'Executar as 3 consultas do relatório e ver o resultado em tabela e em gráfico.',
    icone: BarChart3,
  },
  {
    id: 'ia',
    numero: 4,
    titulo: 'IA generativa',
    texto: 'Gerar um plano de estudos com o Gemini e acompanhar os tokens e o custo de cada chamada.',
    icone: Sparkles,
  },
];

export default function MenuPrincipal({ status, demo, aoEscolher }) {
  const banco = status?.banco;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Menu principal</h2>
        <p className="mt-1 text-sm text-muted-foreground">Escolha uma opção para demonstrar as operações no banco de dados.</p>
      </div>

      <section className={`${classeCartao} flex flex-wrap items-center gap-x-8 gap-y-2 text-sm`}>
        <span>
          <span className="text-muted-foreground">Banco: </span>
          <strong className="text-foreground">
            {!banco ? 'sem conexão' : banco.banco === 'vazio' ? 'vazio (sem tabelas)' : banco.banco}
          </strong>
        </span>
        {banco && (
          <>
            <span>
              <span className="text-muted-foreground">Tabelas: </span>
              <strong className="tabular-nums text-foreground">
                {banco.criadas}/{banco.total}
              </strong>
            </span>
            <span>
              <span className="text-muted-foreground">Registros: </span>
              <strong className="tabular-nums text-foreground">{banco.totalLinhas}</strong>
            </span>
          </>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {OPCOES.map((o) => {
          const Icone = o.icone;
          return (
            <button
              key={o.id}
              onClick={() => aoEscolher(o.id)}
              className="group rounded-3xl border border-border bg-card p-6 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  {o.numero}
                </span>
                <span className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Icone className="h-4 w-4 text-primary" aria-hidden="true" />
                  {o.titulo}
                </span>
              </span>
              <span className="mt-3 block text-sm text-muted-foreground">{o.texto}</span>
            </button>
          );
        })}
      </div>

      <section className={`${classeCartao} text-sm`}>
        <h3 className="mb-1 font-bold text-foreground">Usar o sistema</h3>
        <p className="text-muted-foreground">
          Depois de carregar os dados, entre no sistema com <strong className="text-foreground">{demo?.email}</strong> e
          senha <strong className="text-foreground">{demo?.senha}</strong>.{' '}
          <a href="/" className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-2 hover:underline">
            Abrir o sistema <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </p>
      </section>
    </div>
  );
}
