import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/config/api';

interface PartnerWallet {
  id: string;
  partnerId: string;
  balance: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook pour récupérer le wallet du partenaire connecté
 */
export function usePartnerWallet() {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  return useQuery({
    queryKey: ['partner', 'wallet'],
    queryFn: async (): Promise<PartnerWallet> => {
      if (!accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      return apiClient.get<PartnerWallet>(
        API_ROUTES.partnerWallets.me,
        { accessToken }
      );
    },
    enabled: !!accessToken,
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 30 * 1000, // Rafraîchir toutes les 30 secondes
  });
}

