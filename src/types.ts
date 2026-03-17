export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'servidor' | 'coordenacao';
  matricula: string;
  cargo: string;
  base: string;
  createdAt: string;
}

export interface SignatureData {
  cpf: string;
  timestamp: string;
  ip: string;
}

export interface PermutaData {
  id?: string;
  solicitanteId: string;
  solicitanteNome: string;
  solicitanteMatricula: string;
  solicitanteCargo: string;
  solicitanteBase: string;
  
  substitutoId: string;
  substitutoNome: string;
  substitutoMatricula: string;
  substitutoCargo: string;
  substitutoBase: string;
  
  plantaoOriginalData: string;
  plantaoOriginalHorario: string;
  plantaoDevolucaoData: string;
  plantaoDevolucaoHorario: string;
  justificativa: string;
  
  status: 'pendente_substituto' | 'pendente_coordenacao' | 'aprovada' | 'rejeitada' | 'cancelada';
  createdAt: string;
  updatedAt: string;
  
  assinaturaSolicitante?: SignatureData;
  assinaturaSubstituto?: SignatureData;
  assinaturaCoordenacao?: SignatureData;
}

export interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  permutaId?: string;
}
