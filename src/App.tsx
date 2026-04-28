import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { Signup } from './Signup';
import { Dashboard, ErrorBoundary } from './Dashboard';
import { SamuLogo } from './components/SamuLogo';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = React.useState<string | null>(null);

  const { user, loading, quotaExceeded, signOut } = useAuth();
  
  // Use both state and global flag for redundancy
  const isQuotaExceeded = quotaExceeded || (typeof window !== 'undefined' && (window as any).FIREBASE_QUOTA_EXCEEDED);

  React.useEffect(() => {
    const handleErrorEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setGlobalError(customEvent.detail);
      setTimeout(() => setGlobalError(null), 8000); // 8s for quota errors
    };
    const handleSuccessEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setGlobalSuccess(customEvent.detail);
      setTimeout(() => setGlobalSuccess(null), 5000);
    };
    window.addEventListener('show-error-toast', handleErrorEvent);
    window.addEventListener('show-success-toast', handleSuccessEvent);
    return () => {
      window.removeEventListener('show-error-toast', handleErrorEvent);
      window.removeEventListener('show-success-toast', handleSuccessEvent);
    };
  }, []);

  if (isQuotaExceeded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-6 sm:p-10 text-center border-t-8 border-red-600">
          <div className="bg-red-50 p-3 rounded-full w-fit mx-auto mb-6">
            <SamuLogo className="h-20 w-20" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Limite de Uso Excedido</h2>
          <div className="space-y-4 text-gray-600 mb-8 leading-relaxed">
            <p className="font-semibold text-red-700 bg-red-50 p-3 rounded-lg border border-red-100">
              O sistema atingiu o limite diário gratuito de consultas ao banco de dados (Cota do Google Firebase).
            </p>
            <p className="text-sm">
              Infelizmente, como esta é uma versão de demonstração com recursos limitados, o acesso foi temporariamente bloqueado pelo Google.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl text-left border border-gray-200">
              <p className="font-bold text-gray-800 mb-2 flex items-center">
                <span className="bg-orange-600 text-white w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] mr-2">!</span>
                Informações Úteis:
              </p>
              <ul className="text-xs space-y-2 list-disc list-inside">
                <li>O sistema voltará a funcionar <strong>automaticamente</strong> à meia-noite (fuso horário do servidor).</li>
                <li>Nenhum dado ou permuta foi perdido.</li>
                <li>Tente recarregar a página mais tarde ou amanhã cedo.</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 transition-all shadow-lg active:scale-95"
            >
              Recarregar Sistema
            </button>
            {user && (
              <button
                onClick={() => signOut()}
                className="w-full py-2 text-gray-500 hover:text-gray-900 text-sm font-bold transition-colors"
              >
                Sair da Conta
              </button>
            )}
          </div>
          <p className="mt-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">SAMU 192 - Serra Talhada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {globalError && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-2xl flex items-start space-x-3">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-800">Aviso do Sistema</h3>
            <p className="mt-1 text-sm text-red-700 font-medium">{globalError}</p>
          </div>
          <button 
            onClick={() => setGlobalError(null)}
            className="text-red-400 hover:text-red-500 transition-colors font-bold p-1"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}

      {globalSuccess && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-2xl flex items-start space-x-3">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-green-800">Sucesso</h3>
            <p className="mt-1 text-sm text-green-700 font-medium">{globalSuccess}</p>
          </div>
          <button 
            onClick={() => setGlobalSuccess(null)}
            className="text-green-400 hover:text-green-500 transition-colors font-bold p-1"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}

      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
