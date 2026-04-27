import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { login, register, getMe } from "../services/api";

interface User {
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on app launch ──────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync("token");
        if (savedToken) {
          setToken(savedToken);
          const me = await getMe();
          setUser(me);
        }
      } catch {
        await SecureStore.deleteItemAsync("token");
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await login(email, password);
    await SecureStore.setItemAsync("token", data.access_token);
    setToken(data.access_token);
    const me = await getMe();
    setUser(me);
  };

  const signUp = async (formData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }) => {
    await register(formData);
    await signIn(formData.email, formData.password);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);