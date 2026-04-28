import { auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, shouldThrow = true) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  
  const opMap: Record<string, string> = {
    create: "criar",
    update: "atualizar",
    delete: "excluir",
    list: "listar",
    get: "acessar",
    write: "salvar"
  };
  const op = opMap[operationType] || "acessar";
  
  let friendlyMessage = `Acesso Negado: Você não tem permissão para ${op} estes dados. Por favor, verifique seu acesso ou contate a coordenação.`;
  
  if (errInfo.error.includes('Quota exceeded')) {
    friendlyMessage = "LIMITE DE USO ATINGIDO: O banco de dados gratuito do Firebase atingiu o limite diário de leituras. O sistema voltará a funcionar automaticamente amanhã à medida que a cota for resetada pelo Google. Desculpe o transtorno.";
  }

  // Dispatch event to show friendly message in UI
  window.dispatchEvent(new CustomEvent('show-error-toast', { detail: friendlyMessage }));

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}
