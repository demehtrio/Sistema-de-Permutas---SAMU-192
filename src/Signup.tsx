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
        <div className="flex justify-center flex-col items-center">
          <div className="bg-white p-2 rounded-full shadow-md mb-4">
            <SamuLogo className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SAMU 192</h1>
          <h2 className="text-sm font-semibold text-orange-600 tracking-wider">BASE SERRA TALHADA</h2>
        </div>
        <h3 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
          Cadastro de Funcionário
        </h3>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link to="/login" className="font-medium text-orange-600 hover:text-orange-500">
            faça login na sua conta existente
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSignup}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">CPF</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CRM / COREN /  MATRÍCULA</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={coren}
                    onChange={(e) => setCoren(e.target.value)}
                    placeholder="ex.: COREN 00000"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cargo</label>
                <div className="mt-1">
                  <select
                    required
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  >
                    <option value="">Selecione seu cargo...</option>
                    {SAMU_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Base</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={base}
                  onChange={(e) => setBase(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Senha</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
              <div className="mt-1">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'servidor' | 'coordenacao')}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                >
                  <option value="servidor">Servidor (Socorrista/Técnico/etc)</option>
                  <option value="coordenacao">Coordenação / Administrativo</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
