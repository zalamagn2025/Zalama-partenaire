"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, RefreshCw, Filter, Loader2 } from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import StatCard from "@/components/dashboard/StatCard";
import { toast } from "sonner";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// Fonction pour formatter les montants en GNF
const gnfFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0 GNF";
  }
  return `${value.toLocaleString()} GNF`;
};

// Fonction pour formatter les dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Interface pour les statistiques financières
interface FinancialStats {
  totalDebloque: number;
  totalRecupere: number;
  totalRevenus: number;
  totalRemboursements: number;
  totalCommissions: number;
  balance: number;
  pendingTransactions: number;
  totalTransactions: number;
  montantMoyen: number;
  evolutionMensuelle: any[];
  repartitionParType: any[];
  repartitionParStatut: any[];
}

// Interface pour les remboursements avec employé
interface RemboursementWithEmployee {
  id: string;
  transaction_id: string;
  demande_avance_id: string;
  employe_id: string;
  partenaire_id: string;
  montant_transaction: number;
  frais_service: number;
  montant_total_remboursement: number;
  methode_remboursement: string;
  date_creation: string;
  date_transaction_effectuee: string;
  date_limite_remboursement: string;
  date_remboursement_effectue: string | null;
  statut: string;
  numero_compte: string | null;
  numero_reception: string | null;
  reference_paiement: string | null;
  commentaire_partenaire: string | null;
  commentaire_admin: string | null;
  motif_retard: string | null;
  created_at: string;
  updated_at: string;
  pay_id: string | null;
  employe?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    partner_id: string;
  } | null;
  partenaire?: {
    id: string;
    email: string;
    phone: string;
    payment_day: number;
    company_name: string;
  } | null;
  transaction?: {
    id: string;
    statut: string;
    date_transaction: string;
    methode_paiement: string;
    numero_transaction: string;
  } | null;
}

