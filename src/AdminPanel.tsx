import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { Trash2, Users, FileText, AlertTriangle } from 'lucide-react';
import { handleFirestoreError, OperationType } from './Dashboard';

export const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [permutas, setPermutas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'permutas'>('users');

  useEffect(() => {
    if (profile?.role !== 'coordenacao') return;

    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const unsubPermutas = onSnapshot(query(collection(db, 'permutas')), (snapshot) => {
      setPermutas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'permutas');
    });

    return () => {
      unsubUsers();
      unsubPermutas();
    };
  }, [profile]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário? O login dele continuará existindo no Firebase Auth, mas o perfil será removido.')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      window.dispatchEvent(new CustomEvent('show-success-toast', { detail: 'Usuário excluído com sucesso.' }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const handleDeletePermuta = async (permutaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta permuta permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'permutas', permutaId));
      window.dispatchEvent(new CustomEvent('show-success-toast', { detail: 'Permuta excluída com sucesso.' }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `permutas/${permutaId}`);
    }
  };

  if (profile?.role !== 'coordenacao') {
    return (
      <div className="p-8 text-center text-gray-500">
        Acesso negado. Apenas coordenadores podem acessar esta área.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-red-50">
        <div className="flex items-center text-red-800 mb-2">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <h2 className="text-xl font-bold">Painel de Administração (Zona de Perigo)</h2>
        </div>
        <p className="text-sm text-red-600">
          Atenção: As exclusões feitas aqui são permanentes e não podem ser desfeitas. Use apenas para limpar dados de teste.
        </p>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center ${
            activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600 bg-red-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Usuários ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('permutas')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center ${
            activeTab === 'permutas' ? 'border-b-2 border-red-600 text-red-600 bg-red-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Permutas ({permutas.length})
        </button>
      </div>

      <div className="p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando dados...</div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo/Role</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.cargo} <span className="text-xs bg-gray-100 px-2 py-1 rounded-full ml-2">{user.role}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === profile.uid}
                        className="text-red-600 hover:text-red-900 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={user.id === profile.uid ? "Você não pode excluir a si mesmo" : "Excluir usuário"}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum usuário encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Turno</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Substituto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permutas.map((permuta) => (
                  <tr key={permuta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {permuta.date} <br/>
                      <span className="text-xs text-gray-500">{permuta.shift}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{permuta.requesterName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{permuta.substituteName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        permuta.status === 'aprovada' ? 'bg-green-100 text-green-800' : 
                        permuta.status === 'rejeitada' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {permuta.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeletePermuta(permuta.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir permuta"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {permutas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma permuta encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
