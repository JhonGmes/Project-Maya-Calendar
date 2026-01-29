
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";
import { StorageService } from "../services/storage";
import { User } from "@supabase/supabase-js";

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLocalMode: boolean;
  setLocalMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(StorageService.isLocalMode());

  useEffect(() => {
    if (isLocalMode) {
        setLoading(false);
        return;
    }

    const initAuth = async () => {
        try {
            if (isSupabaseConfigured) {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                setUser(session?.user ?? null);
            } else {
                // Se não estiver configurado, não tenta conectar
                setUser(null);
            }
        } catch (error) {
            console.warn("Auth Init Error (Supabase not reachable):", error);
            // Fallback silencioso
        } finally {
            setLoading(false);
        }
    };

    initAuth();

    // Setup listener only if configured
    if (isSupabaseConfigured) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }
  }, [isLocalMode]);

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) throw new Error("Banco de dados não configurado. Use o Modo Offline.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string) {
    if (!isSupabaseConfigured) throw new Error("Banco de dados não configurado.");
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) setUser(data.user);
  }

  async function signOut() {
    if (isSupabaseConfigured) {
        await supabase.auth.signOut();
    }
    setUser(null);
    if (isLocalMode) {
        setLocalMode(false);
    }
  }

  function setLocalMode(enabled: boolean) {
      StorageService.setLocalMode(enabled);
      setIsLocalMode(enabled);
      if (enabled) setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isLocalMode, setLocalMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
