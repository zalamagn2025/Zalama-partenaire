"use client";

import React, { createContext, useContext } from "react";
import { useAuth, type AuthSession, type LoginRequest } from "@/hooks/useAuth";

interface EdgeAuthContextType {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  login: (
    credentials: LoginRequest
  ) => Promise<{ error: any; session?: AuthSession | null }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  isSessionValid: () => boolean;
}

const EdgeAuthContext = createContext<EdgeAuthContextType | undefined>(
  undefined
);

export function EdgeAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return (
    <EdgeAuthContext.Provider value={auth}>{children}</EdgeAuthContext.Provider>
  );
}

export function useEdgeAuthContext() {
  const context = useContext(EdgeAuthContext);
  if (context === undefined) {
    throw new Error(
      "useEdgeAuthContext must be used within an EdgeAuthProvider"
    );
  }
  return context;
}
