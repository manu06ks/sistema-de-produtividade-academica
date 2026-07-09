import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    
    const url = isLogin 
      ? `${import.meta.env.VITE_API_URL}/login` 
      : `${import.meta.env.VITE_API_URL}/cadastro`;
      
    const corpo = isLogin ? { email, senha } : { nome, email, senha };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro);
        return;
      }

      if (isLogin) {
        localStorage.setItem('UniStudy_token', data.token);
        navigate('/Dashboard');
      } else {
        // Se cadastrou com sucesso, muda para a tela de login
        setIsLogin(true);
        setErro('Cadastro realizado! Faça login agora.');
      }
    } catch (err) {
      setErro('Erro de conexão. Tente novamente.');
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-accent via-background to-secondary px-4 py-10 font-sans">
      {/* Brilho decorativo sutil */}
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
            <div className={`p-3 rounded-lg mb-6 text-sm text-center font-medium ${erro.includes('sucesso') || erro.includes('realizado') ? 'bg-green-50 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground/80 pl-1">Nome completo</label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-input/50 text-foreground border-transparent focus:bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground/80 pl-1">E-mail</label>
              <input
                type="email"
                placeholder="Seu e-mail acadêmico"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-input/50 text-foreground border-transparent focus:bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-foreground/80 pl-1">Senha</label>
              <input
                type="password"
                placeholder=""
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-input/50 text-foreground border-transparent focus:bg-background focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground"
              />
            </div>

            <button
              type="submit"
              className="w-full font-bold py-4 rounded-xl mt-4 bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all text-base shadow-md shadow-primary/20"
            >
              {isLogin ? 'Entrar na Plataforma' : 'Criar minha conta'}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-border/50 pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              {isLogin ? 'Novo por aqui?' : 'Já possui uma conta?'}
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErro('');
                  setNome('');
                  setSenha('');
                }}
                className="ml-2 font-bold text-primary hover:underline transition-all"
              >
                {isLogin ? 'Cadastre-se grátis' : 'Faça login'}
              </button>
            </p>
          </div>

        </div>

        <p className="mt-8 text-xs font-medium text-muted-foreground">
          © {new Date().getFullYear()} UniStudy. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}