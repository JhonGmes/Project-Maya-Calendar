
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../services/supabaseClient";
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
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!isLocalMode) setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isLocalMode]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) setUser(data.user);
  }

  async function signOut() {
    await supabase.auth.signOut();
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
