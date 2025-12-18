"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLogin, useLogout, useUserProfile, useRefreshToken } from "./useAuth";
import type { LoginResponse, UserProfileResponse } from "@/types/api";

// Types pour la session
export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  admin: any;
  partner: {
    id: string;
    companyName: string;
    legalStatus?: string;
    activityDomain?: string;
    email: string;
    phone?: string;
    headquartersAddress?: string;
    employeesCountMin?: number;
    employeesCountMax?: number;
    status: string;
    logoUrl?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  employee?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone?: string;
    partenaireId: string;
    poste?: string;
    matricule?: string;
    photoUrl?: string | null;
    typeContrat?: string;
    salaireNet?: number;
    dateEmbauche?: string;
    actif?: boolean;
  } | null;
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

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
  isSessionValid: () => boolean;
}

// Configuration du refresh automatique
const TOKEN_REFRESH_INTERVAL = 8 * 60 * 1000; // 8 minutes (avant l'expiration de 10 minutes)

export function useEdgeAuth(): UseEdgeAuthReturn {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Hooks react-query
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const refreshTokenMutation = useRefreshToken();
  
  // Récupérer le token depuis localStorage
  const getAccessToken = () => localStorage.getItem('accessToken') || undefined;
  const getRefreshToken = () => localStorage.getItem('refreshToken') || undefined;

  // Query pour le profil utilisateur
  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile(getAccessToken());

  // Références pour le refresh automatique
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);

  // Convertir LoginResponse en AuthSession
  const convertToAuthSession = useCallback((data: LoginResponse | UserProfileResponse): AuthSession | null => {
    if ('user' in data && data.user) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        admin: data.user,
        partner: 'partner_info' in data ? data.partner_info || null : null,
        employee: 'employee_info' in data ? data.employee_info || null : null,
        access_token: 'accessToken' in data ? data.accessToken : getAccessToken() || '',
        refresh_token: 'refreshToken' in data ? data.refreshToken : getRefreshToken() || '',
      };
    }
    return null;
  }, []);

  // Récupérer la session depuis le localStorage au démarrage
  useEffect(() => {
    const initializeSession = () => {
      try {
        const storedSession = localStorage.getItem("partner_session");
        const accessToken = getAccessToken();
        
        if (storedSession && accessToken) {
          const parsedSession = JSON.parse(storedSession);
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

  // Mettre à jour la session quand le profil est chargé
  useEffect(() => {
    if (profileData && !profileLoading) {
      const newSession = convertToAuthSession(profileData);
      if (newSession) {
        setSession(newSession);
        localStorage.setItem("partner_session", JSON.stringify(newSession));
      }
    }
  }, [profileData, profileLoading, convertToAuthSession]);

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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    } catch (error) {
      console.error("Erreur lors de la suppression de la session:", error);
    }
  }, []);

  // Fonction de déconnexion avec redirection
  const logoutWithRedirect = useCallback(async () => {
    if (isLoggingOutRef.current) {
      console.log("🚪 Déconnexion déjà en cours, ignorée");
      return;
    }

    try {
      isLoggingOutRef.current = true;
      console.log("🚪 Déconnexion automatique en cours...");

      // Arrêter le refresh automatique
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }

      // Nettoyer la session
      setSession(null);
      clearSession();
      setError(null);

      console.log("✅ Déconnexion terminée, redirection vers /login");

      // Rediriger vers la page de connexion seulement si on n'y est pas déjà
      if (window.location.pathname !== "/login") {
        router.push("/login");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la déconnexion:", error);
      if (window.location.pathname !== "/login") {
        router.push("/login");
      }
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [router, clearSession]);

  // Fonction de connexion
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        setLoading(true);
        setError(null);

        const response = await loginMutation.mutateAsync(credentials);

        if (response && response.accessToken) {
          const sessionData: AuthSession = {
            user: {
              id: response.user.id,
              email: response.user.email,
            },
            admin: response.user,
            partner: response.partner_info || null,
            employee: response.employee_info || null,
            access_token: response.accessToken,
            refresh_token: response.refreshToken || "",
          };

          setSession(sessionData);
          saveSession(sessionData);

          return { error: null, session: sessionData };
        } else {
          const errorMessage = response?.message || "Erreur de connexion";
          setError(errorMessage);
          return { error: { message: errorMessage } };
        }
      } catch (error: any) {
        // Gérer les erreurs ApiError correctement
        let errorMessage = "Erreur de connexion";
        if (error?.message) {
          errorMessage = error.message;
        } else if (error?.data?.message) {
          errorMessage = error.data.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        setError(errorMessage);
        return { error: { message: errorMessage } };
      } finally {
        setLoading(false);
      }
    },
    [loginMutation, saveSession]
  );

  // Fonction de déconnexion
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = getAccessToken();
      
      if (accessToken) {
        await logoutMutation.mutateAsync(accessToken);
      }

      setSession(null);
      clearSession();
      setError(null);

      // Arrêter le refresh automatique
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [logoutMutation, clearSession]);

  // Fonction de refresh automatique
  const startAutoRefresh = useCallback(() => {
    // Nettoyer l'interval précédent
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Démarrer le refresh automatique
    refreshIntervalRef.current = setInterval(async () => {
      if (isRefreshingRef.current) {
        console.log("🔄 Refresh automatique ignoré - refresh en cours");
        return;
      }

      try {
        isRefreshingRef.current = true;
        console.log("🔄 Refresh automatique du token en cours...");

        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await refreshTokenMutation.mutateAsync(refreshToken);

          if (response && response.accessToken) {
            // Refetch le profil avec le nouveau token
            await refetchProfile();
            console.log("✅ Refresh automatique du token terminé avec succès");
          } else {
            console.log("❌ Session invalide lors du refresh automatique");
            await logoutWithRedirect();
          }
        } else {
          console.log("❌ Pas de refresh token disponible");
          await logoutWithRedirect();
        }
      } catch (error) {
        console.error("❌ Erreur lors du refresh automatique:", error);
        await logoutWithRedirect();
      } finally {
        isRefreshingRef.current = false;
      }
    }, TOKEN_REFRESH_INTERVAL);

    console.log(
      `🔄 Refresh automatique configuré toutes les ${
        TOKEN_REFRESH_INTERVAL / 60000
      } minutes`
    );
  }, [refreshTokenMutation, refetchProfile, logoutWithRedirect]);

  // Démarrer le refresh automatique quand la session est disponible
  useEffect(() => {
    if (session?.access_token && getRefreshToken()) {
      startAutoRefresh();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [session?.access_token, startAutoRefresh]);

  // Fonction de rafraîchissement de session
  const refreshSession = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await refetchProfile();
      console.log("✅ Session rafraîchie avec succès");
    } catch (error: any) {
      console.error("Erreur lors du rafraîchissement de session:", error);
      const refreshToken = getRefreshToken();
      
      if (refreshToken) {
        try {
          await refreshTokenMutation.mutateAsync(refreshToken);
          await refetchProfile();
        } catch (refreshError) {
          console.log("🔑 Token expiré détecté, déconnexion automatique");
          await logoutWithRedirect();
        }
      } else {
        await logoutWithRedirect();
      }
    } finally {
      setLoading(false);
    }
  }, [refetchProfile, refreshTokenMutation, logoutWithRedirect]);

  // Fonction pour vérifier si la session est valide
  const isSessionValid = useCallback(() => {
    return !!(session?.access_token && session?.admin && (session?.partner || session?.employee));
  }, [session]);

  // Fonction pour effacer les erreurs
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    session,
    loading: loading || profileLoading,
    error,
    login,
    logout,
    refreshSession,
    clearError,
    isSessionValid,
  };
}
