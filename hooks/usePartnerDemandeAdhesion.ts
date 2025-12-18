import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/config/api';
import type {
  PartnerDemandeAdhesionResponse,
  PartnerDemandeAdhesionStats,
} from '@/types/api';

interface PartnerDemandeAdhesionFilters {
  search?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_REVIEW';
  limit?: number;
  page?: number;
}

interface ApproveDemandeAdhesionRequest {
  comment?: string;
  salaireNet?: number;
  poste?: string;
  matricule?: string;
  typeContrat?: string;
}

interface RejectDemandeAdhesionRequest {
  reason?: string;
}

/**
 * Hook pour récupérer les demandes d'adhésion
 */
export function usePartnerDemandeAdhesion(filters?: PartnerDemandeAdhesionFilters) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'demande-adhesion', filters],
    queryFn: async (): Promise<PartnerDemandeAdhesionResponse> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.page) params.append('page', String(filters.page));

      const url = `${API_ROUTES.partnerDemandeAdhesion.list}${params.toString() ? `?${params.toString()}` : ''}`;

      return apiClient.get<PartnerDemandeAdhesionResponse>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer une demande d'adhésion par ID
 */
export function usePartnerDemandeAdhesionById(id: string) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'demande-adhesion', id],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get(API_ROUTES.partnerDemandeAdhesion.getById(id), { accessToken });
    },
    enabled: !!accessToken && !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer les statistiques des demandes d'adhésion
 */
export function usePartnerDemandeAdhesionStats() {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'demande-adhesion', 'stats'],
    queryFn: async (): Promise<PartnerDemandeAdhesionStats> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get<PartnerDemandeAdhesionStats>(
        API_ROUTES.partnerDemandeAdhesion.stats,
        { accessToken }
      );
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour approuver une demande d'adhésion
 */
export function useApproveDemandeAdhesion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ApproveDemandeAdhesionRequest;
    }) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;

      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.patch(
        API_ROUTES.partnerDemandeAdhesion.approve(id),
        data,
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider les queries pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['partner', 'demande-adhesion'] });
      queryClient.invalidateQueries({ queryKey: ['partner', 'employees'] });
    },
  });
}

/**
 * Hook pour rejeter une demande d'adhésion
 */
export function useRejectDemandeAdhesion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: RejectDemandeAdhesionRequest;
    }) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;

      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.patch(
        API_ROUTES.partnerDemandeAdhesion.reject(id),
        data,
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider les queries pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['partner', 'demande-adhesion'] });
    },
  });
}

