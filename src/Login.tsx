import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { SamuLogo } from './components/SamuLogo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Email ou senha incorretos. Se você ainda não tem uma conta, por favor cadastre-se primeiro.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O login com email e senha não está habilitado neste projeto Firebase. Por favor, habilite-o no console do Firebase (Authentication > Sign-in method).');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas de login. Por favor, tente novamente mais tarde.');
      } else {
        setError('Falha ao fazer login. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200 mb-6 border border-slate-50">
            <SamuLogo className="h-24 w-24 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-samu-blue tracking-tighter uppercase">SAMU 192</h1>
          <h2 className="text-xs font-black text-samu-orange tracking-[0.3em] uppercase">Serra Talhada • PE</h2>
        </div>
        <h3 className="mt-8 text-center text-2xl font-black text-samu-blue uppercase tracking-tighter">
          Acesso Restrito
        </h3>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium tracking-tight">
          Ou{' '}
          <Link to="/signup" className="font-bold text-samu-orange hover:text-samu-orange-light transition-colors underline underline-offset-4 decoration-2">
            cadastre-se como novo funcionário
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-2xl shadow-slate-200 sm:rounded-[2.5rem] border border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-samu-red via-samu-orange to-samu-blue"></div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl text-xs font-bold flex items-start">
                <span className="mr-2">⚠️</span>
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço de Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange transition-all placeholder:text-slate-300"
                placeholder="nome@samu.gov.br"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange transition-all placeholder:text-slate-300 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-samu-orange transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-5 px-4 border border-transparent rounded-2xl shadow-xl shadow-samu-orange/20 text-xs font-black uppercase tracking-[0.2em] text-white bg-samu-orange hover:bg-samu-orange-light focus:outline-none focus:ring-4 focus:ring-samu-orange/20 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? 'Validando Credenciais...' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Tecnologia SAMU 192</p>
        </div>
      </div>
    </div>
  );
};
