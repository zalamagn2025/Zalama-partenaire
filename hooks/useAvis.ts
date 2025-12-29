import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/config/api';

// Types pour les avis
export interface Avis {
  id: string;
  note: number;
  commentaire?: string;
  typeRetour?: 'positif' | 'negatif';
  approuve: boolean;
  dateAvis: string;
  userId?: string;
  partnerId?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AvisListResponse {
  data: Avis[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AvisResponse {
  id: string;
  note: number;
  commentaire?: string;
  typeRetour?: 'positif' | 'negatif';
  approuve: boolean;
  dateAvis: string;
}

export interface AvisStatistics {
  total: number;
  moyenneNote: number;
  avisPositifs: number;
  avisNegatifs: number;
  avisApprouves: number;
  avisEnAttente: number;
  repartitionNotes: Array<{
    note: number;
    count: number;
  }>;
  repartitionParPartenaire?: Array<{
    partnerId: string;
    partnerName: string;
    count: number;
    moyenne: string;
  }>;
}

export interface AvisFilters {
  userId?: string;
  typeRetour?: 'positif' | 'negatif';
  approuve?: boolean;
  partnerId?: string;
  limit?: number;
  page?: number;
}

export interface CreateAvisRequest {
  note: number;
  commentaire: string;
  typeRetour: 'positif' | 'negatif';
}

export interface UpdateAvisRequest {
  approuve?: boolean;
  note?: number;
  commentaire?: string;
  typeRetour?: 'positif' | 'negatif';
}

/**
 * Hook pour récupérer la liste des avis
 */
export function useAvis(filters?: AvisFilters) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['avis', filters],
    queryFn: async (): Promise<AvisListResponse> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.typeRetour) params.append('typeRetour', filters.typeRetour);
      if (filters?.approuve !== undefined) params.append('approuve', String(filters.approuve));
      if (filters?.partnerId) params.append('partnerId', filters.partnerId);
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.page) params.append('page', String(filters.page));

      const url = `${API_ROUTES.avis.list}${params.toString() ? `?${params.toString()}` : ''}`;

      return apiClient.get<AvisListResponse>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer un avis par ID
 */
export function useAvisById(id: string) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['avis', id],
    queryFn: async (): Promise<AvisResponse> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get<AvisResponse>(API_ROUTES.avis.get(id), { accessToken });
    },
    enabled: !!accessToken && !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer les statistiques des avis
 */
export function useAvisStatistics(partnerId?: string) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['avis', 'statistics', partnerId],
    queryFn: async (): Promise<AvisStatistics> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (partnerId) params.append('partnerId', partnerId);

      const url = `${API_ROUTES.avis.statistics}${params.toString() ? `?${params.toString()}` : ''}`;

      return apiClient.get<AvisStatistics>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour créer un nouvel avis
 */
export function useCreateAvis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAvisRequest) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;

      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.post<AvisResponse>(
        API_ROUTES.avis.create,
        data,
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider les queries pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['avis'] });
      queryClient.invalidateQueries({ queryKey: ['avis', 'statistics'] });
    },
  });
}

/**
 * Hook pour mettre à jour un avis
 */
export function useUpdateAvis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAvisRequest;
    }) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;

      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.put<AvisResponse>(
        API_ROUTES.avis.update(id),
        data,
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider les queries pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['avis'] });
      queryClient.invalidateQueries({ queryKey: ['avis', 'statistics'] });
    },
  });
}

/**
 * Hook pour supprimer un avis
 */
export function useDeleteAvis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;

      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.delete<void>(
        API_ROUTES.avis.delete(id),
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider les queries pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['avis'] });
      queryClient.invalidateQueries({ queryKey: ['avis', 'statistics'] });
    },
  });
}

/**
 * Hook pour approuver un avis
 */
export function useApproveAvis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;

      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.patch<AvisResponse>(
        API_ROUTES.avis.approve(id),
        {},
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider les queries pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['avis'] });
      queryClient.invalidateQueries({ queryKey: ['avis', 'statistics'] });
    },
  });
}

/**
 * Hook pour rejeter un avis
 */
export function useRejectAvis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;

      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.patch<AvisResponse>(
        API_ROUTES.avis.reject(id),
        {},
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider les queries pour forcer le refetch
      queryClient.invalidateQueries({ queryKey: ['avis'] });
      queryClient.invalidateQueries({ queryKey: ['avis', 'statistics'] });
    },
  });
}

