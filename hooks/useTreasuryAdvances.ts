import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/config/api';
import type {
  TreasuryAdvancesListResponse,
  TreasuryAdvanceDetailResponse,
  TreasuryAdvanceRequest,
  TreasuryAdvanceApproveRequest,
  TreasuryAdvanceRejectRequest,
  TreasuryAdvanceRepayRequest,
  TreasuryAdvanceResponse,
  TreasuryAdvanceStatus,
} from '@/types/api';

interface TreasuryAdvancesFilters {
  partenaire_id?: string;
  statut?: TreasuryAdvanceStatus;
  limit?: number;
  page?: number;
}

/**
 * Hook pour récupérer la liste des avances de trésorerie
 */
export function useTreasuryAdvances(filters?: TreasuryAdvancesFilters) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['treasury-advances', filters],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.partenaire_id) params.append('partenaire_id', filters.partenaire_id);
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.page) params.append('page', String(filters.page));

      const url = params.toString() 
        ? `${API_ROUTES.treasuryAdvances.list}?${params.toString()}`
        : API_ROUTES.treasuryAdvances.list;

      return apiClient.get<TreasuryAdvancesListResponse>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer les détails d'une avance de trésorerie
 */
export function useTreasuryAdvance(id: string) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['treasury-advance', id],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      if (!id) {
        throw new Error('ID de l\'avance requis');
      }

      return apiClient.get<TreasuryAdvanceDetailResponse>(API_ROUTES.treasuryAdvances.get(id), { accessToken });
    },
    enabled: !!accessToken && !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour créer une demande d'avance de trésorerie
 */
export function useCreateTreasuryAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TreasuryAdvanceRequest) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;
      
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.post<TreasuryAdvanceResponse>(
        API_ROUTES.treasuryAdvances.request,
        data,
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider les queries liées aux avances de trésorerie
      queryClient.invalidateQueries({ queryKey: ['treasury-advances'] });
    },
  });
}

/**
 * Hook pour approuver une avance de trésorerie (Admin uniquement)
 */
export function useApproveTreasuryAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: TreasuryAdvanceApproveRequest }) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;
      
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.put<TreasuryAdvanceResponse>(
        API_ROUTES.treasuryAdvances.approve(id),
        data || {},
        { accessToken }
      );
    },
    onSuccess: (_, variables) => {
      // Invalider les queries
      queryClient.invalidateQueries({ queryKey: ['treasury-advances'] });
      queryClient.invalidateQueries({ queryKey: ['treasury-advance', variables.id] });
    },
  });
}

/**
 * Hook pour rejeter une avance de trésorerie (Admin uniquement)
 */
export function useRejectTreasuryAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TreasuryAdvanceRejectRequest }) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;
      
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.put<TreasuryAdvanceResponse>(
        API_ROUTES.treasuryAdvances.reject(id),
        data,
        { accessToken }
      );
    },
    onSuccess: (_, variables) => {
      // Invalider les queries
      queryClient.invalidateQueries({ queryKey: ['treasury-advances'] });
      queryClient.invalidateQueries({ queryKey: ['treasury-advance', variables.id] });
    },
  });
}

/**
 * Hook pour débloquer les fonds d'une avance (Admin uniquement)
 */
export function useReleaseTreasuryAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;
      
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.put<TreasuryAdvanceResponse>(
        API_ROUTES.treasuryAdvances.release(id),
        {},
        { accessToken }
      );
    },
    onSuccess: (_, id) => {
      // Invalider les queries
      queryClient.invalidateQueries({ queryKey: ['treasury-advances'] });
      queryClient.invalidateQueries({ queryKey: ['treasury-advance', id] });
    },
  });
}

/**
 * Hook pour rembourser une avance de trésorerie
 */
export function useRepayTreasuryAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TreasuryAdvanceRepayRequest }) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;
      
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.put<TreasuryAdvanceResponse>(
        API_ROUTES.treasuryAdvances.repay(id),
        data,
        { accessToken }
      );
    },
    onSuccess: (_, variables) => {
      // Invalider les queries
      queryClient.invalidateQueries({ queryKey: ['treasury-advances'] });
      queryClient.invalidateQueries({ queryKey: ['treasury-advance', variables.id] });
    },
  });
}

