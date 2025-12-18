/**
 * Hook pour l'authentification avec react-query
 */

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
      
      try {
        const response = await apiClient.post<LoginResponse>(
          API_ROUTES.auth.login,
          validated
        );
        
        console.log('✅ Connexion réussie:', {
          success: response.success,
          hasToken: !!response.accessToken,
          hasPartnerInfo: !!response.partner_info,
        });

        // Stocker les tokens dans le localStorage
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
        }
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }

        return response;
      } catch (error: any) {
        console.error('❌ Erreur lors de la connexion:', {
          error,
          message: error?.message,
          statusCode: error?.statusCode,
          url: error?.data?.url,
        });
        throw error;
      }

      // Stocker les tokens dans le localStorage
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
      }
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
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
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
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
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async (): Promise<UserProfileResponse> => {
      const token = accessToken || localStorage.getItem('accessToken') || undefined;
      
      if (!token) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get<UserProfileResponse>(API_ROUTES.auth.me, {
        accessToken: token,
      });
    },
    enabled: !!accessToken || !!localStorage.getItem('accessToken'),
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
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
      }
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
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
      const accessToken = localStorage.getItem('accessToken') || undefined;
      
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

