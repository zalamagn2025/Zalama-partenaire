import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/config/api';
import {
  PartnerLoginRequestSchema,
  PartnerLoginResponseSchema,
  PartnerGetMeResponseSchema,
  ApiKeyResponseSchema,
  type PartnerLoginRequest,
  type PartnerLoginResponse,
  type PartnerGetMeResponse,
  type ApiKeyResponse,
} from '@/types/api';

/**
 * Hook pour la connexion partenaire
 */
export function usePartnerLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PartnerLoginRequest): Promise<PartnerLoginResponse> => {
      const validated = PartnerLoginRequestSchema.parse(data);
      
      console.log('🔐 Tentative de connexion partenaire:', { email: validated.email, route: API_ROUTES.partnerAuth.login });
      
      try {
        const response = await apiClient.post<any>(
          API_ROUTES.partnerAuth.login,
          validated
        );
        
        console.log('📦 Réponse brute de l\'API:', response);
        
        // Valider la réponse avec Zod
        const validatedResponse = PartnerLoginResponseSchema.parse(response);
        
        // Stocker les tokens (l'API retourne access_token et refresh_token en snake_case)
        if (validatedResponse.access_token) {
          localStorage.setItem('accessToken', validatedResponse.access_token);
        }
        if (validatedResponse.refresh_token) {
          localStorage.setItem('refreshToken', validatedResponse.refresh_token);
        }
        
        console.log('✅ Connexion réussie, tokens stockés');
        
        return validatedResponse;
      } catch (error: any) {
        console.error('❌ Erreur lors de la connexion:', {
          message: error.message,
          statusCode: error.statusCode,
          data: error.data,
          errorObject: error,
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalider les queries pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['partner', 'me'] });
    },
  });
}

/**
 * Hook pour récupérer les informations du partenaire connecté
 */
export function usePartnerGetMe() {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'me'],
    queryFn: async (): Promise<PartnerGetMeResponse> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get<PartnerGetMeResponse>(
        API_ROUTES.partnerAuth.getme,
        { accessToken }
      );
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour récupérer la clé API du partenaire
 */
export function usePartnerApiKey() {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'api-key'],
    queryFn: async (): Promise<ApiKeyResponse> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get<ApiKeyResponse>(
        API_ROUTES.partnerAuth.apiKey,
        { accessToken }
      );
    },
    enabled: !!accessToken,
  });
}

/**
 * Hook pour régénérer la clé API du partenaire
 */
export function useRegeneratePartnerApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ApiKeyResponse> => {
      const accessToken = localStorage.getItem('accessToken') || undefined;
      
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.post<ApiKeyResponse>(
        API_ROUTES.partnerAuth.regenerateApiKey,
        {},
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider la query de la clé API pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['partner', 'api-key'] });
    },
  });
}

