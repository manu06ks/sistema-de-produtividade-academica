// Chamadas ao /api/admin: sempre levam a senha do painel no cabeçalho x-admin-senha.
export function criarApi(senha) {
  return async function api(caminho, { metodo = 'GET', corpo } = {}) {
    const resposta = await fetch(`/api/admin${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', 'x-admin-senha': senha ?? '' },
      body: corpo ? JSON.stringify(corpo) : undefined,
      cache: 'no-store',
    });
    let dados = null;
    try {
      dados = await resposta.json();
    } catch {
      /* resposta sem corpo */
    }
    if (!resposta.ok) {
      const erro = new Error(dados?.erro ?? `Erro ${resposta.status} ao falar com o servidor.`);
      erro.status = resposta.status;
      throw erro;
    }
    return dados;
  };
}

export const classeBotao =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';
export const botaoPrimario = `${classeBotao} bg-primary text-primary-foreground hover:bg-primary/90`;
export const botaoSecundario = `${classeBotao} border border-border bg-card text-foreground hover:bg-accent`;
export const botaoPerigo = `${classeBotao} bg-destructive text-white hover:bg-destructive/90`;
export const classeCampo =
  'w-full rounded-xl border border-transparent bg-input/50 px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60';
export const classeCartao = 'rounded-3xl border border-border bg-card p-6 shadow-sm';

// fixo=true mantém as casas (7,0 em vez de 7), como nos resultados do relatório.
export function formatarNumero(n, casas = 1, fixo = false) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: fixo ? casas : 0, maximumFractionDigits: casas });
}
