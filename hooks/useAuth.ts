/**
 * Hook pour l'authentification avec react-query
 * Gère l'authentification pour les gestionnaires/RH/responsables avec les routes /auth/
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/config/api';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
  UserProfileResponse,
} from '@/types/api';
import { LoginRequestSchema, ResetPasswordRequestSchema, ForgotPasswordRequestSchema, ChangePasswordRequestSchema } from '@/types/api';

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

interface UseAuthReturn {
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
const TOKEN_REFRESH_INTERVAL = 8 * 60 * 1000; // 8 minutes

/**
 * Hook pour la connexion
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      // Valider les données
      const validated = LoginRequestSchema.parse(credentials);
      
      console.log('🔐 Tentative de connexion:', {
        email: validated.email,
        route: API_ROUTES.auth.login,
      });
      
      const response = await apiClient.post<LoginResponse>(
        API_ROUTES.auth.login,
        validated
      );
      
      // L'API retourne access_token et refresh_token en snake_case
      const accessToken = response.access_token || response.accessToken;
      const refreshToken = response.refresh_token || response.refreshToken;
      
      console.log('✅ Connexion réussie:', {
        success: response.success,
        hasToken: !!accessToken,
        hasPartnerInfo: !!response.partner_info,
      });

      // Stocker les tokens dans le localStorage
      if (typeof window !== 'undefined') {
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
      }

      return response;
    },
    onSuccess: () => {
      // Invalider et refetch le profil utilisateur
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/**
 * Hook principal pour gérer l'authentification et la session
 * Remplace useEdgeAuth
 */
export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Hooks react-query
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile();
  const refreshTokenMutation = useRefreshToken();

  // Références pour le refresh automatique
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);

  // Convertir LoginResponse ou UserProfileResponse en AuthSession
  const convertToAuthSession = useCallback((data: LoginResponse | UserProfileResponse): AuthSession | null => {
    if ('user' in data && data.user) {
      // L'API peut retourner access_token/refresh_token (snake_case) ou accessToken/refreshToken (camelCase)
      const accessToken = ('access_token' in data ? data.access_token : undefined) || 
                         ('accessToken' in data ? data.accessToken : undefined) ||
                         (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null) || '';
      const refreshToken = ('refresh_token' in data ? data.refresh_token : undefined) || 
                          ('refreshToken' in data ? data.refreshToken : undefined) ||
                          (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null) || '';
      
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        admin: data.user,
        partner: 'partner_info' in data ? data.partner_info || null : null,
        employee: 'employee_info' in data ? data.employee_info || null : null,
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    }
    return null;
  }, []);

  // Récupérer la session depuis le localStorage au démarrage
  useEffect(() => {
    const initializeSession = () => {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      try {
        const storedSession = localStorage.getItem("partner_session");
        const accessToken = localStorage.getItem('accessToken');
        
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
        if (typeof window !== 'undefined') {
          localStorage.removeItem("partner_session");
        }
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
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem("partner_session", JSON.stringify(sessionData));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la session:", error);
    }
  }, []);

  // Supprimer la session du localStorage
  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    
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

        // L'API retourne access_token et refresh_token en snake_case
        const accessToken = response.access_token || response.accessToken;
        const refreshToken = response.refresh_token || response.refreshToken;
        
        if (response && accessToken) {
          const sessionData: AuthSession = {
            user: {
              id: response.user.id,
              email: response.user.email,
            },
            admin: response.user,
            partner: response.partner_info || null,
            employee: response.employee_info || null,
            access_token: accessToken,
            refresh_token: refreshToken || "",
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
      
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (accessToken) {
        await logoutMutation.mutateAsync(accessToken);
      }
      
      // Nettoyer la session localement
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
        console.log("🔄 Refresh automatique de la session en cours...");

        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (refreshToken) {
          await refreshTokenMutation.mutateAsync(refreshToken);
          await refetchProfile();
        }
        console.log("✅ Refresh automatique de la session terminé avec succès");
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
    if (typeof window === 'undefined') return;
    
    if (session?.access_token && localStorage.getItem('refreshToken')) {
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
    if (typeof window === 'undefined') return;
    
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!accessToken || !refreshToken) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await refreshTokenMutation.mutateAsync(refreshToken);
      await refetchProfile();
      console.log("✅ Session rafraîchie avec succès");
    } catch (error: any) {
      console.error("Erreur lors du rafraîchissement de session:", error);
      console.log("🔑 Erreur lors du refresh, déconnexion automatique");
      await logoutWithRedirect();
    } finally {
      setLoading(false);
    }
  }, [refreshTokenMutation, refetchProfile, logoutWithRedirect]);

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

/**
 * Hook pour la déconnexion
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accessToken?: string): Promise<void> => {
      if (accessToken) {
        await apiClient.post(API_ROUTES.auth.logout, undefined, {
          accessToken,
        });
      }

      // Supprimer les tokens du localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    },
    onSuccess: () => {
      // Nettoyer le cache
      queryClient.clear();
    },
  });
}

/**
 * Hook pour récupérer le profil utilisateur
 */
export function useUserProfile(accessToken?: string) {
  // Vérifier si on est côté client avant d'accéder à localStorage
  const getAccessToken = () => {
    if (typeof window === 'undefined') return undefined;
    return accessToken || localStorage.getItem('accessToken') || undefined;
  };

  const token = getAccessToken();
  
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<UserProfileResponse> => {
      const currentToken = accessToken || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null) || undefined;
      
      if (!currentToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get<UserProfileResponse>(API_ROUTES.auth.me, {
        accessToken: currentToken,
      });
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook pour rafraîchir le token
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refreshToken: string): Promise<RefreshTokenResponse> => {
      const request: RefreshTokenRequest = { refreshToken };
      
      const response = await apiClient.post<RefreshTokenResponse>(
        API_ROUTES.auth.refresh,
        request
      );

      // Mettre à jour le token dans le localStorage
      if (typeof window !== 'undefined') {
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
        }
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
      }

      return response;
    },
    onSuccess: () => {
      // Invalider le profil pour le refetch avec le nouveau token
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/**
 * Hook pour demander la réinitialisation du mot de passe
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string): Promise<{ success: boolean; message: string }> => {
      const validated = ForgotPasswordRequestSchema.parse({ email });
      
      return apiClient.post(API_ROUTES.auth.forgotPassword, validated);
    },
  });
}

/**
 * Hook pour réinitialiser le mot de passe
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> => {
      const validated = ResetPasswordRequestSchema.parse(data);
      
      return apiClient.post(API_ROUTES.auth.resetPassword, validated);
    },
  });
}

/**
 * Hook pour changer le mot de passe
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
      const validated = ChangePasswordRequestSchema.parse(data);
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.post<ChangePasswordResponse>(
        API_ROUTES.auth.changePassword,
        validated,
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider le profil pour le refetch
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