export default function FinancesPage() {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();

  // États pour les données financières
  const [transactions, setTransactions] = useState<RemboursementWithEmployee[]>(
    []
  );
  const [filteredTransactions, setFilteredTransactions] = useState<
    RemboursementWithEmployee[]
  >([]);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    fluxFinance: 0,
    debloqueMois: 0,
    aRembourserMois: 0,
    dateLimite: "",
    nbEmployesApprouves: 0,
  });
  const [salaryRequests, setSalaryRequests] = useState<any[]>([]);
  // Ajoute un état pour le payment_day
  const [paymentDay, setPaymentDay] = useState<number | null>(null);
  
  // États pour les données Edge Functions (mois en cours)
  const [currentMonthData, setCurrentMonthData] = useState<any>(null);
  const [edgeFunctionLoading, setEdgeFunctionLoading] = useState(false);
  
  // États pour les filtres de l'edge function
  const [filters, setFilters] = useState({
    mois: null as number | null,
    annee: null as number | null,
    status: null as string | null,
    limit: 50,
    offset: 0
  });

  // États pour les mois et années actifs
  const [activeMonths, setActiveMonths] = useState<number[]>([]);
  const [activeYears, setActiveYears] = useState<number[]>([]);

  // Charger les demandes d'avance de salaire dynamiquement
  useEffect(() => {
    if (!loading && session?.partner && session?.access_token) {
      loadSalaryAdvanceData();
      loadFinancesData();
      loadActivePeriods();
    }
  }, [loading, session?.partner, session?.access_token]);

  // Fonction pour charger les mois et années actifs
  const loadActivePeriods = async () => {
    if (!session?.access_token) return;
    
    try {
      edgeFunctionService.setAccessToken(session.access_token);
      
      // Récupérer l'évolution mensuelle pour déterminer les mois actifs
      const evolutionResponse = await edgeFunctionService.getFinancesEvolutionMensuelle();
      if (evolutionResponse.success && evolutionResponse.data) {
        const evolutionData = evolutionResponse.data;
        
        // Extraire les mois et années actifs
        const months = new Set<number>();
        const years = new Set<number>();
        
        evolutionData.forEach((item: any) => {
          if (item.debloque > 0) {
            // Convertir le nom du mois en numéro
            const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
            const monthIndex = monthNames.indexOf(item.mois);
            if (monthIndex !== -1) {
              months.add(monthIndex + 1); // +1 car les mois commencent à 1
            }
          }
        });
        
        // Ajouter les années courantes et précédentes
        const currentYear = new Date().getFullYear();
        years.add(currentYear);
        years.add(currentYear - 1);
        
        setActiveMonths(Array.from(months).sort((a, b) => a - b));
        setActiveYears(Array.from(years).sort((a, b) => b - a));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des périodes actives:", error);
    }
  };

  // Récupère le payment_day du partenaire connecté via Edge Function
  useEffect(() => {
    const fetchPaymentDay = async () => {
      if (!session?.partner || !session?.access_token) return;
      
      try {
        edgeFunctionService.setAccessToken(session.access_token);
        const response = await edgeFunctionService.getDashboardData();
        if (response.success && response.data?.partner_info?.payment_day) {
          setPaymentDay(response.data.partner_info.payment_day);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du payment_day:", error);
      }
    };
    fetchPaymentDay();
  }, [session?.partner, session?.access_token]);

  // Calcul de la date limite de remboursement
  const now = new Date();
  let dateLimite = "";
  if (paymentDay) {
    let mois = now.getMonth();
    let annee = now.getFullYear();
    if (now.getDate() > paymentDay) {
      mois += 1;
      if (mois > 11) {
        mois = 0;
        annee += 1;
      }
    }
    const dateRemboursement = new Date(annee, mois, paymentDay);
    dateLimite = dateRemboursement.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } else {
    // Date par défaut si payment_day n'est pas disponible
    const dateRemboursement = new Date(now.getFullYear(), now.getMonth() + 1, 25);
    dateLimite = dateRemboursement.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const loadSalaryAdvanceData = async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    try {
      edgeFunctionService.setAccessToken(session.access_token);
      
      // 1. Récupérer les statistiques financières via Edge Function
      const statsResponse = await edgeFunctionService.getFinancesStats();
      if (!statsResponse.success) {
        console.error("Erreur lors de la récupération des statistiques:", statsResponse.message);
        return;
      }

      const statsData = statsResponse.data || {};
      
      // 2. Récupérer les demandes via Edge Function
      const demandesResponse = await edgeFunctionService.getFinancesDemandes();
      if (!demandesResponse.success) {
        console.error("Erreur lors de la récupération des demandes:", demandesResponse.message);
        return;
      }

      const demandes = demandesResponse.data || [];
      setSalaryRequests(demandes);

      // 3. Récupérer les remboursements via Edge Function
      const remboursementsResponse = await edgeFunctionService.getFinancesRemboursements();
      if (!remboursementsResponse.success) {
        console.error("Erreur lors de la récupération des remboursements:", remboursementsResponse.message);
        return;
      }

      const allRemboursements = remboursementsResponse.data || [];

      // Utiliser directement les données de l'Edge Function
      setStats({
        fluxFinance: statsData.montant_total || 0,
        debloqueMois: statsData.montant_total || 0,
        aRembourserMois: statsData.montant_restant || 0,
        dateLimite: dateLimite,
        nbEmployesApprouves: statsData.total_transactions || 0,
      });

      // Mettre à jour les statistiques financières pour les graphiques
      const newFinancialStats: FinancialStats = {
        totalDebloque: statsData.montant_total || 0,
        totalRecupere: statsData.montant_paye || 0,
        totalRevenus: statsData.montant_total || 0,
        totalRemboursements: statsData.total_remboursements || 0,
        totalCommissions: statsData.montant_total - statsData.montant_paye || 0,
        balance: statsData.balance_wallet || 0,
        pendingTransactions: statsData.remboursements_en_attente || 0,
        totalTransactions: statsData.total_transactions || 0,
        montantMoyen: statsData.montant_moyen || 0,
        evolutionMensuelle: statsData.evolution_mensuelle || [],
        repartitionParType: statsData.repartition_par_mois || [],
        repartitionParStatut: statsData.repartition_par_statut || []
      };
      setFinancialStats(newFinancialStats);
      
      // Mettre à jour les mois et années actifs si nécessaire
      if (statsData.evolution_mensuelle && statsData.evolution_mensuelle.length > 0) {
        const months = new Set<number>();
        const years = new Set<number>();
        
        statsData.evolution_mensuelle.forEach((item: any) => {
          if (item.debloque > 0) {
            const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
            const monthIndex = monthNames.indexOf(item.mois);
            if (monthIndex !== -1) {
              months.add(monthIndex + 1);
            }
          }
        });
        
        const currentYear = new Date().getFullYear();
        years.add(currentYear);
        years.add(currentYear - 1);
        
        setActiveMonths(Array.from(months).sort((a, b) => a - b));
        setActiveYears(Array.from(years).sort((a, b) => b - a));
      }
    } catch (e) {
      console.error("Erreur lors du chargement des données financières:", e);
      toast.error("Erreur lors du chargement des données financières");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les statistiques financières dynamiques
  const calculateFinancialStats = (
    remboursements: RemboursementWithEmployee[]
  ): FinancialStats => {
    // Utiliser les données Edge Function en priorité si disponibles
    if (currentMonthData?.financial_performance) {
      return {
        totalDebloque: currentMonthData.financial_performance.debloque_mois,
        totalRecupere: currentMonthData.financial_performance.a_rembourser_mois,
        totalRevenus: currentMonthData.financial_performance.debloque_mois * 0.06, // Estimation des frais de service
        totalRemboursements: currentMonthData.financial_performance.a_rembourser_mois,
        totalCommissions: currentMonthData.financial_performance.debloque_mois * 0.06,
        balance: parseFloat(currentMonthData.financial_performance.taux_remboursement),
        pendingTransactions: 0, // À calculer selon vos besoins
        totalTransactions: currentMonthData.financial_performance.employes_approuves_periode,
        montantMoyen: currentMonthData.financial_performance.debloque_mois / Math.max(currentMonthData.financial_performance.employes_approuves_periode, 1),
        evolutionMensuelle: [], // À calculer selon vos besoins
        repartitionParType: [], // À calculer selon vos besoins
        repartitionParStatut: [], // À calculer selon vos besoins
      };
    }

    // Calculs de base - adapter selon les types de remboursements dans la table remboursements
    const totalDebloque = remboursements
      .filter((r) => r.statut === "PAYE")
      .reduce((sum, r) => sum + (r.montant_total_remboursement || 0), 0);

    const totalRecupere = remboursements
      .filter((r) => r.statut === "PAYE")
      .reduce((sum, r) => sum + (r.montant_total_remboursement || 0), 0);

    const totalRevenus = remboursements
      .filter((r) => r.statut === "PAYE")
      .reduce((sum, r) => sum + (r.frais_service || 0), 0);

    const totalRemboursements = remboursements.reduce(
      (sum, r) => sum + (r.montant_total_remboursement || 0),
      0
    );

    const totalCommissions = remboursements.reduce(
      (sum, r) => sum + (r.frais_service || 0),
      0
    );

    const pendingTransactions = remboursements.filter(
      (r) => r.statut === "EN_ATTENTE"
    ).length;
    const totalTransactions = remboursements.length;
    const balance =
      totalDebloque - totalRecupere + totalRevenus - totalRemboursements;
    const montantMoyen =
      totalTransactions > 0
        ? remboursements.reduce(
            (sum, r) => sum + (r.montant_total_remboursement || 0),
            0
          ) / totalTransactions
        : 0;

    // Calcul de l'évolution mensuelle
    const evolutionMensuelle = calculateMonthlyEvolution(remboursements);

    // Répartition par type
    const repartitionParType = calculateTypeDistribution(remboursements);

    // Répartition par statut
    const repartitionParStatut = calculateStatusDistribution(remboursements);

    return {
      totalDebloque,
      totalRecupere,
      totalRevenus,
      totalRemboursements,
      totalCommissions,
      balance,
      pendingTransactions,
      totalTransactions,
      montantMoyen,
      evolutionMensuelle,
      repartitionParType,
      repartitionParStatut,
    };
  };

  // Calculer l'évolution mensuelle
  const calculateMonthlyEvolution = (
    remboursements: RemboursementWithEmployee[]
  ) => {
    const months = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];
    const currentYear = new Date().getFullYear();

    const monthlyData = months.map((month, index) => {
      const monthRemboursements = remboursements.filter((r) => {
        const remboursementDate = new Date(r.date_creation);
        return (
          remboursementDate.getFullYear() === currentYear &&
          remboursementDate.getMonth() === index
        );
      });

      // Pour le graphique, on prend tous les remboursements effectués du mois
      const debloque = monthRemboursements
        .filter((r) => r.statut === "PAYE")
        .reduce((sum, r) => sum + (r.montant_total_remboursement || 0), 0);

      const recupere = monthRemboursements
        .filter((r) => r.statut === "PAYE")
        .reduce((sum, r) => sum + (r.montant_total_remboursement || 0), 0);

      const revenus = monthRemboursements
        .filter((r) => r.statut === "PAYE")
        .reduce((sum, r) => sum + (r.frais_service || 0), 0);

      return {
        mois: month,
        debloque,
        //recupere,
        //revenus,
        //balance: debloque - recupere + revenus
      };
    });

    return monthlyData;
  };

  // Calculer la répartition par type
  const calculateTypeDistribution = (
    remboursements: RemboursementWithEmployee[]
  ) => {
    const typeCounts: { [key: string]: number } = {};

    remboursements.forEach((r) => {
      let type = "Remboursement";
      if (r.statut === "PAYE") type = "Payé";
      else if (r.statut === "EN_ATTENTE") type = "En attente";
      else if (r.statut === "ANNULE") type = "Annulé";

      typeCounts[type] =
        (typeCounts[type] || 0) + (r.montant_total_remboursement || 0);
    });

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
    return Object.entries(typeCounts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  };

  // Calculer la répartition par statut
  const calculateStatusDistribution = (
    remboursements: RemboursementWithEmployee[]
  ) => {
    const statusCounts: { [key: string]: number } = {};

    remboursements.forEach((r) => {
      const status = r.statut || "Inconnu";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };


  // Charger les données financières via Edge Functions
  const loadFinancesData = async (customFilters: any = {}) => {
    if (!session?.access_token) return;

    setEdgeFunctionLoading(true);
    try {
      edgeFunctionService.setAccessToken(session.access_token);
      
      // Combiner les filtres par défaut avec les filtres personnalisés
      const activeFilters = { ...filters, ...customFilters };
      
      // Nettoyer les filtres (enlever les valeurs null/undefined)
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, value]) => value !== null && value !== undefined && value !== "")
      );
      
      // Valider les filtres
      validateFilters(cleanFilters);
      
      console.log("🔄 Chargement des données financières avec filtres:", cleanFilters);
      console.log("📊 URL Edge Function:", `/api/proxy/partner-finances/stats?${new URLSearchParams(cleanFilters as any).toString()}`);
      
      // Charger les statistiques financières
      const statsData = await edgeFunctionService.getFinancesStats(cleanFilters);
      
      if (!statsData.success) {
        console.error("Erreur Edge Function:", statsData.message);
        toast.error("Erreur lors du chargement des données financières");
        return;
      }

      // Les données sont dans statsData.data selon la réponse Edge Function
      const data = statsData.data || statsData;
      setCurrentMonthData(data);
      
      // Mettre à jour les statistiques financières
      if (data) {
        const newFinancialStats: FinancialStats = {
          totalDebloque: data.montant_total || 0,
          totalRecupere: data.montant_paye || 0,
          totalRevenus: data.montant_total || 0,
          totalRemboursements: data.total_remboursements || 0,
          totalCommissions: data.montant_total - data.montant_paye || 0,
          balance: data.balance_wallet || 0,
          pendingTransactions: data.remboursements_en_attente || 0,
          totalTransactions: data.total_transactions || 0,
          montantMoyen: data.montant_moyen || 0,
          evolutionMensuelle: data.evolution_mensuelle || [],
          repartitionParType: data.repartition_par_mois || [],
          repartitionParStatut: data.repartition_par_statut || []
        };
        setFinancialStats(newFinancialStats);
        
        // Mettre à jour les statistiques principales avec les données Edge Function
        setStats({
          fluxFinance: data.montant_total || 0,
          debloqueMois: data.montant_total || 0, // Utiliser le montant total pour le mois
          aRembourserMois: data.montant_restant || 0,
          dateLimite: dateLimite,
          nbEmployesApprouves: data.total_transactions || 0
        });
      }

      console.log("✅ Données financières chargées avec succès:", data);
      toast.success("Données financières mises à jour avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement des données Edge Functions:", error);
      toast.error("Erreur lors du chargement des données financières");
    } finally {
      setEdgeFunctionLoading(false);
    }
  };

  // Fonction pour appliquer un filtre
  const applyFilter = async (filterKey: string, value: any) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    
    // Recharger les données avec les nouveaux filtres
    await loadFinancesData(newFilters);
    
    // Recharger aussi les remboursements avec les nouveaux filtres
    await loadTransactionsWithFilters(newFilters);
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = async () => {
    const defaultFilters = {
      mois: null,
      annee: null,
      status: null,
      limit: 50,
      offset: 0
    };
    setFilters(defaultFilters);
    await loadFinancesData(defaultFilters);
    await loadTransactionsWithFilters(defaultFilters);
  };

  // Fonction pour valider les paramètres de filtres
  const validateFilters = (filters: any) => {
    const validParams = ['mois', 'annee', 'status', 'limit', 'offset'];
    const invalidParams = Object.keys(filters).filter(key => !validParams.includes(key));
    
    if (invalidParams.length > 0) {
      console.warn("⚠️ Paramètres de filtres invalides détectés:", invalidParams);
    }
    
    // Valider les valeurs
    if (filters.mois && (filters.mois < 1 || filters.mois > 12)) {
      console.warn("⚠️ Mois invalide:", filters.mois);
    }
    
    if (filters.status && !['PAYE', 'EN_ATTENTE', 'EN_RETARD', 'ANNULE'].includes(filters.status)) {
      console.warn("⚠️ Statut invalide:", filters.status);
    }
    
    return invalidParams.length === 0;
  };



  // Pour l'historique des remboursements, charge les données de remboursements :
  const loadTransactions = async () => {
    if (!session?.access_token) return;
    
    try {
      edgeFunctionService.setAccessToken(session.access_token);
      
      const response = await edgeFunctionService.getFinancesRemboursements();
      if (!response.success) {
        console.error("Erreur lors du chargement des remboursements:", response.message);
        toast.error("Erreur lors du chargement des remboursements");
        return;
      }

      const data = response.data || [];
      console.log("Remboursements chargés:", data);
      console.log("Nombre de remboursements:", data?.length);

      setTransactions(data);

      // Calculer les statistiques financières
      const stats = calculateFinancialStats(data);
      console.log("Stats calculées:", stats);
      setFinancialStats(stats);
    } catch (e) {
      console.error("Erreur lors du chargement des remboursements:", e);
      toast.error("Erreur lors du chargement des remboursements");
    }
  };

  // Fonction pour charger les remboursements avec des filtres spécifiques
  const loadTransactionsWithFilters = async (customFilters: any = {}) => {
    if (!session?.access_token) return;
    
    try {
      edgeFunctionService.setAccessToken(session.access_token);
      
      // Nettoyer les filtres (enlever les valeurs null/undefined)
      const cleanFilters = Object.fromEntries(
        Object.entries(customFilters).filter(([_, value]) => value !== null && value !== undefined && value !== "")
      );
      
      // Valider les filtres
      validateFilters(cleanFilters);
      
      console.log("🔄 Chargement des remboursements avec filtres:", cleanFilters);
      console.log("📋 URL Edge Function:", `/api/proxy/partner-finances/remboursements?${new URLSearchParams(cleanFilters as any).toString()}`);
      
      const response = await edgeFunctionService.getFinancesRemboursements(cleanFilters);
      if (!response.success) {
        console.error("Erreur lors du chargement des remboursements filtrés:", response.message);
        return;
      }

      const data = response.data || [];
      console.log("Remboursements filtrés chargés:", data);
      console.log("Nombre de remboursements filtrés:", data?.length);

      setTransactions(data);
    } catch (e) {
      console.error("Erreur lors du chargement des remboursements filtrés:", e);
    }
  };
  useEffect(() => {
    if (!loading && session?.partner) {
      loadTransactions();
    }
  }, [loading, session?.partner]);

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [loading, session, router]);

  // Filtrer les transactions
  useEffect(() => {
    let filtered = transactions;

    if (selectedType) {
      filtered = filtered.filter((transaction) => {
        if (selectedType === "Payé") return transaction.statut === "PAYE";
        if (selectedType === "En attente")
          return transaction.statut === "EN_ATTENTE";
        if (selectedType === "Annulé") return transaction.statut === "ANNULE";
        return false;
      });
    }

    if (selectedStatus) {
      filtered = filtered.filter((transaction) => {
        if (selectedStatus === "En attente")
          return transaction.statut === "EN_ATTENTE";
        if (selectedStatus === "Payé") return transaction.statut === "PAYE";
        if (selectedStatus === "Annulé") return transaction.statut === "ANNULE";
        return false;
      });
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, selectedType, selectedStatus]);

  // Pagination
  const transactionsPerPage = 10;
  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  );
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  // Exporter les données au format CSV
  const handleExportCSV = () => {
    if (!session?.partner) return;

    const headers = [
      "ID",
      "Date",
      "Employé",
      "Poste",
      "Montant",
      "Type",
      "Description",
      "Statut",
      "Référence",
    ];
    const csvData = [
      headers.join(","),
      ...transactions.map((transaction) =>
        [
          transaction.id,
          formatDate(transaction.date_creation),
          transaction.employe
            ? `${transaction.employe.prenom} ${transaction.employe.nom}`
            : "Non spécifié",
          "Non spécifié",
          transaction.montant_total_remboursement,
          transaction.methode_remboursement || "Remboursement",
          transaction.methode_remboursement || "",
          transaction.statut,
          transaction.reference_paiement || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_${session.partner.company_name}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Export CSV réussi");
  };

  // Si en cours de chargement, afficher un état de chargement
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {edgeFunctionLoading ? "Chargement des données du mois en cours..." : "Chargement des données financières..."}
          </p>
        </div>
      </div>
    );
  }

  // Si pas de partenaire, afficher un message d'erreur
  if (!session?.partner) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à cette
            page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4 w-full max-w-full overflow-hidden">
      {/* En-tête Finances */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Finances
          </h1>
          <div className="flex items-center gap-2">
            {currentMonthData && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                Données du mois en cours
              </span>
            )}
            <button
              onClick={() => loadFinancesData()}
              disabled={edgeFunctionLoading}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Actualiser les données du mois en cours"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${edgeFunctionLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-400">
          Entreprise: {session.partner.company_name}
        </p>
      </div>

      {/* Cartes principales finances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Flux du Montant Financé"
          value={gnfFormatter(stats.fluxFinance)}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title={`Montant total débloqué ${currentMonthData ? 'ce mois' : 'ce mois ci'}`}
          value={gnfFormatter(stats.debloqueMois)}
          icon={Calendar}
          color="green"
        />

        <StatCard
          title={`Montant à rembourser ${currentMonthData ? 'ce mois' : 'ce mois ci'}`}
          value={gnfFormatter(stats.aRembourserMois)}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Date limite de Remboursement"
          value={dateLimite}
          icon={Calendar}
          color="green"
        />
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatCard
          title="Nombre d'employés ayant eu une demande approuvée ce mois-ci"
          value={stats.nbEmployesApprouves}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-4">
        {financialStats && (
          <div className="grid grid-cols-1 gap-4">
            {/* Évolution des montants */}
            <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Évolution mensuelle des montants
              </h3>
              <div className="w-full h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financialStats.evolutionMensuelle}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => gnfFormatter(Number(value))}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="debloque"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Débloqué"
                    />
                    {/*<Line type="monotone" dataKey="recupere" stroke="#10b981" strokeWidth={2} name="Récupéré" />
                    <Line type="monotone" dataKey="revenus" stroke="#f59e0b" strokeWidth={2} name="Revenus" />
                    <Line type="monotone" dataKey="balance" stroke="#8b5cf6" strokeWidth={2} name="Balance" />*/}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Graphique de répartition par statut */}
        {financialStats && financialStats.repartitionParStatut.length > 0 && (
          <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Répartition par statut des transactions
            </h3>
            <div className="w-full h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialStats.repartitionParStatut}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Filtres avancés */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres avancés
          </h3>
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => loadFinancesData(filters)}
              disabled={edgeFunctionLoading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              {edgeFunctionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Actualiser
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Filtre par mois */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mois
            </label>
            <select
              value={filters.mois || ""}
              onChange={(e) => applyFilter('mois', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les mois</option>
              {activeMonths.length > 0 ? (
                activeMonths.map((month) => (
                  <option key={month} value={month}>
                    {new Date(0, month - 1).toLocaleString('fr-FR', { month: 'long' })}
                  </option>
                ))
              ) : (
                Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}
                </option>
                ))
              )}
            </select>
          </div>

          {/* Filtre par année */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Année
            </label>
            <select
              value={filters.annee || ""}
              onChange={(e) => applyFilter('annee', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les années</option>
              {activeYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statut
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) => applyFilter('status', e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="PAYE">Payé</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="EN_RETARD">En retard</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>

        </div>

        {/* Indicateur de filtres actifs */}
        {Object.values(filters).some(value => value !== null && value !== undefined && value !== "") && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <Filter className="h-4 w-4" />
              <span>Filtres actifs :</span>
              {Object.entries(filters).map(([key, value]) => {
                if (value === null || value === undefined || value === "") return null;
                
                let displayValue = value;
                if (key === 'mois' && typeof value === 'number') {
                  displayValue = new Date(0, value - 1).toLocaleString('fr-FR', { month: 'long' });
                } else if (key === 'status') {
                  const statusMap: { [key: string]: string } = {
                    'PAYE': 'Payé',
                    'EN_ATTENTE': 'En attente',
                    'EN_RETARD': 'En retard',
                    'ANNULE': 'Annulé'
                  };
                  displayValue = statusMap[value as string] || value;
                }
                
                return (
                  <span key={key} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-md text-xs">
                    {key}: {displayValue}
                  </span>
                );
              })}
            </div>
            {edgeFunctionLoading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                Mise à jour des données...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tableau des transactions */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow overflow-hidden">
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Historique des remboursements ({filteredTransactions.length}{" "}
            remboursements)
          </h3>
          {filteredTransactions.length !== transactions.length && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {transactions.length} remboursements au total
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[var(--zalama-card)] border-b border-[var(--zalama-border)] border-opacity-20">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                  Méthode
                </th>

                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Montant Total
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                  Frais Service
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                  Statut
                </th>
                {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                  Date Limite
                </th> */}
                {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden xl:table-cell">
                  Référence
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[var(--zalama-card)] divide-y divide-gray-200 dark:divide-gray-700">
              {currentTransactions.length > 0 ? (
                currentTransactions.map((transaction) => {
                  // Déterminer le type basé sur le statut
                  let transactionType = "Remboursement";
                  if (transaction.statut === "PAYE") transactionType = "Payé";
                  else if (transaction.statut === "EN_ATTENTE")
                    transactionType = "En attente";
                  else if (transaction.statut === "ANNULE")
                    transactionType = "Annulé";

                  // Mapper les statuts
                  let statusDisplay = transaction.statut;
                  if (transaction.statut === "EN_ATTENTE")
                    statusDisplay = "En attente";
                  else if (transaction.statut === "PAYE")
                    statusDisplay = "Payé";
                  else if (transaction.statut === "ANNULE")
                    statusDisplay = "Annulé";

                  return (
                    <tr
                      key={transaction.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                        {formatDate(transaction.date_creation)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>
                            {transaction.employe
                              ? `${transaction.employe.prenom} ${transaction.employe.nom}`
                              : "Non spécifié"}
                          </span>
                          {transaction.employe?.email && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {transaction.employe.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white hidden md:table-cell">
                        <div
                          className="max-w-xs truncate"
                          title={
                            transaction.methode_remboursement ||
                            "Aucune méthode"
                          }
                        >
                          {transaction.methode_remboursement ||
                            "Aucune méthode"}
                        </div>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                        {gnfFormatter(
                          transaction.montant_total_remboursement || 0
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white hidden sm:table-cell">
                        {gnfFormatter(transaction.frais_service || 0)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            statusDisplay === "Payé"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : statusDisplay === "En attente"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {statusDisplay}
                        </span>
                      </td>
                      {/* <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                        <div
                          className="max-w-24 truncate"
                          title={formatDate(
                            transaction.date_limite_remboursement
                          )}
                        >
                          {formatDate(transaction.date_limite_remboursement)}
                        </div>
                      </td> */}
                      {/* <td className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                        <div
                          className="max-w-24 truncate"
                          title={transaction.reference_paiement || "-"}
                        >
                          {transaction.reference_paiement || "-"}
                        </div>
                      </td> */}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Aucun remboursement trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-[var(--zalama-card)] px-3 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-2 relative inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                  Affichage de{" "}
                  <span className="font-medium">
                    {indexOfFirstTransaction + 1}
                  </span>{" "}
                  à{" "}
                  <span className="font-medium">
                    {Math.min(
                      indexOfLastTransaction,
                      filteredTransactions.length
                    )}
                  </span>{" "}
                  sur{" "}
                  <span className="font-medium">
                    {filteredTransactions.length}
                  </span>{" "}
                  résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-3 py-1 border text-xs font-medium ${
                          currentPage === page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
