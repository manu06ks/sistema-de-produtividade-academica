'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Home, Loader2, LogOut } from 'lucide-react';
import MenuPrincipal, { OPCOES } from './MenuPrincipal';
import PainelBanco from './PainelBanco';
import PainelTabelas from './PainelTabelas';
import PainelConsultas from './PainelConsultas';
import PainelIA from './PainelIA';
import { botaoPrimario, classeCampo, classeCartao, criarApi } from './api';

const CHAVE_SENHA = 'unistudy_admin_senha';

function lerSenhaGuardada() {
  try {
    return window.sessionStorage.getItem(CHAVE_SENHA) ?? '';
  } catch {
    return '';
  }
}
function guardarSenha(senha) {
  try {
    if (senha) window.sessionStorage.setItem(CHAVE_SENHA, senha);
    else window.sessionStorage.removeItem(CHAVE_SENHA);
  } catch {
    /* sem armazenamento: só não lembra a senha */
  }
}

export default function AdminApp() {
  const [senha, setSenha] = useState('');
  const [acesso, setAcesso] = useState('verificando'); // verificando | login | desativado | ok
  const [erroLogin, setErroLogin] = useState('');
  const [status, setStatus] = useState(null);
  const [demo, setDemo] = useState(null);
  const [erroBanco, setErroBanco] = useState('');
  const [aba, setAba] = useState('menu');
  const [campoSenha, setCampoSenha] = useState('');
  const [pronto, setPronto] = useState(false);

  const api = useMemo(() => criarApi(senha), [senha]);

  const atualizarStatus = useCallback(async () => {
    try {
      const r = await api('/status');
      setStatus(r);
      setDemo(r.demo);
      setErroBanco('');
      setAcesso('ok');
    } catch (e) {
      if (e.status === 401) {
        setAcesso('login');
        if (senha) setErroLogin('Senha incorreta.');
      } else if (e.status === 503 && /desativado/i.test(e.message)) {
        setAcesso('desativado');
      } else {
        // senha aceita, mas o banco não respondeu: o painel abre para mostrar o problema
        setErroBanco(e.message);
        setStatus(null);
        setAcesso('ok');
      }
    }
  }, [api, senha]);

  // Na primeira carga, tenta com a senha guardada na sessão do navegador.
  useEffect(() => {
    setSenha(lerSenhaGuardada());
    setPronto(true);
  }, []);
  useEffect(() => {
    if (pronto) atualizarStatus();
  }, [pronto, atualizarStatus]);

  function entrar(e) {
    e.preventDefault();
    setErroLogin('');
    guardarSenha(campoSenha);
    setSenha(campoSenha);
  }
  function sair() {
    guardarSenha('');
    setSenha('');
    setCampoSenha('');
    setStatus(null);
    setAcesso('login');
  }

  if (acesso === 'verificando') {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Verificando acesso...
      </main>
    );
  }

  if (acesso === 'desativado' || acesso === 'login') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-accent via-background to-secondary p-4">
        <div className={`${classeCartao} w-full max-w-sm`}>
          <h1 className="text-xl font-bold text-foreground">UniStudy · Administração</h1>
          {acesso === 'desativado' ? (
            <p role="alert" className="mt-3 text-sm text-muted-foreground">
              O painel está desativado neste servidor. Defina a variável de ambiente <code className="font-mono">ADMIN_SENHA</code> e
              reinicie a aplicação para habilitá-lo.
            </p>
          ) : (
            <form onSubmit={entrar} className="mt-4 space-y-4">
              <div>
                <label htmlFor="admin-senha" className="mb-1 block text-xs font-semibold text-foreground/80">
                  Senha do painel
                </label>
                <input
                  id="admin-senha"
                  type="password"
                  autoFocus
                  required
                  autoComplete="current-password"
                  className={classeCampo}
                  value={campoSenha}
                  onChange={(e) => setCampoSenha(e.target.value)}
                />
                {erroLogin && (
                  <p role="alert" className="mt-2 text-sm font-medium text-destructive">
                    {erroLogin}
                  </p>
                )}
              </div>
              <button type="submit" className={`${botaoPrimario} w-full`}>
                Entrar
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  const itens = [{ id: 'menu', titulo: 'Menu principal', icone: Home }, ...OPCOES.map((o) => ({ id: o.id, titulo: o.titulo, icone: o.icone, numero: o.numero }))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent via-background to-secondary p-4 font-sans text-foreground md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">UniStudy · Administração do banco de dados</h1>
            <p className="text-sm text-muted-foreground">Banco de Dados I (DEC7129) · demonstração dos itens 7a a 7f</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <a href="/" className="font-semibold text-primary underline-offset-2 hover:underline">
              Voltar ao sistema
            </a>
            <button
              onClick={sair}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-accent"
              title="Sair do painel"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
            </button>
          </div>
        </header>

        {erroBanco && (
          <p role="alert" className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {erroBanco}
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
          <nav aria-label="Menu do painel" className="h-fit rounded-3xl border border-border bg-card p-3">
            <ul className="space-y-1">
              {itens.map((i) => {
                const Icone = i.icone;
                return (
                  <li key={i.id}>
                    <button
                      onClick={() => setAba(i.id)}
                      aria-current={aba === i.id ? 'page' : undefined}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                        aba === i.id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icone className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {i.numero ? `${i.numero} · ` : ''}
                      {i.titulo}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <main className="min-w-0">
            {aba === 'menu' && <MenuPrincipal status={status} demo={demo} aoEscolher={setAba} />}
            {aba === 'banco' && <PainelBanco api={api} status={status} demo={demo} aoAtualizar={atualizarStatus} />}
            {aba === 'tabelas' && <PainelTabelas api={api} aoAtualizar={atualizarStatus} />}
            {aba === 'consultas' && <PainelConsultas api={api} />}
            {aba === 'ia' && <PainelIA api={api} demo={demo} />}
          </main>
        </div>
      </div>
    </div>
  );
}
