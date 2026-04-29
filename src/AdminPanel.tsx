import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { Trash2, Users, FileText, AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';

export const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [permutas, setPermutas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'permutas'>('users');

  const fetchData = async () => {
    if (profile?.role !== 'coordenacao') return;
    setLoading(true);
    try {
      // Fetch users
      const usersSnapshot = await getDocs(query(collection(db, 'users'), orderBy('name', 'asc')));
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch recent permutas (limit to 100 to save quota)
      const permutasSnapshot = await getDocs(query(
        collection(db, 'permutas'), 
        orderBy('createdAt', 'desc'),
        limit(100)
      ));
      setPermutas(permutasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching admin data:", error);
      handleFirestoreError(error, OperationType.LIST, 'admin_data', false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const [confirmDelete, setConfirmDelete] = useState<{ type: 'user' | 'permuta', id: string, message: string } | null>(null);

  const handleDeleteUser = async (userId: string) => {
    setConfirmDelete({
      type: 'user',
      id: userId,
      message: 'Tem certeza que deseja excluir este usuário? O login dele continuará existindo no Firebase Auth, mas o perfil será removido.'
    });
  };

  const handleDeletePermuta = async (permutaId: string) => {
    setConfirmDelete({
      type: 'permuta',
      id: permutaId,
      message: 'Tem certeza que deseja excluir esta permuta permanentemente?'
    });
  };

  const confirmAction = async () => {
    if (!confirmDelete) return;
    
    try {
      if (confirmDelete.type === 'user') {
        await deleteDoc(doc(db, 'users', confirmDelete.id));
        setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
        window.dispatchEvent(new CustomEvent('show-success-toast', { detail: 'Usuário excluído com sucesso.' }));
      } else {
        await deleteDoc(doc(db, 'permutas', confirmDelete.id));
        setPermutas(prev => prev.filter(p => p.id !== confirmDelete.id));
        window.dispatchEvent(new CustomEvent('show-success-toast', { detail: 'Permuta excluída com sucesso.' }));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${confirmDelete.type === 'user' ? 'users' : 'permutas'}/${confirmDelete.id}`, false);
    } finally {
      setConfirmDelete(null);
    }
  };

  if (profile?.role !== 'coordenacao') {
    return (
      <div className="p-12 text-center">
        <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-xl shadow-red-50">
           <ShieldAlert className="h-10 w-10 text-samu-red" />
        </div>
        <h2 className="text-xl font-black text-azul-ferrete uppercase tracking-tighter mb-2">Acesso Restrito</h2>
        <p className="text-slate-500 font-medium max-w-xs mx-auto">Você não tem permissões de coordenação para acessar esta ferramenta.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden"
    >
      {/* Header */}
      <div className="px-8 py-8 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-samu-red p-2.5 rounded-2xl shadow-lg shadow-red-900/40">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Zona de Administração</h2>
              <span className="hidden sm:inline-block px-2 py-1 bg-white/10 text-white/50 text-[10px] font-black rounded border border-white/10 tracking-widest uppercase">Root Access</span>
            </div>
            <p className="text-slate-400 text-xs font-medium max-w-md">
              Interface de monitoramento e manutenção de registros. Ações aqui têm impacto direto na base de dados.
            </p>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/5 transition-all active:scale-95 disabled:opacity-50 group"
          >
            <RefreshCw className={`w-4 h-4 text-samu-orange group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Sincronizando...' : 'Recarregar'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-50 p-2 gap-2 border-b border-slate-100">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center transition-all ${
            activeTab === 'users' 
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className={`w-4 h-4 mr-2.5 ${activeTab === 'users' ? 'text-samu-red' : ''}`} />
          Usuários <span className="ml-2 font-mono text-[10px] bg-slate-200/50 px-2 py-0.5 rounded-full">{users.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('permutas')}
          className={`flex-1 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center transition-all ${
            activeTab === 'permutas' 
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className={`w-4 h-4 mr-2.5 ${activeTab === 'permutas' ? 'text-samu-orange' : ''}`} />
          Permutas <span className="ml-2 font-mono text-[10px] bg-slate-200/50 px-2 py-0.5 rounded-full">{permutas.length}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-samu-red rounded-full animate-spin" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acessando Database...</span>
          </div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">IDENTIFICAÇÃO</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">CARGO E NÍVEL</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50 border-t border-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 flex items-center">
                          {user.name}
                          {user.id === profile.uid && (
                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded border border-indigo-100 uppercase italic">Você</span>
                          )}
                        </span>
                        <span className="text-xs font-medium text-slate-400 font-mono">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                       <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-slate-600 border border-slate-200 bg-slate-50 px-2 py-1 rounded uppercase">{user.cargo}</span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full border uppercase ${user.role === 'coordenacao' ? 'bg-samu-red/5 text-samu-red border-samu-red/10' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          {user.role}
                        </span>
                       </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === profile.uid}
                        className="p-3 text-slate-300 hover:text-samu-red hover:bg-red-50 rounded-2xl transition-all disabled:opacity-0 disabled:pointer-events-none group-hover:bg-red-50/50"
                        title="Remover Registro"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center">
                       <p className="text-slate-300 text-xs font-black uppercase tracking-widest">Vazio</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">LOG DE PERMUTA</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ENVOLVIDOS</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">STATUS</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">GESTÃO</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50 border-t border-slate-100">
                {permutas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900">{p.date}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{p.shift}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">REQ:</span>
                          <span className="text-xs font-bold text-slate-600">{p.requesterName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SUB:</span>
                          <span className="text-xs font-bold text-slate-600">{p.substituteName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${
                        p.status === 'aprovada' || p.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        p.status === 'rejeitada' || p.status === 'rejected' ? 'bg-red-50 text-samu-red border-red-100' : 
                        'bg-orange-50 text-samu-orange border-orange-100'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeletePermuta(p.id)}
                        className="p-3 text-slate-300 hover:text-samu-red hover:bg-red-50 rounded-2xl transition-all group-hover:bg-red-50/50"
                        title="Deletar Documento"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {permutas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <p className="text-slate-300 text-xs font-black uppercase tracking-widest">Nenhum histórico</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative border border-slate-100 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-samu-red"></div>
              
              <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 border border-red-100">
                <Trash2 className="w-10 h-10 text-samu-red" />
              </div>

              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4 flex items-center">
                Confirmar Exclusão
              </h3>
              
              <p className="text-slate-500 font-medium leading-relaxed mb-10">
                {confirmDelete.message} Esta ação é <span className="text-samu-red font-black uppercase">irreversível</span> e o registro será removido permanentemente dos servidores.
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Manter Registro
                </button>
                <button
                  onClick={confirmAction}
                  className="flex-1 px-6 py-4 text-xs font-black uppercase tracking-widest text-white bg-samu-red hover:bg-red-700 shadow-xl shadow-red-200 rounded-2xl transition-all active:scale-95"
                >
                  DELETAR AGORA
                </button>
              </div>

              <button 
                onClick={() => setConfirmDelete(null)}
                className="absolute top-6 right-6 text-slate-300 hover:text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
