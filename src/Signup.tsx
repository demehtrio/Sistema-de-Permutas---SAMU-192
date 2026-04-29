import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { SamuLogo } from './components/SamuLogo';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cargo, setCargo] = useState('');
  const [base, setBase] = useState('');
  const [cpf, setCpf] = useState('');
  const [coren, setCoren] = useState('');
  const [role, setRole] = useState<'servidor' | 'coordenacao'>('servidor');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const SAMU_ROLES = [
    "Médico(a)",
    "Enfermeiro(a)",
    "Técnico(a) de Enfermagem",
    "Condutor(a) Socorrista",
    "TARM",
    "Rádio Operador(a)",
    "Coordenador(a) / Administrativo"
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    const trimmedCpf = cpf.trim();
    const trimmedCoren = coren.trim();
    const trimmedBase = base.trim();

    try {
      let currentUser = auth.currentUser;

      // If user is not logged in as the intended email, try to create or login
      if (!currentUser || currentUser.email !== trimmedEmail) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          currentUser = userCredential.user;
        } catch (err: any) {
          // If email is already in use, we try to log in to complete the profile
          if (err.code === 'auth/email-already-in-use') {
            setError('Este email já está cadastrado. Se você já tem uma conta mas seu perfil está incompleto, faça login primeiro e o sistema o guiará.');
            setLoading(false);
            return;
          }
          throw err;
        }
      }

      if (!currentUser) throw new Error('Falha na autenticação');
      
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        name: trimmedName,
        email: trimmedEmail,
        role,
        cargo,
        base: trimmedBase,
        cpf: trimmedCpf,
        matricula: trimmedCoren,
        coren: trimmedCoren,
        createdAt: new Date().toISOString()
      });

      setSuccess('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error("Signup error:", err);
      
      // If it's a permission error or similar from Firestore
      if (err.message && (err.message.includes('permission-denied') || err.message.includes('Missing or insufficient permissions'))) {
        try {
          handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}`);
        } catch (fError) {
          // fError is the stringified JSON from handleFirestoreError
          setError('Erro de permissão ao salvar perfil. Por favor, contate a coordenação.');
        }
        setLoading(false);
        return;
      }

      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está cadastrado. Se você já tem uma conta mas seu perfil está incompleto, faça login e o sistema o guiará.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O cadastro com email e senha não está habilitado neste projeto Firebase. Por favor, habilite-o no console do Firebase (Authentication > Sign-in method).');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setError('O endereço de email fornecido é inválido.');
      } else {
        setError('Falha ao criar conta. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center text-center">
          <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200 mb-6 border border-slate-50">
            <SamuLogo className="h-24 w-24 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-azul-ferrete tracking-tighter uppercase">SAMU 192</h1>
          <h2 className="text-xs font-black text-samu-orange tracking-[0.3em] uppercase">Cadastro de Colaborador</h2>
        </div>
        <p className="mt-8 text-center text-sm text-slate-500 font-medium tracking-tight">
          Ou{' '}
          <Link to="/login" className="font-bold text-azul-ferrete hover:text-azul-ferrete-hover transition-colors underline underline-offset-4 decoration-2">
            faça login na sua conta existente
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-12 px-10 shadow-2xl shadow-slate-200 sm:rounded-[3rem] border border-slate-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-samu-red via-samu-orange to-azul-ferrete"></div>
          
          <form className="space-y-8" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-xs font-bold shadow-sm">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-100 text-green-600 px-6 py-4 rounded-2xl text-xs font-bold shadow-sm">
                ✅ {success}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange transition-all placeholder:text-slate-300"
                  placeholder="Nome e Sobrenome"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Institucional</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange transition-all placeholder:text-slate-300"
                  placeholder="seuemail@exemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                <input
                  type="text"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange transition-all placeholder:text-slate-300"
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CRM / COREN / MATRÍCULA</label>
                <input
                  type="text"
                  required
                  value={coren}
                  onChange={(e) => setCoren(e.target.value)}
                  placeholder="Ex: COREN 12345"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo / Função</label>
                <select
                  required
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange transition-all appearance-none"
                >
                  <option value="">Selecione sua função...</option>
                  {SAMU_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base de Atuação</label>
                <input
                  type="text"
                  required
                  value={base}
                  onChange={(e) => setBase(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-samu-orange/10 focus:border-samu-orange transition-all placeholder:text-slate-300"
                  placeholder="Ex: Serra Talhada"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-2">
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

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Perfil</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'servidor' | 'coordenacao')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-azul-ferrete/10 focus:border-azul-ferrete transition-all appearance-none"
                >
                  <option value="servidor">Servidor Operacional</option>
                  <option value="coordenacao">Coordenação / Gestão</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-5 px-4 border border-transparent rounded-2xl shadow-xl shadow-samu-orange/20 text-xs font-black uppercase tracking-[0.2em] text-white bg-samu-orange hover:bg-samu-orange-light focus:outline-none focus:ring-4 focus:ring-samu-orange/20 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? 'Processando Cadastro...' : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
