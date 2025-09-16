"use client";

import StatCard from "@/components/dashboard/StatCard";
import DocumentsRapports from "@/components/dashboard/DocumentsRapports";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { PartnerDataService } from "@/lib/services";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
import type { Alert, Employee, SalaryAdvanceRequest } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import {
  BarChart2,
  ClipboardList,
  CreditCard,
  FileText,
  RefreshCw,
  Star,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

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

export default function EntrepriseDashboardPage() {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();

  // États pour les données dynamiques
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [avis, setAvis] = useState<any[]>([]);
  const [demandes, setDemandes] = useState<SalaryAdvanceRequest[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [salaryRequests, setSalaryRequests] = useState<any[]>([]);
  const [paymentDay, setPaymentDay] = useState<number | null>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  
  // États pour les données Edge Functions (mois en cours)
  const [currentMonthData, setCurrentMonthData] = useState<any>(null);
  const [edgeFunctionLoading, setEdgeFunctionLoading] = useState(false);

  // Charger les données au montage du composant
  useEffect(() => {
    if (!loading && session?.partner) {
      loadDashboardData();
      loadCurrentMonthData();
    }
  }, [loading, session?.partner]);

  // Charger les transactions depuis la table remboursements
  useEffect(() => {
    const loadTransactions = async () => {
      if (!session?.partner) return;
      try {
        const { data, error } = await supabase
          .from("remboursements")
          .select("*")
          .eq("partenaire_id", session?.partner?.id)
          .order("date_creation", { ascending: false });
        if (error) throw error;
        console.log("Remboursements chargés:", data);
        setAllTransactions(data || []);
      } catch (e) {
        console.error("Erreur lors du chargement des remboursements:", e);
      }
    };
    if (!loading && session?.partner) {
      loadTransactions();
    }
  }, [loading, session?.partner]);

  const loadDashboardData = async () => {
    if (!session?.partner) return;

    setIsLoading(true);
    try {
      // Utiliser le service pour récupérer les vraies données
      const partnerService = new PartnerDataService(session.partner.id);

      const [employees, remboursements, alerts, avis, demandes, stats] =
        await Promise.all([
          partnerService.getEmployees(),
          partnerService.getRemboursements(),
          partnerService.getAlerts(),
          partnerService.getAvis(),
          partnerService.getSalaryAdvanceRequests(),
          partnerService.getPartnerStats(),
        ]);

      // Définir les données récupérées de la base
      setEmployees(employees);
      setTransactions(remboursements);
      setAlerts(alerts);
      setAvis(avis);
      setDemandes(demandes);

      // Définir les statistiques calculées
      setDashboardStats({
        total_employees: stats.totalEmployees,
        total_transactions: stats.totalTransactions,
        total_alerts: stats.totalAlerts,
        total_messages: 0, // Section messages supprimée
        total_avis: stats.totalAvis,
        total_demandes: stats.totalDemandes,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données");
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

      if (dashboardData.error) {
        console.error("Erreur Edge Function:", dashboardData.error);
        toast.error("Erreur lors du chargement des données du mois en cours");
        return;
      }

      // Les données sont dans dashboardData.data selon la réponse Edge Function
      const data = dashboardData.data || dashboardData;
      setCurrentMonthData(data);
      
      // Mettre à jour les données locales avec les données du mois en cours
      if (data.employees) {
        setEmployees(data.employees);
      }
      if (data.demandes) {
        setDemandes(data.demandes);
      }
      if (data.remboursements) {
        setAllTransactions(data.remboursements);
      }
      if (data.alerts) {
        setAlerts(data.alerts);
      }
      if (data.avis) {
        setAvis(data.avis);
      }

      console.log("Données du mois en cours chargées:", dashboardData);
      toast.success("Données du mois en cours mises à jour avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement des données Edge Functions:", error);
      toast.error("Erreur lors du chargement des données du mois en cours");
    } finally {
      setEdgeFunctionLoading(false);
    }
  };

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [loading, session, router]);

  // Afficher un message de bienvenue
  useEffect(() => {
    if (session?.partner && !isLoading) {
      console.log("Données du partenaire:", session.partner);
      console.log("employees_count:", session.partner.employees_count);
      toast.success(
        `Bienvenue sur le tableau de bord de ${session.partner.company_name}`,
        {
          id: "dashboard-welcome",
        }
      );
    }
  }, [session?.partner, isLoading]);

  // Ajoute une fonction utilitaire pour charger les avis dynamiquement (seulement les avis approuvés) :
  const loadAvis = async () => {
    try {
      const { data, error } = await supabase
        .from("avis")
        .select("*")
        .eq("partner_id", session?.partner?.id)
        .eq("approuve", true)
        .order("date_avis", { ascending: false });
      if (error) throw error;
      setAvis(data || []);
    } catch (e) {
      toast.error("Erreur lors du chargement des avis");
    }
  };
  useEffect(() => {
    if (!loading && session?.partner) {
      loadAvis();
    }
  }, [loading, session?.partner]);

  useEffect(() => {
    const loadRemboursements = async () => {
      const { data, error } = await supabase
        .from("remboursements")
        .select("*")
        .eq("partenaire_id", session?.partner?.id);
      if (!error) setTransactions(data || []);
    };
    if (!loading && session?.partner) loadRemboursements();
  }, [loading, session?.partner]);

  // Ajoute le hook d'état pour les demandes d'avance
  useEffect(() => {
    const loadSalaryRequests = async () => {
      const { data, error } = await supabase
        .from("salary_advance_requests")
        .select("*")
        .eq("partenaire_id", session?.partner?.id)
        .eq("statut", "Validé");
      if (!error) setSalaryRequests(data || []);
    };
    if (!loading && session?.partner) loadSalaryRequests();
  }, [loading, session?.partner]);

  // Récupère le payment_day du partenaire connecté
  useEffect(() => {
    const fetchPaymentDay = async () => {
      if (!session?.partner) return;
      // Utiliser company_name pour faire correspondre avec partnership_requests
      const { data, error } = await supabase
        .from("partners")
        .select("payment_day")
        .eq("company_name", session.partner.company_name)
        .eq("status", "approved")
        .single();
      if (!error && data && data.payment_day) {
        setPaymentDay(data.payment_day);
      }
    };
    fetchPaymentDay();
  }, [session?.partner]);

  // Récupérer la vraie date de création du partenaire depuis la base de données
  const [partnerCreationYear, setPartnerCreationYear] = useState<number | null>(
    null
  );
  const [partnerEmployeesCount, setPartnerEmployeesCount] = useState<number>(0);

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!session?.partner?.id) return;

      try {
        const { data, error } = await supabase
          .from("partners")
          .select("created_at, employees_count")
          .eq("id", session.partner.id)
          .single();

        if (!error && data) {
          if (data.created_at) {
            const creationYear = new Date(data.created_at).getFullYear();
            setPartnerCreationYear(creationYear);
          }
          if (data.employees_count) {
            setPartnerEmployeesCount(data.employees_count);
            console.log(
              "employees_count récupéré depuis la DB:",
              data.employees_count
            );
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données du partenaire:",
          error
        );
      }
    };

    fetchPartnerData();
  }, [session?.partner?.id]);

  // Calcul de la date de remboursement et jours restants - utiliser les données Edge Function en priorité
  const now = new Date();
  let dateLimite = currentMonthData?.financial_performance?.date_limite_remboursement || "";
  let joursRestants = currentMonthData?.financial_performance?.jours_restants || "-";
  
  // Si pas de données Edge Function, calculer manuellement
  if (!currentMonthData?.financial_performance && paymentDay) {
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
    const diff = Math.ceil(
      (dateRemboursement.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    joursRestants = diff > 0 ? `${diff} jours` : "0 jour";
  }

  // Si en cours de chargement, afficher un état de chargement
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {edgeFunctionLoading ? "Chargement des données du mois en cours..." : "Chargement du tableau de bord..."}
          </p>
        </div>
      </div>
    );
  }

  // Si pas de session ou partenaire, afficher un message d'erreur
  if (!session?.partner) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à ce
            tableau de bord.
          </p>
        </div>
      </div>
    );
  }

  // Calculer les statistiques - utiliser les données Edge Functions si disponibles
  const currentEmployees = currentMonthData?.employees || employees;
  const currentDemandes = currentMonthData?.demandes || demandes;
  const currentTransactions = currentMonthData?.remboursements || allTransactions;
  const currentAlerts = currentMonthData?.alerts || alerts;
  const currentAvis = currentMonthData?.avis || avis;

  const activeEmployees = currentEmployees.filter((emp) => emp.actif);
  const totalSalary = activeEmployees.reduce(
    (sum, emp) => sum + (emp.salaire_net || 0),
    0
  );

  // Fonction utilitaire pour calculer les montants dynamiques
  const getMontantByType = (type: string) => {
    return transactions
      .filter((t: any) => t.type === type && t.statut === "Validé")
      .reduce((sum: number, t: any) => sum + Number(t.montant || 0), 0);
  };

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

  // Flux financier = somme de tous les remboursements entre l'entreprise et Zalama
  const fluxFinance = currentTransactions.reduce(
    (sum: number, t: any) => sum + Number(t.montant_total_remboursement || 0),
    0
  );

  // Montant débloqué = utiliser les données Edge Function en priorité
  const debloqueMois = currentMonthData?.financial_performance?.debloque_mois || 
    currentTransactions.reduce(
      (sum: number, t: any) => sum + Number(t.montant_total_remboursement || 0),
      0
    );

  // Montant à rembourser = utiliser les données Edge Function en priorité
  const aRembourserMois = currentMonthData?.financial_performance?.a_rembourser_mois ||
    currentTransactions.reduce((sum: number, t: any) => {
      if (t.statut === "EN_ATTENTE") {
        return sum + Number(t.montant_total_remboursement || 0);
      }
      return sum;
    }, 0);

  // Nombre d'employés ayant eu une demande approuvée dans la période de paiement
  const currentSalaryRequests = currentMonthData?.demandes || salaryRequests;
  const demandesValideesPeriode = currentSalaryRequests.filter((d: any) => {
    const dVal = d.date_validation ? new Date(d.date_validation) : null;
    return dVal && dVal >= dernierPaiement && dVal < prochainPaiement;
  });

  const employesApprouves = demandesValideesPeriode.length;

  // Calculer la balance
  const totalRecupere = transactions
    .filter((t) => t.type === "Récupéré" && t.statut === "Validé")
    .reduce((sum, trans) => sum + (trans.montant || 0), 0);
  const totalRevenus = transactions
    .filter((t) => t.type === "Revenu" && t.statut === "Validé")
    .reduce((sum, trans) => sum + (trans.montant || 0), 0);
  const totalRemboursements = transactions
    .filter((t) => t.type === "Remboursement" && t.statut === "Validé")
    .reduce((sum, trans) => sum + (trans.montant || 0), 0);
  const totalCommissions = transactions
    .filter((t) => t.type === "Commission" && t.statut === "Validé")
    .reduce((sum, trans) => sum + (trans.montant || 0), 0);
  const balance = totalRecupere - totalRemboursements + totalRevenus;

  const activeAlerts = currentAlerts.filter((alert) => alert.statut !== "Résolue");
  const averageRating =
    currentAvis.length > 0
      ? currentAvis.reduce((sum, av) => sum + av.note, 0) / currentAvis.length
      : 0;
  const pendingDemandes = currentDemandes.filter((dem) => dem.statut === "En attente");

  // Données pour les graphiques - 6 derniers mois + données récentes
  const getLast6Months = () => {
    const months = [];
    const monthNames = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Août",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];

    // Obtenir les 6 derniers mois depuis maintenant
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        name: monthNames[date.getMonth()],
      });
    }
    return months;
  };

  const last6Months = getLast6Months();

  // Si pas de données dans les 6 derniers mois, utiliser les mois où il y a des données
  const getMonthsWithData = () => {
    if (currentDemandes.length === 0) return last6Months;

    const monthNames = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Août",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];
    const monthsWithData = new Set<string>();

    currentDemandes.forEach((demande) => {
      const date = new Date(demande.date_creation);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthsWithData.add(key);
    });

    const monthsArray = Array.from(monthsWithData)
      .map((key: string) => {
        const [year, month] = key.split("-").map(Number);
        return {
          month,
          year,
          name: monthNames[month],
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

    // Si on a des données récentes, les inclure
    return monthsArray.length > 0 ? monthsArray : last6Months;
  };

  const monthsToShow = getMonthsWithData();

  // Utiliser les données Edge Function en priorité pour les graphiques
  const demandesEvolutionData = currentMonthData?.charts?.demandes_evolution || monthsToShow.map(({ month, year, name }) => {
    const count = currentDemandes.filter((d) => {
      const demandDate = new Date(d.date_creation);
      return (
        demandDate.getMonth() === month && demandDate.getFullYear() === year
      );
    }).length;

    return { mois: name, demandes: count };
  });

  const montantsEvolutionData = currentMonthData?.charts?.montants_evolution || monthsToShow.map(({ month, year, name }) => {
    const total = currentTransactions
      .filter((t) => {
        const transactionDate = new Date(t.date_creation);
        return (
          transactionDate.getMonth() === month &&
          transactionDate.getFullYear() === year
        );
      })
      .reduce((sum, t) => sum + Number(t.montant_total_remboursement || 0), 0);

    return { mois: name, montant: total };
  });

  // Utiliser les données Edge Function en priorité pour la répartition par motifs
  const repartitionMotifsData = currentMonthData?.charts?.repartition_motifs || Object.entries(
    currentDemandes.reduce((acc, demande) => {
      acc[demande.type_motif] = (acc[demande.type_motif] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([motif, count], index) => {
    const colors = [
      "#8884d8",
      "#82ca9d",
      "#ffc658",
      "#ff7300",
      "#00C49F",
      "#FF8042",
    ];
    return {
      motif,
      valeur: count,
      color: colors[index % colors.length],
    };
  });

  // Si pas de données, créer des données par défaut pour éviter les graphiques vides
  const hasDemandesData = currentMonthData?.charts?.demandes_evolution?.some((d: any) => d.demandes > 0) || currentDemandes.length > 0;
  const hasMotifsData = currentMonthData?.charts?.repartition_motifs?.length > 0 || repartitionMotifsData.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* En-tête du tableau de bord */}
      <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-xl shadow-sm flex items-center justify-between p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-900 rounded-lg w-16 h-16 flex items-center justify-center relative overflow-hidden">
            {session?.partner?.logo_url ? (
              <>
                {/* Fond blanc pour les PNG avec transparence */}
                <div className="absolute inset-0 bg-white rounded-lg"></div>
                <Image
                  src={session.partner.logo_url}
                  alt={`Logo ${session.partner.company_name}`}
                  fill
                  className="object-contain relative z-10 p-1"
                  sizes="(max-width: 768px) 64px, 64px"
                />
              </>
            ) : (
              <span className="text-white font-bold text-xl">
                {session?.partner?.company_name?.slice(0, 1)?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold dark:text-white">
              {session?.partner?.company_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {session?.partner?.activity_domain} • {activeEmployees.length}{" "}
              employés inscrits
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-blue-400 text-sm">
            Partenaire depuis{" "}
            {partnerCreationYear ||
              (session?.partner?.created_at
                ? new Date(session.partner.created_at).getFullYear()
                : new Date().getFullYear())}
          </span>
          <span className="bg-green-900 text-green-400 text-xs px-3 py-1 rounded-full mt-1">
            Compte actif
          </span>
        </div>
      </div>

      {/* Cartes statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard
          title="Employés actifs/Total"
          value={`${currentMonthData?.statistics?.active_employees || activeEmployees.length}/${
            currentMonthData?.statistics?.total_employees || currentMonthData?.partner_info?.employees_count || 0
          }`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Demandes totales"
          value={currentMonthData?.statistics?.total_demandes || currentDemandes.length}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Demandes par employé"
          value={
            currentMonthData?.statistics?.demandes_per_employee || 
            (activeEmployees.length > 0
              ? (currentDemandes.length / activeEmployees.length).toFixed(1)
              : "0.0")
          }
          icon={ClipboardList}
          color="yellow"
        />
        <StatCard
          title="Note moyenne"
          value={currentMonthData?.statistics?.average_rating || averageRating.toFixed(1)}
          icon={Star}
          color="green"
        />
      </div>

      {/* Performance financière */}
      <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-xl p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-600 dark:text-white text-lg font-semibold">
            Performance financière
          </h2>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start">
            <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">
              Montant total débloqué {currentMonthData ? '(mois en cours)' : '(tous les mois)'}
            </span>
            <span className="text-2xl font-bold dark:text-white">
              {gnfFormatter(debloqueMois)}
            </span>
          </div>
          <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start">
            <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">
              À rembourser {currentMonthData ? 'ce mois' : 'en attente'}
            </span>
            <span className="text-2xl font-bold dark:text-white">
              {gnfFormatter(aRembourserMois)}
            </span>
          </div>
          {/* <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start">
            <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">
              Taux de remboursement
            </span>
            <span className="text-2xl font-bold dark:text-white">
              {debloqueMois > 0
                ? ((aRembourserMois / debloqueMois) * 100).toFixed(1)
                : "0.0"}
              %
            </span>
          </div> */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start">
            <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">
              Date limite de remboursement
            </span>
            <span className="text-lg font-bold dark:text-white">
              {dateLimite}
            </span>
          </div>
          <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start">
            <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">
              Jours restants avant Remboursement
            </span>
            <span className="text-lg font-bold dark:text-white">
              {joursRestants}
            </span>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{
                  width: `${
                    debloqueMois > 0
                      ? (aRembourserMois / debloqueMois) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Remboursement cette semaine
            </span>
          </div>
        </div>
      </div>

      {/* Visualisations et Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Évolution des demandes */}
        <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6">
          <h3 className="text-gray-600 dark:text-white text-base font-semibold mb-4">
            Évolution des demandes
          </h3>
          {hasDemandesData ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={demandesEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232C3B" />
                <XAxis dataKey="mois" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="demandes"
                  stroke="#4F8EF7"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>
        {/* Montants débloqués */}
        <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6">
          <h3 className="text-gray-600 dark:text-white text-base font-semibold mb-4">
            Montants débloqués
          </h3>
          {hasDemandesData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={montantsEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232C3B" />
                <XAxis dataKey="mois" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip formatter={(value) => gnfFormatter(Number(value))} />
                <Legend />
                <Bar dataKey="montant" fill="#4F8EF7" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Répartition par motif + Documents et rapports sur la même ligne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Répartition par motif */}
        <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6">
          <h3 className="text-gray-600 dark:text-white text-base font-semibold mb-8 text-center">
            Répartition par motif
          </h3>
          {hasMotifsData ? (
            <ResponsiveContainer width="100%" height={450}>
              <PieChart>
                <Pie
                  data={repartitionMotifsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ motif, valeur }) => `${motif} (${valeur})`}
                  outerRadius={100}
                  innerRadius={40}
                  fill="#4F8EF7"
                  dataKey="valeur"
                  paddingAngle={2}
                >
                  {repartitionMotifsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`demandes`, name]}
                  labelStyle={{ color: "#374151" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                {/* <Legend
                  verticalAlign="bottom"
                  height={60}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "20px" }}
                /> */}
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>
        {/* Documents et rapports */}
        <DocumentsRapports compact={true} />
      </div>
    </div>
  );
}
