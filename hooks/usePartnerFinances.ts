import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/config/api';
import type {
  PartnerFinancesDemandesResponse,
  PartnerFinancesRemboursementsResponse,
  PartnerFinancesStats,
  PartnerFinancesEvolutionMensuelle,
  PartnerFinancesEmployeeStats,
} from '@/types/api';

interface PartnerFinancesDemandesFilters {
  offset?: number;
  limit?: number;
  status?: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  annee?: number;
  mois?: number;
}

interface PartnerFinancesRemboursementsFilters {
  offset?: number;
  limit?: number;
  status?: 'EN_ATTENTE' | 'PAYE' | 'EN_RETARD' | 'ANNULE';
  annee?: number;
  mois?: number;
}

interface PartnerFinancesStatsFilters {
  status?: string;
  date_debut?: string;
  date_fin?: string;
  annee?: number;
  mois?: number;
}

/**
 * Hook pour récupérer les demandes financières
 */
export function usePartnerFinancesDemandes(filters?: PartnerFinancesDemandesFilters) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'finances', 'demandes', filters],
    queryFn: async (): Promise<PartnerFinancesDemandesResponse> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.offset !== undefined) params.append('offset', String(filters.offset));
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.status) params.append('status', filters.status);
      if (filters?.annee) params.append('annee', String(filters.annee));
      if (filters?.mois) params.append('mois', String(filters.mois));

      const url = `${API_ROUTES.partnerFinances.demandes}${params.toString() ? `?${params.toString()}` : ''}`;

      return apiClient.get<PartnerFinancesDemandesResponse>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer les remboursements
 */
export function usePartnerFinancesRemboursements(filters?: PartnerFinancesRemboursementsFilters) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'finances', 'remboursements', filters],
    queryFn: async (): Promise<PartnerFinancesRemboursementsResponse> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.offset !== undefined) params.append('offset', String(filters.offset));
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.status) params.append('status', filters.status);
      if (filters?.annee) params.append('annee', String(filters.annee));
      if (filters?.mois) params.append('mois', String(filters.mois));

      const url = `${API_ROUTES.partnerFinances.remboursements}${params.toString() ? `?${params.toString()}` : ''}`;

      return apiClient.get<PartnerFinancesRemboursementsResponse>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer les statistiques financières
 */
export function usePartnerFinancesStats(filters?: PartnerFinancesStatsFilters) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'finances', 'stats', filters],
    queryFn: async (): Promise<PartnerFinancesStats> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date_debut) params.append('date_debut', filters.date_debut);
      if (filters?.date_fin) params.append('date_fin', filters.date_fin);
      if (filters?.annee) params.append('annee', String(filters.annee));
      if (filters?.mois) params.append('mois', String(filters.mois));

      const url = `${API_ROUTES.partnerFinances.stats}${params.toString() ? `?${params.toString()}` : ''}`;

      return apiClient.get<PartnerFinancesStats>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour récupérer l'évolution mensuelle
 */
export function usePartnerFinancesEvolutionMensuelle(annee?: number) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'finances', 'evolution-mensuelle', annee],
    queryFn: async (): Promise<PartnerFinancesEvolutionMensuelle> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (annee) params.append('annee', String(annee));

      const url = `${API_ROUTES.partnerFinances.evolutionMensuelle}${params.toString() ? `?${params.toString()}` : ''}`;

      return apiClient.get<PartnerFinancesEvolutionMensuelle>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour récupérer les statistiques des paiements d'employés
 */
export function usePartnerFinancesEmployeeStats() {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'finances', 'employee-stats'],
    queryFn: async (): Promise<PartnerFinancesEmployeeStats> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get<PartnerFinancesEmployeeStats>(
        API_ROUTES.partnerFinances.partnerEmployeeStats,
        { accessToken }
      );
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

