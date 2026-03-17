export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'servidor' | 'coordenacao';
  cargo: string;
  base: string;
  cpf: string;
  coren?: string;
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
  solicitanteCargo: string;
  solicitanteBase: string;
  solicitanteCoren?: string;
  
  substitutoId: string;
  substitutoNome: string;
  substitutoCargo: string;
  substitutoBase: string;
  substitutoCoren?: string;
  
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
