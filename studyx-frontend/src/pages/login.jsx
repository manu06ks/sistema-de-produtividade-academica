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

    const endpoint = isLogin ? '/login' : '/cadastro';
    const payload = isLogin ? { email, senha } : { nome, email, senha };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Ocorreu um erro inesperado.');
        return;
      }

      if (isLogin) {
        localStorage.setItem('studyx_token', data.token);
        navigate('/dashboard');
      } else {
        alert('Cadastro realizado! Faça login agora.');
        setIsLogin(true);
        setSenha(''); 
      }
    } catch (error) {
      setErro('Erro de conexão com o servidor.');
    }
  };

  // Cores exatas extraídas do seu protótipo
  const roxoPrincipal = "#c175e7";
  const fundoInput = "#f9edf8";
  const fundoBotao = "#d1e0ec";

  return (
    // Fundo global com a cor exata que você pediu
    <div className="min-h-screen bg-[#d4e2ed] flex flex-col items-center justify-center p-4 font-sans">
      
      {/* Imagem da Logo */}
      <img 
        src="/logo.png" 
        alt="StudyX Logo" 
        className="h-16 md:h-20 mb-8 object-contain"
      />

      {/* Card Branco Seco/Quente */}
      <div className="bg-[#fffdf9] rounded-xl p-8 md:p-10 w-full max-w-[420px] shadow-sm">
        
        <h2 className="text-3xl font-bold mb-6 tracking-tight" style={{ color: roxoPrincipal }}>
          {isLogin ? 'login' : 'cadastro'}
        </h2>

        {erro && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {!isLogin && (
            <input
              type="text"
              placeholder="Seu nome"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={{ backgroundColor: fundoInput, color: roxoPrincipal }}
              className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c175e7]/40 transition-all font-medium placeholder:text-[#c175e7]/60"
            />
          )}

          <input
            type="email"
            placeholder="Seu e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ backgroundColor: fundoInput, color: roxoPrincipal }}
            className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c175e7]/40 transition-all font-medium placeholder:text-[#c175e7]/60"
          />
          
          <input
            type="password"
            placeholder="Sua senha"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={{ backgroundColor: fundoInput, color: roxoPrincipal }}
            className="w-full p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c175e7]/40 transition-all font-medium placeholder:text-[#c175e7]/60"
          />

          <button
            type="submit"
            style={{ backgroundColor: fundoBotao, color: roxoPrincipal }}
            className="w-full font-bold py-4 rounded-full mt-2 hover:brightness-95 transition-all text-lg"
          >
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        {/* Rodapé adaptado do seu protótipo */}
        <div className="mt-6 text-center">
          <p className="text-[10px] md:text-xs font-semibold" style={{ color: roxoPrincipal }}>
            {isLogin ? 'Ao entrar, você concorda com nossos Termos de Uso.' : 'Crie sua conta para organizar seus estudos.'}
            <br/>
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErro('');
              }}
              className="underline mt-1 hover:opacity-70 transition-opacity"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}