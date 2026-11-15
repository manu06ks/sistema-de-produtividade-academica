'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const inputClass =
  'w-full p-3.5 rounded-xl bg-input/50 text-foreground border-transparent focus:bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground';

const labelClass = 'text-sm font-semibold text-foreground/80 pl-1';

// Valores especiais dos <select> (os ids de verdade são sempre números)
const NOVA_INSTITUICAO = 'nova';
const NOVO_CURSO = 'novo';

const rotuloInstituicao = (i) => (i.sigla ? `${i.sigla} — ${i.nome}` : i.nome);

export default function LoginPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [instituicoes, setInstituicoes] = useState([]);
  const [falhaNaLista, setFalhaNaLista] = useState(false);
  const [instituicaoSel, setInstituicaoSel] = useState(''); // '' | id | NOVA_INSTITUICAO
  const [novaInstituicaoNome, setNovaInstituicaoNome] = useState('');
  const [novaInstituicaoSigla, setNovaInstituicaoSigla] = useState('');
  const [cursoSel, setCursoSel] = useState(''); // '' | id | NOVO_CURSO
  const [novoCursoNome, setNovoCursoNome] = useState('');

  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregarInstituicoes = useCallback(() => {
    return fetch('/api/instituicoes')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('lista'))))
      .then((lista) => {
        setInstituicoes(lista);
        setFalhaNaLista(false);
      })
      .catch(() => {
        setFalhaNaLista(true); // se já havia uma lista, ela continua na tela
      });
  }, []);

  useEffect(() => {
    carregarInstituicoes();
  }, [carregarInstituicoes]);

  // O que a pessoa está fazendo com instituição e curso
  const instituicao = instituicoes.find((i) => String(i.id_instituicao) === instituicaoSel);
  const instituicaoNova = instituicaoSel === NOVA_INSTITUICAO;
  const cursosDaInstituicao = instituicao ? instituicao.cursos : [];
  const temListaDeCursos = cursosDaInstituicao.length > 0;
  // Digita o nome do curso quando: a instituição é nova, ainda não tem cursos, ou a pessoa escolheu "não está na lista"
  const digitaCurso = instituicaoNova || (instituicao && (!temListaDeCursos || cursoSel === NOVO_CURSO));

  const escolherInstituicao = (valor) => {
    setInstituicaoSel(valor);
    setCursoSel('');
    setNovoCursoNome('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setAviso('');
    setEnviando(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    let corpo;
    if (isLogin) {
      corpo = { email, senha };
    } else if (instituicaoNova) {
      corpo = {
        nome,
        email,
        senha,
        novaInstituicao: { nome: novaInstituicaoNome, sigla: novaInstituicaoSigla },
        novoCurso: novoCursoNome,
      };
    } else if (digitaCurso) {
      corpo = { nome, email, senha, instituicaoId: Number(instituicaoSel), novoCurso: novoCursoNome };
    } else {
      corpo = { nome, email, senha, cursoId: Number(cursoSel) };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Algo deu errado. Tente novamente.');
        return;
      }

      if (isLogin) {
        router.push('/dashboard');
      } else {
        setIsLogin(true);
        setSenha('');
        setAviso(
          data.instituicao_criada
            ? 'Cadastro realizado! Sua instituição e seu curso foram adicionados à lista. Faça login agora.'
            : data.curso_criado
            ? 'Cadastro realizado! Seu curso foi adicionado à lista. Faça login agora.'
            : 'Cadastro realizado! Faça login agora.'
        );
        // Limpa a escolha e recarrega a lista, que agora pode ter itens novos
        escolherInstituicao('');
        setNovaInstituicaoNome('');
        setNovaInstituicaoSigla('');
        carregarInstituicoes();
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const alternarModo = () => {
    setIsLogin(!isLogin);
    setErro('');
    setAviso('');
    setNome('');
    setSenha('');
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-accent via-background to-secondary px-4 py-10 font-sans">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        <img
          src="/logo.png"
          alt="UniStudy Logo"
          className="mb-8 h-16 object-contain md:h-20"
        />

        <div className="w-full rounded-3xl border border-border/70 bg-card/80 p-8 shadow-xl shadow-primary/5 backdrop-blur-xl md:p-10">
          <h2 className="text-3xl font-bold mb-6 tracking-tight text-primary text-center">
            {isLogin ? 'Login' : 'Cadastro'}
          </h2>

          {erro && (
            <div role="alert" className="p-3 rounded-lg mb-6 text-sm text-center font-medium bg-destructive/10 text-destructive">
              {erro}
            </div>
          )}
          {aviso && (
            <div role="status" className="p-3 rounded-lg mb-6 text-sm text-center font-medium bg-green-50 text-green-600">
              {aviso}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="nome" className={labelClass}>Nome completo</label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  required
                  maxLength={150}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className={labelClass}>E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="Seu e-mail acadêmico"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            {!isLogin && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="instituicao" className={labelClass}>Instituição</label>
                  <select
                    id="instituicao"
                    required
                    value={instituicaoSel}
                    onChange={(e) => escolherInstituicao(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecione sua instituição...</option>
                    {instituicoes.map((i) => (
                      <option key={i.id_instituicao} value={i.id_instituicao}>
                        {rotuloInstituicao(i)}
                      </option>
                    ))}
                    <option value={NOVA_INSTITUICAO}>Minha instituição não está na lista</option>
                  </select>
                  {falhaNaLista && (
                    <p className="text-xs text-destructive pl-1">
                      Não foi possível carregar a lista de instituições.{' '}
                      <button
                        type="button"
                        onClick={carregarInstituicoes}
                        className="font-bold underline"
                      >
                        Tentar de novo
                      </button>
                    </p>
                  )}
                </div>

                {instituicaoNova && (
                  <div className="flex flex-col gap-5 border-l-2 border-primary/30 pl-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="nova-instituicao-nome" className={labelClass}>Nome da instituição</label>
                      <input
                        id="nova-instituicao-nome"
                        type="text"
                        placeholder="Nome completo da instituição"
                        required
                        maxLength={150}
                        value={novaInstituicaoNome}
                        onChange={(e) => setNovaInstituicaoNome(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="nova-instituicao-sigla" className={labelClass}>Sigla (opcional)</label>
                      <input
                        id="nova-instituicao-sigla"
                        type="text"
                        placeholder="Ex.: UNESC"
                        maxLength={20}
                        value={novaInstituicaoSigla}
                        onChange={(e) => setNovaInstituicaoSigla(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="curso" className={labelClass}>Curso</label>
                  {!instituicaoSel && (
                    <select id="curso" disabled value="" className={`${inputClass} opacity-60`}>
                      <option value="">Escolha a instituição primeiro</option>
                    </select>
                  )}
                  {temListaDeCursos && (
                    <select
                      id="curso"
                      required
                      value={cursoSel}
                      onChange={(e) => setCursoSel(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Selecione seu curso...</option>
                      {cursosDaInstituicao.map((c) => (
                        <option key={c.id_curso} value={c.id_curso}>
                          {c.nome}
                        </option>
                      ))}
                      <option value={NOVO_CURSO}>Meu curso não está na lista</option>
                    </select>
                  )}
                  {digitaCurso && (
                    <input
                      id={temListaDeCursos ? 'novo-curso' : 'curso'}
                      type="text"
                      aria-label="Nome do curso"
                      placeholder="Nome do seu curso"
                      required
                      maxLength={100}
                      value={novoCursoNome}
                      onChange={(e) => setNovoCursoNome(e.target.value)}
                      className={inputClass}
                    />
                  )}
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="senha" className={labelClass}>Senha</label>
              <input
                id="senha"
                type="password"
                required
                minLength={isLogin ? undefined : 8}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className={inputClass}
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground pl-1">Mínimo de 8 caracteres.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full font-bold py-4 rounded-xl mt-4 bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all text-base shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {enviando
                ? 'Aguarde...'
                : isLogin
                ? 'Entrar na Plataforma'
                : 'Criar minha conta'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-border/50 pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              {isLogin ? 'Novo por aqui?' : 'Já possui uma conta?'}
              <button
                type="button"
                onClick={alternarModo}
                className="ml-2 font-bold text-primary hover:underline transition-all"
              >
                {isLogin ? 'Cadastre-se grátis' : 'Faça login'}
              </button>
            </p>
          </div>
        </div>

        <p className="mt-8 text-xs font-medium text-muted-foreground">
          © UniStudy. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}