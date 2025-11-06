import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PaymentHistoryData {
  id: string;
  employe_id: string;
  salaire_net: number;
  salaire_disponible: number;
  salaire_disponible_total?: number;
  avances_deduites: number;
  montant_total_remboursement: number;
  frais_intervention?: number;
  statut: string;
  date_paiement: string;
  periode_debut: string;
  periode_fin: string;
  reference_paiement: string;
  methode_paiement?: string;
  intervention_zalama?: boolean;
  created_at: string;
  employe?: {
    id: string;
    nom: string;
    prenom: string;
    poste: string;
    email: string;
    telephone: string;
    photo_url?: string;
    salaire_net?: number;
  };
}

export interface PaymentStatistics {
  total_paiements: number;
  paiements_effectues: number;
  paiements_en_attente: number;
  montant_total_salaires: number;
  montant_total_avances_deduites: number;
  montant_total_frais: number;
  montant_total_remboursements: number;
  semaines_retard?: number;
  penalite_retard_pourcentage?: number;
  montant_penalite_retard?: number;
  montant_total_avec_penalite?: number;
}

export interface UsePaymentHistoryResult {
  payments: PaymentHistoryData[];
  statistics: PaymentStatistics | null;
  loading: boolean;
  error: string | null;
  loadPayments: (filters?: any) => Promise<void>;
  loadStatistics: (filters?: any) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer l'historique des paiements de salaire
 * Basé sur la logique de /dashboard/paiements
 */
export function usePaymentHistory(accessToken?: string): UsePaymentHistoryResult {
  const [payments, setPayments] = useState<PaymentHistoryData[]>([]);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async (filters: any = {}) => {
    if (!accessToken) {
      console.log('❌ usePaymentHistory: Pas de token');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Construire les paramètres de requête
      const params = new URLSearchParams();
      params.append('action', 'list');
      params.append('page', filters.page?.toString() || '1');
      params.append('limit', filters.limit?.toString() || '100');

      if (filters.employe_id) params.append('employe_id', filters.employe_id);
      if (filters.mois) params.append('mois', filters.mois.toString());
      if (filters.annee) params.append('annee', filters.annee.toString());
      if (filters.statut) params.append('statut', filters.statut);

      console.log('🔄 usePaymentHistory - Chargement paiements avec filtres:', filters);

      const response = await fetch(`/api/proxy/payments?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Mapper les données pour ajouter mois_paye et utiliser salaire_disponible_total
        const mappedPayments = (Array.isArray(data.data) ? data.data : []).map((payment: any) => ({
          ...payment,
          mois_paye: payment.periode_debut ? payment.periode_debut.substring(0, 7) : null,
          montant: payment.salaire_disponible_total || payment.salaire_disponible || 0
        }));

        setPayments(mappedPayments);
        console.log('✅ usePaymentHistory - Paiements chargés:', mappedPayments.length);
        console.log('🔍 Premier paiement:', mappedPayments[0]);
      } else {
        throw new Error(data.message || "Erreur lors du chargement des paiements");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error("❌ usePaymentHistory - Erreur:", errorMessage);
      setError(errorMessage);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadStatistics = useCallback(async (filters: any = {}) => {
    if (!accessToken) {
      console.log('❌ usePaymentHistory: Pas de token pour les stats');
      return;
    }

    try {
      const response = await fetch('/api/proxy/payments?action=statistics', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setStatistics(data.data);
        console.log('📊 usePaymentHistory - Statistiques chargées:', data.data);
      }
    } catch (err) {
      console.error("❌ usePaymentHistory - Erreur stats:", err);
    }
  }, [accessToken]);

  const refresh = useCallback(async () => {
    await Promise.all([loadPayments(), loadStatistics()]);
  }, [loadPayments, loadStatistics]);

  // Charger automatiquement au montage
  useEffect(() => {
    if (accessToken) {
      loadPayments();
      loadStatistics();
    }
  }, [accessToken, loadPayments, loadStatistics]);

  return {
    payments,
    statistics,
    loading,
    error,
    loadPayments,
    loadStatistics,
    refresh
  };
}

