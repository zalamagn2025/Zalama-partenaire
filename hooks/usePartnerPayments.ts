import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/config/api';

interface PartnerPaymentsFilters {
  partenaire_id?: string;
  employee_id?: string;
  search?: string;
  periode_debut?: string;
  periode_fin?: string;
  statut?: string;
  action?: string;
  limit?: number;
  page?: number;
}

interface PartnerPaymentsEmployeesFilters {
  partenaire_id?: string;
  annee?: number;
  mois?: number;
}

interface PartnerPaymentsStatisticsFilters {
  partenaire_id?: string;
  date_debut?: string;
  date_fin?: string;
}

interface DirectPaymentInfo {
  numeroReception: string;
  typeCompte: 'lp-om-gn' | 'lp-momo-gn'; // Lengo Pay: Orange Money ou Mobile Money
}

interface CustomSalaryInfo {
  salaireAPayer: number;
  raison?: string;
}

interface BatchProcessWalletRequest {
  employeeIds: string[];
  mois: number;
  annee: number;
  directPayments?: Record<string, DirectPaymentInfo>;
  salairesPersonnalises?: Record<string, CustomSalaryInfo>;
}

interface BulletinPaieParams {
  mois: number;
  annee: number;
  partenaire_id?: string;
}

/**
 * Hook pour récupérer l'historique des paiements
 */
export function usePartnerPayments(filters?: PartnerPaymentsFilters) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'payments', filters],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.partenaire_id) params.append('partenaire_id', filters.partenaire_id);
      if (filters?.employee_id) params.append('employee_id', filters.employee_id);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.periode_debut) params.append('periode_debut', filters.periode_debut);
      if (filters?.periode_fin) params.append('periode_fin', filters.periode_fin);
      if (filters?.statut) params.append('statut', filters.statut);
      if (filters?.action) params.append('action', filters.action);
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.page) params.append('page', String(filters.page));

      const url = params.toString() 
        ? `${API_ROUTES.partnerPayments.list}?${params.toString()}`
        : API_ROUTES.partnerPayments.list;

      return apiClient.get<any>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer la liste des employés avec informations de paiement
 */
export function usePartnerPaymentsEmployees(filters?: PartnerPaymentsEmployeesFilters) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'payments', 'employees', filters],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.partenaire_id) params.append('partenaire_id', filters.partenaire_id);
      if (filters?.annee) params.append('annee', String(filters.annee));
      if (filters?.mois) params.append('mois', String(filters.mois));

      const url = params.toString() 
        ? `${API_ROUTES.partnerPayments.employees}?${params.toString()}`
        : API_ROUTES.partnerPayments.employees;

      return apiClient.get<any[]>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook pour récupérer les statistiques des paiements
 */
export function usePartnerPaymentsStatistics(filters?: PartnerPaymentsStatisticsFilters) {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'payments', 'statistics', filters],
    queryFn: async () => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const params = new URLSearchParams();
      if (filters?.partenaire_id) params.append('partenaire_id', filters.partenaire_id);
      if (filters?.date_debut) params.append('date_debut', filters.date_debut);
      if (filters?.date_fin) params.append('date_fin', filters.date_fin);

      const url = params.toString() 
        ? `${API_ROUTES.partnerPayments.statistics}?${params.toString()}`
        : API_ROUTES.partnerPayments.statistics;

      return apiClient.get<any>(url, { accessToken });
    },
    enabled: !!accessToken,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour traiter plusieurs paiements en batch
 */
export function usePartnerPaymentsBatchProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BatchProcessWalletRequest) => {
      const accessToken = localStorage.getItem('accessToken') || undefined;
      
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.post<any>(
        API_ROUTES.partnerPayments.batchProcessWallet,
        data,
        { accessToken }
      );
    },
    onSuccess: () => {
      // Invalider les queries liées aux paiements
      queryClient.invalidateQueries({ queryKey: ['partner', 'payments'] });
    },
  });
}

/**
 * Hook pour générer un bulletin de paie PDF
 */
export function usePartnerPaymentsBulletinPaie() {
  return useMutation({
    mutationFn: async (params: BulletinPaieParams): Promise<Blob> => {
      const accessToken = localStorage.getItem('accessToken') || undefined;
      
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('mois', String(params.mois));
      queryParams.append('annee', String(params.annee));
      if (params.partenaire_id) {
        queryParams.append('partenaire_id', params.partenaire_id);
      }

      const url = `${API_ROUTES.partnerPayments.bulletinPaie}?${queryParams.toString()}`;

      // Pour les fichiers PDF, on doit utiliser fetch directement
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sandbox.zalamagn.com'}${url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du bulletin de paie');
      }

      return response.blob();
    },
  });
}

