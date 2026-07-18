'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UsuarioData {
  nome: string;
  email: string;
  criadoEm: string;
}

interface AuthContextType {
  user: User | null;
  usuarioData: UsuarioData | null;
  loading: boolean;
  login: (email: string, password: string, lembrar: boolean) => Promise<void>;
  cadastrar: (nome: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usuarioData, setUsuarioData] = useState<UsuarioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Load user data from Firestore (may fail if Firestore not yet created)
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          if (userDoc.exists()) {
            setUsuarioData(userDoc.data() as UsuarioData);
          } else {
            // Firestore exists but no user doc yet — use email as fallback
            setUsuarioData({
              nome: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
              email: firebaseUser.email || '',
              criadoEm: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn('[Auth] Erro ao carregar dados do usuário do Firestore:', err);
          // Firestore not ready — use Firebase Auth data as fallback
          setUsuarioData({
            nome: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
            email: firebaseUser.email || '',
            criadoEm: new Date().toISOString(),
          });
        }
      } else {
        setUsuarioData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, lembrar: boolean) => {
    // Firebase Auth persistence
    const { browserLocalPersistence, browserSessionPersistence } = await import('firebase/auth');
    await auth.setPersistence(lembrar ? browserLocalPersistence : browserSessionPersistence);

    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Load user profile from Firestore (may fail if not ready)
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', cred.user.uid));
      if (userDoc.exists()) {
        setUsuarioData(userDoc.data() as UsuarioData);
      } else {
        setUsuarioData({
          nome: cred.user.displayName || cred.user.email?.split('@')[0] || 'Usuário',
          email: cred.user.email || '',
          criadoEm: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('[Auth] Erro ao carregar perfil do Firestore após login:', err);
      setUsuarioData({
        nome: cred.user.displayName || cred.user.email?.split('@')[0] || 'Usuário',
        email: cred.user.email || '',
        criadoEm: new Date().toISOString(),
      });
    }

    // Save "remember" flag in localStorage for UI
    if (lembrar) {
      localStorage.setItem('gastos-lembrar', 'true');
      localStorage.setItem('gastos-email', email);
    } else {
      localStorage.removeItem('gastos-lembrar');
      localStorage.removeItem('gastos-email');
    }
  };

  const cadastrar = async (nome: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Save user profile in "usuarios" collection (may fail if Firestore not ready)
    const newUsuarioData: UsuarioData = {
      nome,
      email,
      criadoEm: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'usuarios', cred.user.uid), newUsuarioData);
    } catch (err) {
      console.warn('[Auth] Erro ao salvar perfil no Firestore após cadastro:', err);
      // Continue anyway — user is authenticated, profile can be saved later
    }

    setUsuarioData(newUsuarioData);
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('gastos-lembrar');
    localStorage.removeItem('gastos-email');
  };

  return (
    <AuthContext.Provider
      value={{ user, usuarioData, loading, login, cadastrar, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
