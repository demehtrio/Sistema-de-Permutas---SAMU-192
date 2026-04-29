import React, { useState, useEffect, Component } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { useAuth } from './AuthContext';
import { Check, X, Clock, Plus, FileText, MessageCircle, Mail, Inbox, Send, LogOut, User, PlusCircle, Ambulance, AlertTriangle, Trash2, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { twMerge } from 'tailwind-merge';
import { AdminPanel } from './AdminPanel';
import { SamuLogo } from './components/SamuLogo';

import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

export class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      let isPermissionError = false;

      try {
        const errorMsg = this.state.error?.message || String(this.state.error);
        if (errorMsg.startsWith('{') && errorMsg.endsWith('}')) {
          const parsed = JSON.parse(errorMsg);
          if (parsed.error) {
            isPermissionError = true;
            const opMap: Record<string, string> = {
              create: "criar",
              update: "atualizar",
              delete: "excluir",
              list: "listar",
              get: "acessar",
              write: "salvar"
            };
            const op = opMap[parsed.operationType] || "acessar";
            errorMessage = `Você não tem permissão para ${op} estes dados. Por favor, verifique seu acesso ou contate a coordenação.`;
          }
        } else {
          errorMessage = errorMsg;
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isPermissionError ? 'Acesso Negado' : 'Erro no Aplicativo'}
            </h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-samu-orange text-white py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-samu-orange-light transition-all shadow-lg shadow-samu-orange/20 active:scale-95"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const SystemSignatureButton: React.FC<{ onClick?: () => void; className?: string; label?: string; loading?: boolean; type?: "button" | "submit" }> = ({ onClick, className, label, loading, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={loading}
    className={twMerge(`flex items-center justify-center px-5 py-3 border-none text-xs font-black uppercase tracking-widest rounded-2xl text-white bg-azul-ferrete hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50`, className)}
  >
    <Check className="w-4 h-4 mr-2" />
    {loading ? 'Processando...' : (label || 'Assinar com Senha')}
  </button>
);

export const generatePDF = async (permuta: any) => {
  const doc = new jsPDF();
  
  // Function to get SAMU Logo as Base64 by rendering the SVG to a canvas
  const getSamuLogoBase64 = async (): Promise<string> => {
    return new Promise((resolve) => {
      const svgString = `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    <circle cx="250" cy="250" r="240" fill="#FFFFFF" stroke="#E87C00" stroke-width="8" />
    <path d="M 10,250 A 240,240 0 0,1 490,250 Z" fill="#E87C00" />
    <circle cx="250" cy="250" r="165" fill="#FFFFFF" />
    <circle cx="250" cy="250" r="165" fill="none" stroke="#E87C00" stroke-width="6" />
    <defs>
      <path id="topTextPath" d="M 55,250 A 195,195 0 0,1 445,250" />
      <path id="bottomTextPath" d="M 35,250 A 215,215 0 0,0 465,250" />
    </defs>
    <text fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="26" letter-spacing="2.5">
      <textPath href="#topTextPath" startOffset="50%" text-anchor="middle">SERVIÇO DE ATENDIMENTO MÓVEL DE URGÊNCIA</textPath>
    </text>
    <text fill="#E87C00" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="30" letter-spacing="5">
      <textPath href="#bottomTextPath" startOffset="50%" text-anchor="middle">SISTEMA ÚNICO DE SAÚDE</textPath>
    </text>
    <g transform="translate(250, 250) scale(1.1)">
      <path d="M -20,-110 L 20,-110 L 20,-34.64 L 85.26,-72.32 L 105.26,-37.68 L 40,0 L 105.26,37.68 L 85.26,72.32 L 20,34.64 L 20,110 L -20,110 L -20,34.64 L -85.26,72.32 L -105.26,37.68 L -40,0 L -105.26,-37.68 L -85.26,-72.32 L -20,-34.64 Z" fill="none" stroke="#E87C00" stroke-width="12" stroke-linejoin="round" />
      <path d="M -20,-110 L 20,-110 L 20,-34.64 L 85.26,-72.32 L 105.26,-37.68 L 40,0 L 105.26,37.68 L 85.26,72.32 L 20,34.64 L 20,110 L -20,110 L -20,34.64 L -85.26,72.32 L -105.26,37.68 L -40,0 L -105.26,-37.68 L -85.26,-72.32 L -20,-34.64 Z" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linejoin="round" />
      <path d="M -20,-110 L 20,-110 L 20,-34.64 L 85.26,-72.32 L 105.26,-37.68 L 40,0 L 105.26,37.68 L 85.26,72.32 L 20,34.64 L 20,110 L -20,110 L -20,34.64 L -85.26,72.32 L -105.26,37.68 L -40,0 L -105.26,-37.68 L -85.26,-72.32 L -20,-34.64 Z" fill="#C8102E" />
      <polygon points="0,-85 8,-70 4,-70 4,75 -4,75 -4,-70 -8,-70" fill="#FFFFFF" />
      <path d="M -5,55 C -30,35 -30,-5 0,-15 C 30,-25 30,-60 0,-70 C -15,-75 -20,-90 -10,-100 C -5,-105 5,-105 10,-95" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" />
    </g>
  </svg>`;
      
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 500;
          canvas.height = 500;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve('');
          }
        } catch (e) {
          console.error("Canvas error:", e);
          resolve('');
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        resolve('');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };

  const samuLogoBase64 = await getSamuLogoBase64();

  // Header Layout
  doc.setFontSize(18);
  doc.setTextColor(200, 16, 46); // SAMU Red
  doc.setFont('helvetica', 'bold');
  doc.text('Termo de Permuta - SAMU 192', 105, 25, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('BASE SERRA TALHADA - PE', 105, 33, { align: 'center' });
  
  // Thin red line
  doc.setDrawColor(200, 16, 46);
  doc.setLineWidth(0.2);
  doc.line(20, 45, 190, 45);

  // Content
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados da Permuta:', 20, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo de Unidade: ${permuta.unitType || 'Não informado'}`, 20, 65);
  doc.text(`Base: ${permuta.base || 'SERRA TALHADA'}`, 20, 72);
  doc.text(`Motivo: ${permuta.reason || 'Não informado'}`, 20, 79);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Solicitante:', 20, 92);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${permuta.requesterName}`, 20, 102);
  doc.text(`Cargo: ${permuta.requesterRole || 'Não informado'}`, 20, 109);
  doc.text(`Data do Plantão: ${permuta.requesterDate || 'Não informado'}`, 20, 116);
  doc.text(`Turno: ${permuta.requesterShift || 'Não informado'}`, 20, 123);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Substituto:', 120, 92);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${permuta.substituteName}`, 120, 102);
  doc.text(`Cargo: ${permuta.substituteRole || 'Não informado'}`, 120, 109);
  doc.text(`Data do Plantão: ${permuta.date}`, 120, 116);
  doc.text(`Turno: ${permuta.shift}`, 120, 123);

  // Second thin red line
  doc.setDrawColor(200, 16, 46);
  doc.line(20, 140, 190, 140);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSINATURAS DIGITAIS:', 20, 150);

  // Digital Signature Block
  const drawSignature = (x: number, y: number, name: string, id: string, date: string) => {
    // Add full SAMU Logo as watermark behind signature
    if (samuLogoBase64) {
      try {
        // Use a simpler approach for watermark if GState is not available or causing issues
        doc.saveGraphicsState();
        const gState = (doc as any).GState ? new (doc as any).GState({opacity: 0.15}) : null;
        if (gState) {
          doc.setGState(gState);
        }
        doc.addImage(samuLogoBase64, 'PNG', x + 20, y - 5, 25, 25);
        doc.restoreGraphicsState();
      } catch (e) {
        console.warn("Watermark error:", e);
        // Fallback: just draw it small next to it without transparency if GState fails
        try {
          doc.addImage(samuLogoBase64, 'PNG', x, y, 15, 15);
        } catch (e2) {}
      }
    } else {
      // Fallback watermark using jsPDF primitives if image failed to load
      try {
        doc.setGState(new (doc as any).GState({opacity: 0.1}));
        doc.setDrawColor(200, 16, 46);
        doc.setFillColor(200, 16, 46);
        doc.circle(x + 32, y + 7, 12, 'F');
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1.5);
        doc.line(x + 32, y + 1, x + 32, y + 13);
        doc.line(x + 26, y + 7, x + 38, y + 7);
        doc.setGState(new (doc as any).GState({opacity: 1.0}));
      } catch (e) {}
    }

    const textX = x + 5;
    
    doc.setTextColor(150, 150, 150); // Light Gray
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('DOCUMENTO ASSINADO DIGITALMENTE', textX, y + 2);
    
    doc.setTextColor(0, 0, 0); // Black
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(name.toUpperCase(), textX, y + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(id, textX, y + 10);
    
    doc.setFontSize(7);
    doc.text(`EM ${new Date(date).toLocaleDateString()} - ÀS ${new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, textX, y + 14);
  };

  let sigY = 160;
  if (permuta.requesterSignedAt) {
    const id = `${permuta.requesterCoren ? `${permuta.requesterCoren} / ` : ''}CPF ${permuta.requesterCpf || ''}`;
    drawSignature(20, sigY, permuta.requesterName, id, permuta.requesterSignedAt);
    sigY += 25;
  } else {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(20, sigY + 10, 90, sigY + 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(permuta.requesterName.toUpperCase(), 55, sigY + 15, { align: 'center' });
    doc.text('Solicitante', 55, sigY + 19, { align: 'center' });
    sigY += 25;
  }
  
  if (permuta.substituteSignedAt) {
    const id = `${permuta.substituteCoren ? `${permuta.substituteCoren} / ` : ''}CPF ${permuta.substituteCpf || ''}`;
    drawSignature(20, sigY, permuta.substituteName, id, permuta.substituteSignedAt);
    sigY += 25;
  } else {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(20, sigY + 10, 90, sigY + 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(permuta.substituteName.toUpperCase(), 55, sigY + 15, { align: 'center' });
    doc.text('Substituto', 55, sigY + 19, { align: 'center' });
    sigY += 25;
  }
  
  if (permuta.coordinatorSignedAt) {
    const id = `${permuta.coordinatorCoren ? `${permuta.coordinatorCoren} / ` : ''}CPF ${permuta.coordinatorCpf || ''}`;
    drawSignature(20, sigY, `COORDENAÇÃO: ${permuta.coordinatorName}`, id, permuta.coordinatorSignedAt);
  } else {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(20, sigY + 10, 90, sigY + 10);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('COORDENAÇÃO', 55, sigY + 15, { align: 'center' });
  }
  
  doc.save(`Permuta_${permuta.date}_${permuta.requesterName.replace(/\s+/g, '')}.pdf`);
};

export const Dashboard: React.FC = () => {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [minhasPermutas, setMinhasPermutas] = useState<any[]>([]);
  const [permutasRecebidas, setPermutasRecebidas] = useState<any[]>([]);
  const [permutasCoordenacao, setPermutasCoordenacao] = useState<any[]>([]);
  const [permutasAprovadas, setPermutasAprovadas] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isWaitingForProfile, setIsWaitingForProfile] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        setIsWaitingForProfile(false);
      }, 2000); // reduced to 2s
      return () => clearTimeout(timer);
    } else {
      setIsWaitingForProfile(true);
    }
  }, [authLoading]);

  // Signing state
  const [signingPermutaId, setSigningPermutaId] = useState<string | null>(null);
  const [signingStatus, setSigningStatus] = useState<'approved' | 'rejected' | null>(null);
  const [password, setPassword] = useState('');
  const [signingError, setSigningError] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  const fetchData = async () => {
    if (!profile) return;
    
    try {
      // Fetch requested
      const qRequested = query(
        collection(db, 'permutas'), 
        where('requesterId', '==', profile.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const requestedSnapshot = await getDocs(qRequested);
      setMinhasPermutas(requestedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch received
      const qReceived = query(
        collection(db, 'permutas'), 
        where('substituteId', '==', profile.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const receivedSnapshot = await getDocs(qReceived);
      setPermutasRecebidas(receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch coordination
      if (profile?.role === 'coordenacao') {
        const qCoord = query(collection(db, 'permutas'), where('status', '==', 'pendente_coordenacao'));
        const coordSnapshot = await getDocs(qCoord);
        setPermutasCoordenacao(coordSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }

      // Fetch approved history
      const qApproved = query(
        collection(db, 'permutas'), 
        where('status', '==', 'aprovada'),
        orderBy('createdAt', 'desc'),
        limit(30) // Reduce to 30 to save more quota
      );
      try {
        const approvedSnapshot = await getDocs(qApproved);
        setPermutasAprovadas(approvedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      } catch (err: any) {
        if (err.message?.includes('FAILED_PRECONDITION')) {
          const qSimple = query(collection(db, 'permutas'), where('status', '==', 'aprovada'), limit(30));
          const simpleSnap = await getDocs(qSimple);
          const d = simpleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
          d.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setPermutasAprovadas(d);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      handleFirestoreError(error, OperationType.LIST, 'dashboard_data', false);
    }
  };

  useEffect(() => {
    fetchData();
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
      await signInWithEmailAndPassword(auth, profile.email.trim(), password);

      // Update document
      const permutaRef = doc(db, 'permutas', signingPermutaId);
      const permutaDoc = [...minhasPermutas, ...permutasRecebidas, ...permutasCoordenacao].find(p => p.id === signingPermutaId);
      
      let nextStatus = signingStatus === 'approved' ? 'aprovada' : 'rejeitada';
      let updateData: any = {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      };

      if (profile.role === 'coordenacao') {
        updateData.coordinatorSignedAt = new Date().toISOString();
        updateData.coordinatorName = profile.name;
        updateData.coordinatorCpf = profile.cpf || '';
        updateData.coordinatorCoren = profile.coren || '';
      } else {
        // If substitute signs
        if (signingStatus === 'approved') {
          updateData.status = 'pendente_coordenacao';
          updateData.substituteSignedAt = new Date().toISOString();
          updateData.substituteCpf = profile.cpf || '';
          updateData.substituteCoren = profile.coren || '';
        }
      }

      await updateDoc(permutaRef, updateData);
      
      // Refresh data
      await fetchData();

      // Close modal and show success
      setSigningPermutaId(null);
      setSigningStatus(null);
      setPassword('');
      window.dispatchEvent(new CustomEvent('show-success-toast', { detail: "Permuta assinada com sucesso!" }));
    } catch (error: any) {
      console.error("Erro ao assinar permuta:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setSigningError('Senha incorreta. Verifique sua senha e tente novamente.');
      } else if (error.code === 'auth/too-many-requests') {
        setSigningError('Muitas tentativas. Tente novamente mais tarde.');
      } else if (error.message && error.message.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.UPDATE, `permutas/${signingPermutaId}`, false);
        setSigningError("Acesso Negado: Você não tem permissão para assinar.");
      } else {
        setSigningError("Erro ao verificar identidade. Tente novamente.");
      }
    } finally {
      setIsSigning(false);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeletePermuta = async (permutaId: string) => {
    if (!profile || profile.role !== 'coordenacao') return;
    setDeleteConfirmId(permutaId);
  };

  const confirmDeletePermuta = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDoc(doc(db, 'permutas', deleteConfirmId));
      await fetchData();
      window.dispatchEvent(new CustomEvent('show-success-toast', { detail: 'Permuta excluída com sucesso.' }));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `permutas/${deleteConfirmId}`, false);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const getShareText = (permuta: any) => {
    let text = `*Termo de Permuta - SAMU 192*%0A%0A`;
    if (permuta.unitType) text += `*Unidade:* ${permuta.unitType}%0A%0A`;
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

  if (authLoading || (user && !profile && isWaitingForProfile)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="text-gray-500 font-medium">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  if (user && !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
            <User className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Perfil Incompleto</h2>
          <p className="text-gray-600 mb-6">
            Seu cadastro foi iniciado, mas os dados do seu perfil não foram encontrados. 
            Isso pode acontecer se houve uma falha na conexão durante o cadastro.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/#/signup'}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Tentar Cadastrar Novamente
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Sair da Conta
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            ID: {user.uid}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return null; // Safety check

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="p-1 rounded-xl">
                <SamuLogo className="h-12 w-12 object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-azul-ferrete tracking-tighter leading-none flex items-center">
                  SISTEMA DE PERMUTAS
                  <span className="ml-2 px-2 py-0.5 bg-samu-red text-white text-[10px] font-black rounded uppercase tracking-widest">v2.0</span>
                </h1>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">SAMU 192 • SERRA TALHADA</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchData()}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                title="Sincronizar dados"
              >
                <Plus className="h-4 w-4 rotate-45" /> 
                <span className="hidden sm:inline">Sincronizar</span>
              </button>

              {profile?.role === 'coordenacao' && (
                <button
                  onClick={() => {
                    setIsAdminView(!isAdminView);
                    setIsCreating(false);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${
                    isAdminView 
                    ? 'bg-samu-red text-white shadow-lg shadow-red-200' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <AlertTriangle className={`h-4 w-4 ${isAdminView ? 'animate-pulse' : ''}`} />
                  <span>{isAdminView ? 'Sair do Admin' : 'Admin'}</span>
                </button>
              )}
              <div className="hidden sm:flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="flex flex-col items-end mr-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servidor</span>
                  <span className="text-xs font-bold text-slate-700">{profile?.name}</span>
                </div>
                <button
                  onClick={signOut}
                  className="p-2.5 text-slate-400 hover:text-samu-red hover:bg-red-50 rounded-xl transition-all"
                  title="Sair do Sistema"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 pb-32 px-4 sm:px-6 lg:px-8">
        {isAdminView ? (
          <AdminPanel />
        ) : isCreating ? (
          <CreatePermuta onCancel={() => setIsCreating(false)} onSuccess={fetchData} />
        ) : (
          <div className="space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black text-azul-ferrete tracking-tighter uppercase">Painel de Controle</h2>
                <p className="text-slate-500 text-sm font-medium">Gerencie suas trocas de plantão com segurança digital.</p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center px-6 py-3.5 rounded-2xl shadow-[0_10px_20px_-5px_rgba(232,124,0,0.3)] text-sm font-black uppercase tracking-widest text-white bg-samu-orange hover:bg-samu-orange-light transition-all active:scale-95 group"
              >
                <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                Nova Permuta
              </button>
            </div>

            {/* Painel da Coordenação (Apenas para coordenadores) */}
            {profile.role === 'coordenacao' && (
              <section className="structural-card border-none shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <div className="px-6 py-5 bg-gradient-to-r from-[#004184] to-indigo-900 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">
                        Validação de Coordenação
                      </h3>
                      <p className="text-indigo-100 text-xs font-medium opacity-80">
                        Aprovação final de documentos assinados.
                      </p>
                    </div>
                  </div>
                  <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 tracking-widest uppercase">Pendente</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {permutasCoordenacao.length === 0 ? (
                    <div className="px-8 py-12 text-center">
                      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Inbox className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma demanda pendente</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-50">
                      {permutasCoordenacao.map((p) => (
                        <li key={p.id} className="group hover:bg-slate-50 transition-colors">
                          <div className="px-6 py-5 flex items-center justify-between gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                {p.unitType && (
                                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-tighter">
                                    {p.unitType}
                                  </span>
                                )}
                                <p className="text-sm font-black text-slate-900 truncate">
                                  {p.requesterName} <span className="text-slate-300 font-normal">↔</span> {p.substituteName}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Solicitante</p>
                                  <p className="text-xs font-bold text-slate-600 bg-slate-100/50 p-1.5 rounded-lg inline-block">{p.requesterDate} <span className="mx-1 text-slate-300">•</span> {p.requesterShift}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Substituto</p>
                                  <p className="text-xs font-bold text-slate-600 bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-50 inline-block">{p.date} <span className="mx-1 text-slate-300">•</span> {p.shift}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              <button
                                onClick={() => initiateSign(p.id, 'approved')}
                                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => initiateSign(p.id, 'rejected')}
                                className="w-full sm:w-auto px-5 py-2.5 bg-white text-red-600 text-xs font-black uppercase tracking-widest rounded-xl border border-red-100 hover:bg-red-50 transition-all active:scale-95"
                              >
                                Rejeitar
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {/* Permutas Recebidas (Para Assinar) */}
            <section className="structural-card border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-slate-800">
              <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-samu-orange/10 p-3 rounded-2xl border border-samu-orange/10">
                    <Inbox className="h-6 w-6 text-samu-orange" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                      Convites Recebidos
                    </h3>
                    <p className="text-slate-500 text-xs font-medium">Trocas solicitadas por outros servidores.</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {permutasRecebidas.length === 0 ? (
                  <div className="px-8 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Nenhuma solicitação ativa</div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {permutasRecebidas.map((p) => (
                    <li key={p.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2 mb-1">
                            {p.unitType && <span className="text-[10px] font-bold text-white bg-orange-500 px-2 py-0.5 rounded-full">{p.unitType}</span>}
                            <p className="text-sm font-bold text-orange-900">
                              Solicitante: {p.requesterName} ({p.requesterRole})
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                            <p><span className="font-semibold">Sua Escala:</span> {p.date} ({p.shift})</p>
                            <p><span className="font-semibold">Escala Solicitante:</span> {p.requesterDate} ({p.requesterShift})</p>
                            {p.reason && (
                              <p className="sm:col-span-2 mt-1 italic text-gray-500">
                                <span className="font-semibold not-italic">Motivo:</span> {p.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {p.status === 'pending' || p.status === 'pendente_substituto' ? (
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
                                p.status === 'aprovada' || p.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                p.status === 'pendente_coordenacao' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {p.status === 'aprovada' || p.status === 'approved' ? 'Aprovada' : 
                                 p.status === 'pendente_coordenacao' ? 'Aguardando Coordenação' :
                                 'Rejeitada'}
                              </span>
                              <div className="flex space-x-2 ml-2">
                                {(p.status === 'aprovada' || p.status === 'approved') && (
                                  <>
                                    <button onClick={() => generatePDF(p)} className="p-1.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-full shadow-sm transition-colors" title="Gerar PDF">
                                      <FileText className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => shareWhatsApp(p)} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-full shadow-sm transition-colors" title="Enviar por WhatsApp">
                                      <MessageCircle className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => shareEmail(p)} className="p-1.5 text-white bg-blue-500 hover:bg-blue-600 rounded-full shadow-sm transition-colors" title="Enviar por E-mail">
                                      <Mail className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                                {profile?.role === 'coordenacao' && (
                                  <button 
                                    onClick={() => handleDeletePermuta(p.id)} 
                                    className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded-full shadow-sm transition-colors"
                                    title="Excluir Permuta (Admin)"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Minhas Solicitações */}
            <section className="structural-card border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-slate-800">
              <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-azul-ferrete/5 p-3 rounded-2xl border border-azul-ferrete/10">
                    <Send className="h-6 w-6 text-azul-ferrete" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                      Aguardando Resposta
                    </h3>
                    <p className="text-slate-500 text-xs font-medium">Permutas enviadas a outros servidores.</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {minhasPermutas.length === 0 ? (
                  <div className="px-8 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sem solicitações em aberto</div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {minhasPermutas.map((p) => (
                    <li key={p.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2 mb-1">
                            {p.unitType && <span className="text-[10px] font-bold text-white bg-gray-500 px-2 py-0.5 rounded-full">{p.unitType}</span>}
                            <p className="text-sm font-bold text-gray-900">
                              Substituto: {p.substituteName} ({p.substituteRole})
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                            <p><span className="font-semibold">Escala Substituto:</span> {p.date} ({p.shift})</p>
                            <p><span className="font-semibold">Sua Escala:</span> {p.requesterDate} ({p.requesterShift})</p>
                            {p.reason && (
                              <p className="sm:col-span-2 mt-1 italic text-gray-500">
                                <span className="font-semibold not-italic">Motivo:</span> {p.reason}
                              </p>
                            )}
                          </div>
                        </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              p.status === 'aprovada' || p.status === 'approved' ? 'bg-green-100 text-green-800' : 
                              p.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                              p.status === 'pendente_coordenacao' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {p.status === 'aprovada' || p.status === 'approved' ? 'Aprovada' : 
                               p.status === 'rejected' ? 'Rejeitada' : 
                               p.status === 'pendente_coordenacao' ? 'Aguardando Coordenação' :
                               'Aguardando Substituto'}
                            </span>
                            <div className="flex space-x-2 ml-2">
                              {(p.status === 'aprovada' || p.status === 'approved') && (
                                <>
                                  <button onClick={() => generatePDF(p)} className="p-1.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-full shadow-sm transition-colors" title="Gerar PDF">
                                    <FileText className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => shareWhatsApp(p)} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-full shadow-sm transition-colors" title="Enviar por WhatsApp">
                                    <MessageCircle className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => shareEmail(p)} className="p-1.5 text-white bg-blue-500 hover:bg-blue-600 rounded-full shadow-sm transition-colors" title="Enviar por E-mail">
                                    <Mail className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              {profile?.role === 'coordenacao' && (
                                <button 
                                  onClick={() => handleDeletePermuta(p.id)} 
                                  className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded-full shadow-sm transition-colors"
                                  title="Excluir Permuta (Admin)"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Histórico de Permutas Aprovadas */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg border-t-4 border-green-500">
              <div className="px-4 py-5 sm:px-6 bg-green-50 border-b border-green-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-green-900">
                      Histórico de Permutas Aprovadas
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-green-700">
                      Registro oficial de todas as permutas validadas pela coordenação.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {permutasAprovadas.length} Total
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Unidade</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitante</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Substituto</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {permutasAprovadas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500 italic">Nenhuma permuta aprovada no histórico.</td>
                      </tr>
                    ) : (
                      permutasAprovadas.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{p.date}</div>
                            <div className="text-xs text-gray-500">{p.shift} | {p.unitType}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{p.requesterName}</div>
                            <div className="text-xs text-gray-500">{p.requesterRole}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{p.substituteName}</div>
                            <div className="text-xs text-gray-500">{p.substituteRole}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => generatePDF(p)} 
                                className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                title="Baixar PDF"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => shareWhatsApp(p)} 
                                className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                title="Enviar WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => shareEmail(p)} 
                                className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                title="Enviar E-mail"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                              {profile?.role === 'coordenacao' && (
                                <button 
                                  onClick={() => handleDeletePermuta(p.id)} 
                                  className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  title="Excluir Permuta (Admin)"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
                    Assinatura Digital
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Escolha como deseja assinar este documento. A assinatura interna utiliza sua senha de acesso ao sistema.
                    </p>
                  </div>
                </div>

                {/* Signature Preview */}
                <div className="mt-4 p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none">
                    <SamuLogo className="w-24 h-24" />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-widest relative z-10">Prévia da Assinatura Digital</p>
                  <div className="flex items-start space-x-3 relative z-10">
                    <div className="text-red-600 text-xl">★</div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold">DOCUMENTO ASSINADO DIGITALMENTE</p>
                      <p className="text-xs font-bold text-gray-900">{profile?.name.toUpperCase()}</p>
                      <p className="text-[10px] text-gray-600">
                        {profile?.coren ? `${profile.coren} / ` : ''}CPF {profile?.cpf}
                      </p>
                      <p className="text-[9px] text-gray-500">EM {new Date().toLocaleDateString()} - ÀS {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="space-y-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status da Assinatura</p>
                      <p className="text-xs font-bold text-slate-700">Aguardando sua senha para validar o documento</p>
                    </div>
                  </div>

                  <form onSubmit={confirmSign} className="space-y-4">
                    {signingError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                        {signingError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Senha do Sistema</label>
                      <input
                        type="password"
                        required
                        placeholder="Digite sua senha para assinar"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <SystemSignatureButton 
                        type="submit"
                        loading={isSigning}
                        className="w-full py-3"
                      />
                      <button
                        type="button"
                        onClick={() => setSigningPermutaId(null)}
                        className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar Exclusão</h3>
            <p className="text-sm text-gray-600 mb-6">Tem certeza que deseja excluir esta permuta permanentemente?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeletePermuta}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreatePermuta: React.FC<{ onCancel: () => void, onSuccess?: () => void }> = ({ onCancel, onSuccess }) => {
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
  const [unitType, setUnitType] = useState('');
  const [base, setBase] = useState('');
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
    if (profile?.base) {
      setBase(profile.base);
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
    // Load users to select substitute once when component mounts
    // Using simple getDocs instead of onSnapshot to save quota
    const fetchUsers = async () => {
      try {
        const { getDocs, query, collection } = await import('firebase/firestore');
        const snapshot = await getDocs(query(collection(db, 'users')));
        const usersData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.id !== profile?.uid);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    
    if (profile) {
      fetchUsers();
    }
  }, [profile?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      const substitute = users.find(u => u.id === substituteId);
      if (!substitute) throw new Error("Substituto não encontrado");

      await addDoc(collection(db, 'permutas'), {
        unitType,
        base,
        requesterId: profile.uid,
        requesterName: profile.name, // Auto-filled from logged user
        requesterRole,
        requesterDate,
        requesterShift,
        requesterCpf: profile.cpf || '',
        requesterCoren: profile.coren || '',
        substituteId: substitute.id,
        substituteName: substitute.name,
        substituteRole,
        substituteCpf: substitute.cpf || '',
        substituteCoren: substitute.coren || '',
        date,
        shift,
        reason,
        status: 'pendente_substituto',
        requesterSignedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      window.dispatchEvent(new CustomEvent('show-success-toast', { detail: "Permuta solicitada com sucesso! O substituto foi notificado." }));
      if (onSuccess) onSuccess();
      onCancel();
    } catch (error: any) {
      console.error("Erro ao criar permuta:", error);
      if (error.message && error.message.includes('permission-denied')) {
        handleFirestoreError(error, OperationType.CREATE, 'permutas', false);
      } else {
        window.dispatchEvent(new CustomEvent('show-error-toast', { detail: "Erro ao criar permuta. Verifique os dados e tente novamente." }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSavePDF = async () => {
    if (!substituteId || !date || !shift || !reason || !unitType || !base || !requesterDate || !requesterShift) {
      window.dispatchEvent(new CustomEvent('show-error-toast', { detail: "Preencha todos os campos antes de salvar em PDF." }));
      return;
    }

    const substitute = users.find(u => u.id === substituteId);
    if (!substitute) return;

    const tempPermuta = {
      unitType,
      base,
      requesterId: profile.uid,
      requesterName: profile.name,
      requesterRole,
      requesterCpf: profile.cpf || '',
      requesterCoren: profile.coren || '',
      requesterDate,
      requesterShift,
      substituteId: substitute.id,
      substituteName: substitute.name,
      substituteRole,
      substituteCpf: substitute.cpf || '',
      substituteCoren: substitute.coren || '',
      date,
      shift,
      reason,
      status: 'rascunho',
      createdAt: new Date().toISOString()
    };

    try {
      await generatePDF(tempPermuta);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      window.dispatchEvent(new CustomEvent('show-error-toast', { detail: "Erro ao gerar PDF." }));
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
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Tipo de Unidade</label>
            <select
              required
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            >
              <option value="">Selecione...</option>
              <option value="USA">USA (Unidade de Suporte Avançado)</option>
              <option value="USB">USB (Unidade de Suporte Básico)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Base</label>
            <input
              type="text"
              required
              value={base}
              onChange={(e) => setBase(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="Ex: Serra Talhada"
            />
          </div>
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
              <label className="block text-sm font-medium text-gray-700">Data do Plantão (Solicitante)</label>
              <input
                type="date"
                required
                value={requesterDate}
                onChange={(e) => setRequesterDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Turno (Solicitante)</label>
              <select
                required
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
                  <option key={u.id} value={u.id}>{u.name} ({u.cargo || 'Cargo não informado'})</option>
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
            <label className="block text-sm font-medium text-gray-700">Motivo</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto bg-slate-100 py-3 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSavePDF}
              className="w-full sm:w-auto bg-white py-3 px-6 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all border-dashed flex items-center justify-center active:scale-95"
            >
              <FileText className="w-4 h-4 mr-2" />
              Ver Prévia PDF
            </button>
            <SystemSignatureButton 
              type="submit"
              loading={loading}
              className="w-full sm:w-auto"
              label={loading ? 'Sincronizando...' : 'Finalizar e Enviar'}
            />
          </div>
        </form>
      </div>
    </div>
  );
};
