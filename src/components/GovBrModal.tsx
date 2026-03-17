import React, { useState } from 'react';
import { X, Lock, User, AlertCircle } from 'lucide-react';

interface GovBrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (cpf: string) => void;
}

export function GovBrModal({ isOpen, onClose, onSign }: GovBrModalProps) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (cpf.replace(/\\D/g, '').length !== 11) {
      setError('CPF invÃ¡lido. Digite 11 nÃºmeros.');
      return;
    }
    if (password.length < 6) {
      setError('Senha invÃ¡lida.');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onSign(cpf);
    }, 1500);
  };

  const formatCpf = (value: string) => {
    const v = value.replace(/\\D/g, '');
    if (v.length <= 11) {
      return v
        .replace(/(\\d{3})(\\d)/, '$1.$2')
        .replace(/(\\d{3})(\\d)/, '$1.$2')
        .replace(/(\\d{3})(\\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header GOV.BR */}
        <div className="bg-[#1351B4] p-6 flex items-center justify-between text-white relative">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold tracking-tighter">gov.br</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Assinatura EletrÃ´nica</h2>
            <p className="text-sm text-gray-500 mt-1">
              Identifique-se no gov.br para assinar o documento de permuta.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="Digite seu CPF"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1351B4] focus:border-[#1351B4] outline-none transition-all"
                  maxLength={14}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha do gov.br"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1351B4] focus:border-[#1351B4] outline-none transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1351B4] hover:bg-[#0C3B8A] text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Entrar e Assinar'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              *Este Ã© um ambiente de simulaÃ§Ã£o para o protÃ³tipo SAMU 192.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
