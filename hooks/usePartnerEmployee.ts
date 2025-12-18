import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/config/api';
import type {
  PartnerEmployeesResponse,
  PartnerEmployeeStats,
  PartnerEmployeeAvisResponse,
} from '@/types/api';

interface PartnerEmployeeFilters {
  search?: string;
  typeContrat?: string;
  actif?: boolean;
  poste?: string;
  employee_id?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  page?: number;
}

/**
 * Hook pour récupérer les employés du partenaire
 */
export function usePartnerEmployees(filters?: PartnerEmployeeFilters) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'employees', filters],
    queryFn: async (): Promise<PartnerEmployeesResponse> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.typeContrat) params.append('typeContrat', filters.typeContrat);
      if (filters?.actif !== undefined) params.append('actif', String(filters.actif));
      if (filters?.poste) params.append('poste', filters.poste);
      if (filters?.employee_id) params.append('employee_id', filters.employee_id);
      if (filters?.sortBy) params.append('sortBy', filters.sortBy);
      if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.page) params.append('page', String(filters.page));

      const url = `${API_ROUTES.partnerEmployee.list}${params.toString() ? `?${params.toString()}` : ''}`;

      return apiClient.get<PartnerEmployeesResponse>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer les statistiques des employés
 */
export function usePartnerEmployeeStats() {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'employees', 'stats'],
    queryFn: async (): Promise<PartnerEmployeeStats> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get<PartnerEmployeeStats>(API_ROUTES.partnerEmployee.stats, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour récupérer les avis des employés
 */
export function usePartnerEmployeeAvis(filters?: {
  userId?: string;
  typeRetour?: string;
  approuve?: boolean;
  limit?: number;
  page?: number;
}) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'employees', 'avis', filters],
    queryFn: async (): Promise<PartnerEmployeeAvisResponse> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.typeRetour) params.append('typeRetour', filters.typeRetour);
      if (filters?.approuve !== undefined) params.append('approuve', String(filters.approuve));
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.page) params.append('page', String(filters.page));

      const url = `${API_ROUTES.partnerEmployee.avis}${params.toString() ? `?${params.toString()}` : ''}`;

      return apiClient.get<PartnerEmployeeAvisResponse>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

