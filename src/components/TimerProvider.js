'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useUser } from '@/components/UserProvider';
import {
  ESTADO_VAZIO,
  lerEstadoSalvo,
  congelarAoRestaurar,
  novaSessao,
  pausarFoco,
  retomarFoco,
  iniciarPausa,
  pausarPausa,
  retomarPausa,
  encerrarPausa,
  pausaAcabou,
  estaCorrendo,
  segundosFocados,
  segundosPausaRestante,
} from '@/lib/timer';

const TimerContext = createContext(null);
const PREFIXO = 'unistudy_timer';

function lerLocal(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function escreverLocal(chave, valor) {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch {
    // modo privado ou armazenamento cheio: o timer segue funcionando só na memória
  }
}

const POST_JSON = { 'Content-Type': 'application/json' };

export function TimerProvider({ children }) {
  const usuario = useUser();
  const usuarioId = usuario?.id_usuario ?? null;

  const [estado, setEstado] = useState(ESTADO_VAZIO);
  const [agora, setAgora] = useState(null); // só muda em callbacks, nunca na renderização
  const [pronto, setPronto] = useState(false);
  const [aviso, setAviso] = useState(null);

  // Cópias "sempre atuais" para os callbacks (evita ler estado velho).
  const estadoRef = useRef(ESTADO_VAZIO);
  const chaveRef = useRef(null);

  // Única porta de entrada para mudar o estado: memória, tela e localStorage.
  const definir = useCallback((novo, { gravar = true } = {}) => {
    estadoRef.current = novo;
    setEstado(novo);
    if (gravar && chaveRef.current) {
      escreverLocal(chaveRef.current, novo.sessaoId ? JSON.stringify(novo) : null);
      if (!novo.sessaoId) escreverLocal(`${chaveRef.current}:visto`, null);
    }
  }, []);

  // 1) Ao abrir a página: restaura o que estava salvo (parado) e confere com o servidor.
  useEffect(() => {
    if (!usuarioId) return;
    const chave = `${PREFIXO}:${usuarioId}`;
    chaveRef.current = chave;
    let ativo = true;

    (async () => {
      const salvo = lerEstadoSalvo(lerLocal(chave));
      const brutoVisto = lerLocal(`${chave}:visto`);
      const visto = brutoVisto === null ? undefined : Number(brutoVisto);

      let inicial = salvo ? congelarAoRestaurar(salvo, visto) : ESTADO_VAZIO;
      let novoAviso = null;

      // O servidor sabe se a sessão ainda existe (pode ter sido descartada em
      // outro aparelho, ou passado de 6 horas).
      if (inicial.sessaoId) {
        try {
          const r = await fetch('/api/sessoes/atual');
          if (r.ok) {
            const { sessao } = await r.json();
            if (!sessao || sessao.id !== inicial.sessaoId) {
              inicial = ESTADO_VAZIO;
              novoAviso =
                'Seu timer anterior foi encerrado (iniciado em outro lugar ou parado por mais de 6 horas).';
            }
          }
        } catch {
          // sem rede: mantém o que está salvo
        }
      }

      if (!ativo) return;
      definir(inicial);
      setAviso(novoAviso);
      setPronto(true);
    })();

    return () => {
      ativo = false;
    };
  }, [usuarioId, definir]);

  // 2) Outra aba mudou o timer: acompanha (sem gravar de volta).
  useEffect(() => {
    if (!usuarioId) return;
    const chave = `${PREFIXO}:${usuarioId}`;

    function aoMudar(e) {
      if (e.key !== chave) return;
      definir(lerEstadoSalvo(e.newValue) ?? ESTADO_VAZIO, { gravar: false });
      setAgora(Date.now());
    }

    window.addEventListener('storage', aoMudar);
    return () => window.removeEventListener('storage', aoMudar);
  }, [usuarioId, definir]);

  // 3) Relógio: só gira enquanto algo está correndo.
  const correndo = estaCorrendo(estado);
  useEffect(() => {
    if (!correndo) return;

    const id = setInterval(() => {
      const t = Date.now();
      setAgora(t);
      // "visto vivo": se a página fechar, o tempo vale até aqui.
      if (chaveRef.current) escreverLocal(`${chaveRef.current}:visto`, String(t));

      if (pausaAcabou(estadoRef.current, t)) {
        definir(encerrarPausa(estadoRef.current));
        setAviso('Pausa terminada! Hora de voltar ao foco.');
      }
    }, 500);

    return () => clearInterval(id);
  }, [correndo, definir]);

  // 4) Ao esconder/fechar a página, marca o último instante em que ela esteve viva
  //    (abas em segundo plano têm os temporizadores desacelerados).
  useEffect(() => {
    function marcar() {
      if (chaveRef.current && estaCorrendo(estadoRef.current)) {
        escreverLocal(`${chaveRef.current}:visto`, String(Date.now()));
      }
    }
    function aoMudarVisibilidade() {
      if (document.visibilityState === 'hidden') marcar();
    }

    window.addEventListener('pagehide', marcar);
    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    return () => {
      window.removeEventListener('pagehide', marcar);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    };
  }, []);

  // ---------- ações ----------

  const aplicar = useCallback(
    (transicao) => {
      const t = Date.now();
      setAgora(t);
      definir(transicao(estadoRef.current, t));
    },
    [definir]
  );

  const iniciar = useCallback(
    async (atividade) => {
      if (estadoRef.current.sessaoId) {
        return { ok: false, erro: 'Já existe um timer em andamento.' };
      }
      try {
        const r = await fetch('/api/sessoes', {
          method: 'POST',
          headers: POST_JSON,
          body: JSON.stringify({ atividade_id: atividade.id }),
        });
        const dados = await r.json().catch(() => ({}));
        if (!r.ok) return { ok: false, erro: dados.erro || 'Não foi possível iniciar o timer.' };

        const t = Date.now();
        setAgora(t);
        setAviso(null);
        definir(
          novaSessao(
            {
              sessaoId: dados.id,
              atividadeId: atividade.id,
              titulo: atividade.titulo,
              disciplinaNome: atividade.disciplina_nome,
              disciplinaCor: atividade.disciplina_cor,
            },
            t
          )
        );
        // O quadro de atividades se atualiza sozinho (a atividade foi para "Fazendo").
        if (dados.moveu_para_fazendo) window.dispatchEvent(new Event('unistudy:atividades'));
        return { ok: true };
      } catch {
        return { ok: false, erro: 'Erro de conexão. Tente novamente.' };
      }
    },
    [definir]
  );

  const salvar = useCallback(async () => {
    const e = estadoRef.current;
    if (!e.sessaoId) return { ok: false, erro: 'Nenhum timer em andamento.' };

    const segundos = segundosFocados(e, Date.now());
    try {
      const r = await fetch(`/api/sessoes/${e.sessaoId}/finalizar`, {
        method: 'POST',
        headers: POST_JSON,
        body: JSON.stringify({ segundos }),
      });
      const dados = await r.json().catch(() => ({}));

      if (r.status === 404) {
        definir(ESTADO_VAZIO);
        return { ok: false, erro: 'Esta sessão já não existe mais no servidor.' };
      }
      if (!r.ok) return { ok: false, erro: dados.erro || 'Não foi possível salvar a sessão.' };

      definir(ESTADO_VAZIO);
      return { ok: true, gravada: dados.gravada, minutos: dados.minutos };
    } catch {
      return { ok: false, erro: 'Erro de conexão. O tempo continua guardado: tente salvar de novo.' };
    }
  }, [definir]);

  const descartar = useCallback(async () => {
    const e = estadoRef.current;
    if (!e.sessaoId) return { ok: true };
    try {
      const r = await fetch(`/api/sessoes/${e.sessaoId}`, { method: 'DELETE' });
      if (!r.ok && r.status !== 404) {
        return { ok: false, erro: 'Não foi possível descartar. Tente novamente.' };
      }
    } catch {
      return { ok: false, erro: 'Erro de conexão. Tente novamente.' };
    }
    definir(ESTADO_VAZIO);
    return { ok: true };
  }, [definir]);

  const valor = {
    pronto,
    estado,
    segundosFoco: segundosFocados(estado, agora),
    segundosDescanso: segundosPausaRestante(estado, agora),
    aviso,
    limparAviso: () => setAviso(null),
    iniciar,
    salvar,
    descartar,
    pausar: () => aplicar(pausarFoco),
    retomar: () => aplicar(retomarFoco),
    comecarDescanso: (minutos) => aplicar((e, t) => iniciarPausa(e, minutos, t)),
    pausarDescanso: () => aplicar(pausarPausa),
    retomarDescanso: () => aplicar(retomarPausa),
    encerrarDescanso: () => aplicar((e) => encerrarPausa(e)),
  };

  return <TimerContext.Provider value={valor}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer precisa estar dentro do TimerProvider.');
  return ctx;
}