import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Login } from './Login';
import { Signup } from './Signup';
import { Dashboard, ErrorBoundary } from './Dashboard';
import { X } from 'lucide-react';

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

function App() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = React.useState<string | null>(null);

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
    <AuthProvider>
      <div className="relative">
        {globalError && (
          <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-2xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-5">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-800">Aviso do Sistema</h3>
              <p className="mt-1 text-sm text-red-700 font-medium">{globalError}</p>
            </div>
            <button 
              onClick={() => setGlobalError(null)}
              className="text-red-400 hover:text-red-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {globalSuccess && (
          <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-2xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-5">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-green-800">Sucesso</h3>
              <p className="mt-1 text-sm text-green-700 font-medium">{globalSuccess}</p>
            </div>
            <button 
              onClick={() => setGlobalSuccess(null)}
              className="text-green-400 hover:text-green-500 transition-colors"
            >
              <X className="h-5 w-5" />
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
    </AuthProvider>
  );
}

export default App;
