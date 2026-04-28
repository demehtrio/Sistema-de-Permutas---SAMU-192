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

  const { user, loading, signOut } = useAuth();

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

  return (
    <div className="relative min-h-screen bg-slate-50">
      {globalError && (
        <div className="fixed top-6 right-6 z-[9999] max-w-sm w-full bg-white border border-red-100 p-5 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-start space-x-4 animate-in slide-in-from-right duration-300">
          <div className="bg-red-50 p-2 rounded-lg">
            <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-black text-red-800 uppercase tracking-wider">Aviso</h3>
            <p className="mt-1 text-sm text-slate-600 font-medium leading-snug">{globalError}</p>
          </div>
          <button 
            onClick={() => setGlobalError(null)}
            className="text-slate-300 hover:text-red-500 transition-colors font-bold p-1 text-xl"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}

      {globalSuccess && (
        <div className="fixed top-6 right-6 z-[9999] max-w-sm w-full bg-white border border-emerald-100 p-5 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] flex items-start space-x-4 animate-in slide-in-from-right duration-300">
          <div className="bg-emerald-50 p-2 rounded-lg">
            <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Sucesso</h3>
            <p className="mt-1 text-sm text-slate-600 font-medium leading-snug">{globalSuccess}</p>
          </div>
          <button 
            onClick={() => setGlobalSuccess(null)}
            className="text-slate-300 hover:text-emerald-500 transition-colors font-bold p-1 text-xl"
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
