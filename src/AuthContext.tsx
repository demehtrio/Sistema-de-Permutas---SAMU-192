import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  cargo?: string;
  base?: string;
  cpf?: string;
  coren?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        setLoading(true);
        const docRef = doc(db, 'users', currentUser.uid);

        // First, try to get from cache to be responsive and save quota
        getDoc(docRef).then((docSnap) => {
          if (docSnap.exists()) {
            setProfile({ uid: currentUser.uid, ...docSnap.data() } as UserProfile);
            setLoading(false);
          }
        }).catch(() => {
          // Ignore cache errors
        });

        // Use onSnapshot for real-time, but handle quota explicitly
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ uid: currentUser.uid, ...docSnap.data() } as UserProfile);
          } else {
            console.warn('User profile not found in Firestore for UID:', currentUser.uid);
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error('Error listening to user profile:', error);
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`, false);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
