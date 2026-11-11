import { Suspense } from 'react';
import GrupoDetalhe from '@/components/GrupoDetalhe';

// Esta página é um componente de servidor. No Next 16, "params" é uma Promise
// que só se resolve na hora do pedido. Por isso o "await" fica num componente
// de dentro do <Suspense>: o resto da página (o fallback) já sai pronto.
export default function GrupoPage({ params }) {
  return (
    <Suspense
      fallback={<p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>}
    >
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }) {
  const { id } = await params;
  // O key faz o React começar do zero se você for de um grupo direto para outro.
  return <GrupoDetalhe key={id} grupoId={id} />;
}