"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, RefreshCw } from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import StatCard from "@/components/dashboard/StatCard";
import { toast } from "sonner";
import { PartnerDataService } from "@/lib/services";
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
import { supabase } from "@/lib/supabase";

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
  employees?: {
    id: string;
    prenom: string;
    nom: string;
    poste: string;
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

  // Charger les demandes d'avance de salaire dynamiquement
  useEffect(() => {
    if (!loading && session?.partner) {
      loadSalaryAdvanceData();
      loadCurrentMonthData();
    }
  }, [loading, session?.partner]);

  // Récupère le payment_day du partenaire connecté
  useEffect(() => {
    const fetchPaymentDay = async () => {
      if (!session?.partner) return;
      const { data, error } = await supabase
        .from("partners")
        .select("payment_day")
        .eq("id", session.partner.id)
        .single();
      if (!error && data && data.payment_day) {
        setPaymentDay(data.payment_day);
      }
    };
    fetchPaymentDay();
  }, [session?.partner]);

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
  }

  const loadSalaryAdvanceData = async () => {
    setIsLoading(true);
    try {
      // 1. Récupérer les demandes avec les employés
      const { data: demandes, error: demandesError } = await supabase
        .from("salary_advance_requests")
        .select(
          `
          *,
          employees!salary_advance_requests_employe_id_fkey (
            id,
            nom,
            prenom,
            poste
          )
        `
        )
        .eq("partenaire_id", session?.partner?.id)
        .order("date_creation", { ascending: false });

      if (demandesError) {
        console.error(
          "Erreur lors de la récupération des demandes:",
          demandesError
        );
        return;
      }

      // 2. Récupérer les transactions correspondantes
      const { data: transactions, error: transactionsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("entreprise_id", session?.partner?.id);

      if (transactionsError) {
        console.error(
          "Erreur lors de la récupération des transactions:",
          transactionsError
        );
        return;
      }

      // 3. Créer un map des transactions par demande_avance_id
      const transactionsMap = new Map();
      (transactions || []).forEach((transaction) => {
        if (transaction.demande_avance_id) {
          transactionsMap.set(transaction.demande_avance_id, transaction);
        }
      });

      // 4. Traiter les demandes et ajuster le statut selon les transactions
      const demandesTraitees = (demandes || []).map((demande) => {
        const transaction = transactionsMap.get(demande.id);

        // Si la demande est approuvée mais n'a pas de transaction effectuée, la marquer comme rejetée
        if (
          demande.statut === "Validé" &&
          (!transaction || transaction.statut !== "EFFECTUEE")
        ) {
          return {
            ...demande,
            statut: "Rejeté",
          };
        }

        return demande;
      });

      setSalaryRequests(demandesTraitees);

      // 5. Récupérer tous les remboursements pour l'entreprise
      const { data: allRemboursements, error: remboursementsError } =
        await supabase
          .from("remboursements")
          .select("*")
          .eq("partenaire_id", session?.partner?.id);

      if (remboursementsError) {
        console.error(
          "Erreur lors de la récupération des remboursements:",
          remboursementsError
        );
        return;
      }

      // Calculs selon la nouvelle logique
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      // Demandes validées ce mois-ci (après traitement avec les transactions)
      const demandesValideesMois = demandesTraitees.filter((d: any) => {
        const dVal = d.date_validation ? new Date(d.date_validation) : null;
        return (
          dVal &&
          dVal.getMonth() === thisMonth &&
          dVal.getFullYear() === thisYear &&
          d.statut === "Validé" // Seulement les vraies demandes validées
        );
      });

      // Demandes rejetées ce mois-ci (après traitement avec les transactions)
      const demandesRejeteesMois = demandesTraitees.filter((d: any) => {
        const dVal = d.date_validation ? new Date(d.date_validation) : null;
        return (
          dVal &&
          dVal.getMonth() === thisMonth &&
          dVal.getFullYear() === thisYear &&
          d.statut === "Rejeté" // Demandes rejetées après vérification des transactions
        );
      });

      // Remboursements effectués ce mois-ci
      const remboursementsMois = (allRemboursements || []).filter((r: any) => {
        const rDate = r.date_creation ? new Date(r.date_creation) : null;
        return (
          rDate &&
          rDate.getMonth() === thisMonth &&
          rDate.getFullYear() === thisYear
        );
      });

      // Flux financier = somme de tous les remboursements entre l'entreprise et Zalama
      const fluxFinance = (allRemboursements || []).reduce(
        (sum: number, r: any) =>
          sum + Number(r.montant_total_remboursement || 0),
        0
      );

      // Calculer les dates de paiement selon le payment_day
      const calculatePaymentDates = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Date de paiement du mois courant
        const paiementMoisCourant = new Date(
          currentYear,
          currentMonth,
          paymentDay || 25
        );

        let dernierPaiement: Date;
        let prochainPaiement: Date;

        if (today >= paiementMoisCourant) {
          // Si on a dépassé ou on est le jour de paiement du mois courant
          dernierPaiement = paiementMoisCourant;
          prochainPaiement = new Date(
            currentYear,
            currentMonth + 1,
            paymentDay || 25
          );
        } else {
          // Si on n'a pas encore atteint le jour de paiement du mois courant
          dernierPaiement = new Date(
            currentYear,
            currentMonth - 1,
            paymentDay || 25
          );
          prochainPaiement = paiementMoisCourant;
        }

        return { dernierPaiement, prochainPaiement };
      };

      const { dernierPaiement, prochainPaiement } = calculatePaymentDates();

      // Montant débloqué ce mois-ci = somme des montants des demandes validées dans la période de paiement
      const debloqueMois = demandesTraitees.reduce((sum: number, d: any) => {
        const dVal = d.date_validation ? new Date(d.date_validation) : null;
        if (dVal && d.statut === "Validé") {
          // Vérifier si la demande est dans la période de paiement actuelle
          if (dVal >= dernierPaiement && dVal < prochainPaiement) {
            return sum + Number(d.montant_demande || 0);
          }
        }
        return sum;
      }, 0);

      // Montant à rembourser ce mois-ci = somme des remboursements avec statut EN_ATTENTE
      const aRembourserMois = (allRemboursements || []).reduce(
        (sum: number, r: any) => {
          if (r.statut === "EN_ATTENTE") {
            return sum + Number(r.montant_total_remboursement || 0);
          }
          return sum;
        },
        0
      );

      // Nombre d'employés ayant eu une demande approuvée ce mois-ci = nombre de demandes validées dans la période de paiement
      const employesApprouves = demandesTraitees.filter((d: any) => {
        const dVal = d.date_validation ? new Date(d.date_validation) : null;
        if (dVal && d.statut === "Validé") {
          // Vérifier si la demande est dans la période de paiement actuelle
          return dVal >= dernierPaiement && dVal < prochainPaiement;
        }
        return false;
      }).length;

      setStats({
        fluxFinance,
        debloqueMois,
        aRembourserMois,
        dateLimite,
        nbEmployesApprouves: employesApprouves,
      });
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

  const loadFinancialData = async () => {
    if (!session?.partner) return;

    setIsLoading(true);
    try {
      // Utiliser le service pour récupérer les vraies données
      const partnerService = new PartnerDataService(session.partner.id);
      const remboursements = await partnerService.getRemboursements();

      setTransactions(remboursements as unknown as RemboursementWithEmployee[]);

      // Calculer les statistiques financières
      const stats = calculateFinancialStats(
        remboursements as unknown as RemboursementWithEmployee[]
      );
      setFinancialStats(stats);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données financières:",
        error
      );
      toast.error("Erreur lors du chargement des données financières");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données du mois en cours via Edge Functions
  const loadCurrentMonthData = async () => {
    if (!session?.access_token) return;

    setEdgeFunctionLoading(true);
    try {
      edgeFunctionService.setAccessToken(session.access_token);
      const dashboardData = await edgeFunctionService.getDashboardData();

      if (!dashboardData.success) {
        console.error("Erreur Edge Function:", dashboardData.message);
        toast.error("Erreur lors du chargement des données du mois en cours");
        return;
      }

                // Les données sont dans dashboardData.data selon la réponse Edge Function
                const data = dashboardData.data || dashboardData;
                setCurrentMonthData(data);
                
                // Mettre à jour les données locales avec les données du mois en cours
                if (data.remboursements) {
                    setTransactions(data.remboursements);
                    
                    // Recalculer les statistiques avec les nouvelles données
                    const stats = calculateFinancialStats(data.remboursements);
                    setFinancialStats(stats);
                }

      console.log("Données financières du mois en cours chargées:", dashboardData);
      toast.success("Données financières du mois en cours mises à jour avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement des données Edge Functions:", error);
      toast.error("Erreur lors du chargement des données du mois en cours");
    } finally {
      setEdgeFunctionLoading(false);
    }
  };

  // Pour l'historique des remboursements, charge les données de remboursements :
  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("remboursements")
        .select(
          `
          *,
          employees!remboursements_employe_id_fkey (
            id,
            prenom,
            nom,
            poste
          )
        `
        )
        .eq("partenaire_id", session?.partner?.id)
        .order("date_creation", { ascending: false });
      if (error) throw error;

      console.log("Remboursements chargés:", data);
      console.log("Nombre de remboursements:", data?.length);

      setTransactions(data || []);

      // Calculer les statistiques financières
      const stats = calculateFinancialStats(data || []);
      console.log("Stats calculées:", stats);
      setFinancialStats(stats);
    } catch (e) {
      console.error("Erreur lors du chargement des remboursements:", e);
      toast.error("Erreur lors du chargement des remboursements");
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
          transaction.employees
            ? `${transaction.employees.prenom} ${transaction.employees.nom}`
            : "Non spécifié",
          transaction.employees?.poste || "Non spécifié",
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
              onClick={loadCurrentMonthData}
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

      {/* Filtres */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Filtre par type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de transaction
            </label>
            <select
              value={selectedType || ""}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="w-full px-3 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
            >
              <option value="">Tous les types</option>
              <option value="Payé">Payé</option>
              <option value="En attente">En attente</option>
              <option value="Annulé">Annulé</option>
            </select>
          </div>

          {/* Filtre par statut */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut
            </label>
            <select
              value={selectedStatus || ""}
              onChange={(e) => setSelectedStatus(e.target.value || null)}
              className="w-full px-3 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="Payé">Payé</option>
              <option value="En attente">En attente</option>
              <option value="Annulé">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des transactions */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow overflow-hidden">
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Historique des remboursements ({filteredTransactions.length}{" "}
            remboursements)
          </h3>
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
                            {transaction.employees
                              ? `${transaction.employees.prenom} ${transaction.employees.nom}`
                              : "Non spécifié"}
                          </span>
                          {transaction.employees?.poste && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {transaction.employees.poste}
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
