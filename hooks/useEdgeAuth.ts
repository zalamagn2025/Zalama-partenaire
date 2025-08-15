"use client";

import { useState, useEffect, useCallback } from "react";
import {
  edgeFunctionService,
  AuthSession,
  LoginRequest,
} from "@/lib/edgeFunctionService";

interface UseEdgeAuthReturn {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  login: (
    credentials: LoginRequest
  ) => Promise<{ error: any; session?: AuthSession | null }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export function useEdgeAuth(): UseEdgeAuthReturn {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer la session depuis le localStorage au démarrage
  useEffect(() => {
    const initializeSession = () => {
      try {
        const storedSession = localStorage.getItem("partner_session");
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          // Vérifier si la session n'est pas expirée (tokens valides)
          if (parsedSession.access_token) {
            setSession(parsedSession);
          } else {
            localStorage.removeItem("partner_session");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la session:", error);
        localStorage.removeItem("partner_session");
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  // Sauvegarder la session dans le localStorage
  const saveSession = useCallback((sessionData: AuthSession) => {
    try {
      localStorage.setItem("partner_session", JSON.stringify(sessionData));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la session:", error);
    }
  }, []);

  // Supprimer la session du localStorage
  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem("partner_session");
    } catch (error) {
      console.error("Erreur lors de la suppression de la session:", error);
    }
  }, []);

  // Fonction de connexion
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        setLoading(true);
        setError(null);

        const response = await edgeFunctionService.login(credentials);

        if (
          response.success &&
          response.user &&
          response.partner_info &&
          response.access_token
        ) {
          const sessionData: AuthSession = {
            user: {
              id: response.user.id,
              email: response.user.email,
            },
            admin: response.user,
            partner: response.partner_info,
            access_token: response.access_token,
            refresh_token: response.refresh_token || "",
          };

          setSession(sessionData);
          saveSession(sessionData);

          return { error: null, session: sessionData };
        } else {
          const errorMessage = response.message || "Erreur de connexion";
          setError(errorMessage);
          return { error: { message: errorMessage } };
        }
      } catch (error: any) {
        const errorMessage = error.message || "Erreur de connexion";
        setError(errorMessage);
        return { error: { message: errorMessage } };
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  // Fonction de déconnexion
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setSession(null);
      clearSession();
      setError(null);
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  // Fonction de rafraîchissement de session
  const refreshSession = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await edgeFunctionService.getMe(session.access_token);

      if (
        response.success &&
        response.data?.user &&
        response.data?.partner_info
      ) {
        const sessionData: AuthSession = {
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
          },
          admin: response.data.user,
          partner: response.data.partner_info,
          access_token: session.access_token, // Garder le même token
          refresh_token: session.refresh_token,
        };

        setSession(sessionData);
        saveSession(sessionData);
      } else {
        // Si la session n'est plus valide, déconnecter
        await logout();
      }
    } catch (error: any) {
      console.error("Erreur lors du rafraîchissement de session:", error);
      // Si l'erreur indique un token invalide, déconnecter
      if (
        error.message?.includes("token") ||
        error.message?.includes("unauthorized")
      ) {
        await logout();
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [session, saveSession, logout]);

  // Fonction pour effacer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    session,
    loading,
    error,
    login,
    logout,
    refreshSession,
    clearError,
  };
}
