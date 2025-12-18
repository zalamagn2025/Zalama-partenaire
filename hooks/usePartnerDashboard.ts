import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/config/api';
import type { PartnerDashboardData } from '@/types/api';

/**
 * Hook pour récupérer les données du dashboard partenaire
 */
export function usePartnerDashboardData() {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'dashboard', 'data'],
    queryFn: async (): Promise<PartnerDashboardData> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get<PartnerDashboardData>(
        API_ROUTES.partnerDashboard.dashboardData,
        { accessToken }
      );
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour récupérer toutes les données du dashboard partenaire
 * Route: GET /partner-dashboard/data
 * @param year - Année (optionnel)
 * @param month - Mois (1-12, optionnel)
 */
export function usePartnerDashboardAllData(year?: number, month?: number) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'dashboard', 'all-data', year, month],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());

      const url = params.toString() 
        ? `${API_ROUTES.partnerDashboard.data}?${params.toString()}`
        : API_ROUTES.partnerDashboard.data;

      const response = await apiClient.get<import('@/types/api').PartnerDashboardDataResponse>(
        url,
        { accessToken }
      );

      // Retourner directement les données (data) de la réponse
      return response.data;
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

