import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { useAuth } from './AuthContext';
import { Check, X, Clock, Plus, FileText, MessageCircle, Mail, Inbox, Send, LogOut, User, PlusCircle, Ambulance } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { SamuLogo } from './components/SamuLogo';

export const Dashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [minhasPermutas, setMinhasPermutas] = useState<any[]>([]);
  const [permutasRecebidas, setPermutasRecebidas] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Signing state
  const [signingPermutaId, setSigningPermutaId] = useState<string | null>(null);
  const [signingStatus, setSigningStatus] = useState<'approved' | 'rejected' | null>(null);
  const [password, setPassword] = useState('');
  const [signingError, setSigningError] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (!profile) return;

    // Listen to permutas requested by me
    const qRequested = query(collection(db, 'permutas'), where('requesterId', '==', profile.uid));
    const unsubRequested = onSnapshot(qRequested, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMinhasPermutas(data);
    });

    // Listen to permutas where I am the substitute
    const qReceived = query(collection(db, 'permutas'), where('substituteId', '==', profile.uid));
    const unsubReceived = onSnapshot(qReceived, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPermutasRecebidas(data);
    });

    return () => {
      unsubRequested();
      unsubReceived();
    };
  }, [profile]);

  const initiateSign = (permutaId: string, status: 'approved' | 'rejected') => {
    setSigningPermutaId(permutaId);
    setSigningStatus(status);
    setPassword('');
    setSigningError('');
  };

  const confirmSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !signingPermutaId || !signingStatus) return;
    
    setIsSigning(true);
    setSigningError('');

    try {
      // Verify password
      await signInWithEmailAndPassword(auth, profile.email, password);

      // Update document
      const permutaRef = doc(db, 'permutas', signingPermutaId);
      await updateDoc(permutaRef, {
        status: signingStatus,
        substituteSignedAt: new Date().toISOString()
      });
      
      alert(`Permuta ${signingStatus === 'approved' ? 'assinada' : 'rejeitada'} com sucesso!`);
      setSigningPermutaId(null);
      setSigningStatus(null);
    } catch (error: any) {
      console.error("Erro ao assinar permuta:", error);
      setSigningError("Senha incorreta ou erro ao assinar.");
    } finally {
      setIsSigning(false);
    }
  };

  const generatePDF = (permuta: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Termo de Permuta - SAMU 192', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Dados da Permuta:', 20, 40);
    
    doc.setFontSize(10);
    doc.text(`Motivo: ${permuta.reason || 'Não informado'}`, 20, 50);
    
    doc.text('Solicitante:', 20, 70);
    doc.text(`Nome: ${permuta.requesterName}`, 20, 80);
    if (permuta.requesterRole) doc.text(`Cargo: ${permuta.requesterRole}`, 20, 90);
    if (permuta.requesterDate) doc.text(`Data do Plantão: ${permuta.requesterDate}`, 20, 100);
    if (permuta.requesterShift) doc.text(`Turno: ${permuta.requesterShift}`, 20, 110);
    
    doc.text('Substituto:', 120, 70);
    doc.text(`Nome: ${permuta.substituteName}`, 120, 80);
    if (permuta.substituteRole) doc.text(`Cargo: ${permuta.substituteRole}`, 120, 90);
    doc.text(`Data do Plantão: ${permuta.date}`, 120, 100);
    doc.text(`Turno: ${permuta.shift}`, 120, 110);
    
    doc.text('Status: APROVADA / ASSINADA', 105, 140, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text(`Solicitação criada em: ${new Date(permuta.createdAt).toLocaleString()}`, 20, 160);
    if (permuta.substituteSignedAt) {
      doc.text(`Assinatura do Substituto em: ${new Date(permuta.substituteSignedAt).toLocaleString()}`, 20, 170);
    }
    
    doc.save(`Permuta_${permuta.date}_${permuta.requesterName.replace(/\s+/g, '')}.pdf`);
  };

  const getShareText = (permuta: any) => {
    let text = `*Termo de Permuta - SAMU 192*%0A%0A`;
    text += `*Solicitante:* ${permuta.requesterName} ${permuta.requesterRole ? `(${permuta.requesterRole})` : ''}%0A`;
    if (permuta.requesterDate) text += `*Data (Solicitante):* ${permuta.requesterDate}%0A`;
    if (permuta.requesterShift) text += `*Turno (Solicitante):* ${permuta.requesterShift}%0A`;
    
    text += `%0A*Substituto:* ${permuta.substituteName} ${permuta.substituteRole ? `(${permuta.substituteRole})` : ''}%0A`;
    text += `*Data (Substituto):* ${permuta.date}%0A`;
    text += `*Turno (Substituto):* ${permuta.shift}%0A`;
    
    text += `%0A*Status:* Assinada/Aprovada`;
    return text;
  };

  const shareWhatsApp = (permuta: any) => {
    const text = getShareText(permuta);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareEmail = (permuta: any) => {
    const subject = `Permuta Aprovada - ${permuta.date} - ${permuta.requesterName} e ${permuta.substituteName}`;
    const body = getShareText(permuta).replace(/%0A/g, '\n').replace(/\*/g, '');
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gradient-to-r from-orange-600 to-red-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1 rounded-full shadow-sm">
                <SamuLogo className="h-10 w-10 object-contain" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide leading-tight">Sistema de Permutas</h1>
                <span className="text-[10px] sm:text-xs text-orange-100 font-semibold tracking-wider">SAMU 192 - BASE SERRA TALHADA</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-white bg-white/20 px-3 py-1.5 rounded-full">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{profile.name}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center space-x-1 text-sm text-white hover:text-red-100 hover:bg-red-700/50 px-3 py-2 rounded-md transition-colors font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {isCreating ? (
          <CreatePermuta onCancel={() => setIsCreating(false)} />
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Painel de Permutas</h2>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                <PlusCircle className="mr-2 -ml-1 h-5 w-5" />
                Nova Permuta
              </button>
            </div>

            {/* Permutas Recebidas (Ações pendentes) */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-blue-50 border-b border-blue-100 flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Inbox className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-blue-900">
                    Permutas Recebidas (Para Assinar)
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-blue-700">
                    Colegas que solicitaram troca com você.
                  </p>
                </div>
              </div>
              <ul className="divide-y divide-gray-200">
                {permutasRecebidas.length === 0 ? (
                  <li className="px-4 py-4 sm:px-6 text-gray-500 text-sm">Nenhuma permuta recebida.</li>
                ) : (
                  permutasRecebidas.map((p) => (
                    <li key={p.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-orange-600 truncate">
                            Solicitante: {p.requesterName} {p.requesterRole ? `(${p.requesterRole})` : ''}
                          </p>
                          <p className="text-sm text-gray-500">
                            Substituto: {p.date} | {p.shift}
                            {p.requesterDate && ` • Solicitante: ${p.requesterDate} | ${p.requesterShift}`}
                          </p>
                          {p.reason && (
                            <p className="text-sm text-gray-500 mt-1">Motivo: {p.reason}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {p.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => initiateSign(p.id, 'approved')}
                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700"
                                title="Assinar/Aprovar"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => initiateSign(p.id, 'rejected')}
                                className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700"
                                title="Rejeitar"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                p.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {p.status === 'approved' ? 'Assinada' : 'Rejeitada'}
                              </span>
                              {p.status === 'approved' && (
                                <div className="flex space-x-2 ml-2">
                                  <button onClick={() => generatePDF(p)} className="p-1.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-full shadow-sm transition-colors" title="Gerar PDF">
                                    <FileText className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => shareWhatsApp(p)} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-full shadow-sm transition-colors" title="Enviar por WhatsApp">
                                    <MessageCircle className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => shareEmail(p)} className="p-1.5 text-white bg-blue-500 hover:bg-blue-600 rounded-full shadow-sm transition-colors" title="Enviar por E-mail">
                                    <Mail className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Minhas Solicitações */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-orange-50 border-b border-orange-100 flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Send className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg leading-6 font-medium text-orange-900">
                    Minhas Solicitações
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-orange-700">
                    Permutas que você solicitou.
                  </p>
                </div>
              </div>
              <ul className="divide-y divide-gray-200">
                {minhasPermutas.length === 0 ? (
                  <li className="px-4 py-4 sm:px-6 text-gray-500 text-sm">Nenhuma solicitação feita.</li>
                ) : (
                  minhasPermutas.map((p) => (
                    <li key={p.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Substituto: {p.substituteName} {p.substituteRole ? `(${p.substituteRole})` : ''}
                          </p>
                          <p className="text-sm text-gray-500">
                            Substituto: {p.date} | {p.shift}
                            {p.requesterDate && ` • Solicitante: ${p.requesterDate} | ${p.requesterShift}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            p.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            p.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {p.status === 'approved' ? 'Assinada' : 
                             p.status === 'rejected' ? 'Rejeitada' : 
                             'Aguardando Assinatura'}
                          </span>
                          {p.status === 'approved' && (
                            <div className="flex space-x-2 ml-2">
                              <button onClick={() => generatePDF(p)} className="p-1.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-full shadow-sm transition-colors" title="Gerar PDF">
                                <FileText className="h-4 w-4" />
                              </button>
                              <button onClick={() => shareWhatsApp(p)} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-full shadow-sm transition-colors" title="Enviar por WhatsApp">
                                <MessageCircle className="h-4 w-4" />
                              </button>
                              <button onClick={() => shareEmail(p)} className="p-1.5 text-white bg-blue-500 hover:bg-blue-600 rounded-full shadow-sm transition-colors" title="Enviar por E-mail">
                                <Mail className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Password Confirmation Modal */}
      {signingPermutaId && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSigningPermutaId(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Confirmar Assinatura
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Para {signingStatus === 'approved' ? 'aprovar' : 'rejeitar'} esta permuta, confirme sua senha de acesso.
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={confirmSign} className="mt-5 sm:mt-6">
                {signingError && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {signingError}
                  </div>
                )}
                <div className="mb-4">
                  <input
                    type="password"
                    required
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setSigningPermutaId(null)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSigning}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                  >
                    {isSigning ? 'Assinando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreatePermuta: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [substituteId, setSubstituteId] = useState('');
  const [requesterRole, setRequesterRole] = useState('');
  const [substituteRole, setSubstituteRole] = useState('');
  const [requesterDate, setRequesterDate] = useState('');
  const [requesterShift, setRequesterShift] = useState('');
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const SAMU_ROLES = [
    "Médico(a)",
    "Enfermeiro(a)",
    "Técnico(a) de Enfermagem",
    "Condutor(a) Socorrista",
    "TARM",
    "Rádio Operador(a)",
    "Coordenador(a) / Administrativo"
  ];

  useEffect(() => {
    if (profile?.cargo) {
      setRequesterRole(profile.cargo);
    }
  }, [profile]);

  useEffect(() => {
    if (substituteId) {
      const substitute = users.find(u => u.id === substituteId);
      if (substitute?.cargo) {
        setSubstituteRole(substitute.cargo);
      }
    }
  }, [substituteId, users]);

  useEffect(() => {
    // Load users to select substitute
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== profile?.uid); // Exclude self
      setUsers(usersData);
    });
    return () => unsub();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      const substitute = users.find(u => u.id === substituteId);
      if (!substitute) throw new Error("Substituto não encontrado");

      await addDoc(collection(db, 'permutas'), {
        requesterId: profile.uid,
        requesterName: profile.name, // Auto-filled from logged user
        requesterRole,
        requesterDate,
        requesterShift,
        substituteId: substitute.id,
        substituteName: substitute.name,
        substituteRole,
        date,
        shift,
        reason,
        status: 'pending',
        requesterSignedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      alert('Permuta solicitada com sucesso! O substituto foi notificado.');
      onCancel();
    } catch (error) {
      console.error("Erro ao criar permuta:", error);
      alert("Erro ao criar permuta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Solicitar Nova Permuta</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>Preencha os dados abaixo. Seus dados como solicitante já estão preenchidos automaticamente.</p>
        </div>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Solicitante</label>
              <input
                type="text"
                disabled
                value={profile?.name || ''}
                className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cargo do Solicitante</label>
              <select
                required
                value={requesterRole}
                onChange={(e) => setRequesterRole(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                <option value="">Selecione...</option>
                {SAMU_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data do Plantão (Solicitante - Opcional)</label>
              <input
                type="date"
                value={requesterDate}
                onChange={(e) => setRequesterDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Turno (Solicitante - Opcional)</label>
              <select
                value={requesterShift}
                onChange={(e) => setRequesterShift(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                <option value="">Selecione...</option>
                <option value="Diurno">Diurno</option>
                <option value="Noturno">Noturno</option>
                <option value="Plantão 24h">Plantão 24h</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Substituto</label>
              <select
                required
                value={substituteId}
                onChange={(e) => setSubstituteId(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                <option value="">Selecione um colega...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cargo do Substituto</label>
              <select
                required
                value={substituteRole}
                onChange={(e) => setSubstituteRole(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                <option value="">Selecione...</option>
                {SAMU_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data do Plantão (Substituto)</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Turno (Substituto)</label>
              <select
                required
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                <option value="">Selecione...</option>
                <option value="Diurno">Diurno</option>
                <option value="Noturno">Noturno</option>
                <option value="Plantão 24h">Plantão 24h</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Motivo (Opcional)</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enviando...' : 'Assinar e Enviar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
