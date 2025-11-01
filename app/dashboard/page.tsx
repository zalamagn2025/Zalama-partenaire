"use client";

import StatCard from "@/components/dashboard/StatCard";
import RemboursementsRecents from "@/components/dashboard/RemboursementsRecents";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import {
  ClipboardList,
  FileText,
  RefreshCw,
  Star,
  Users,
  Filter,
  Calendar,
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
import { useCustomToast } from "@/hooks/useCustomToast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

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
  const toast = useCustomToast();
  const router = useRouter();

  // États pour les données Edge Function
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les filtres
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<
    Array<{ value: number; label: string }>
  >([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // État pour éviter l'affichage multiple du toast de bienvenue
  const [welcomeToastShown, setWelcomeToastShown] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('welcome_toast_shown') === 'true';
    }
    return false;
  });

  // Charger les données du dashboard via Edge Function
  const loadDashboardData = async (month?: number, year?: number) => {
    if (!session?.access_token) return;

    setIsLoading(true);
    setError(null);

    try {
      // Construire l'URL avec les paramètres de filtrage
      let url = "/api/proxy/dashboard-data";
      const params = new URLSearchParams();

      if (month !== undefined) params.append("month", month.toString());
      if (year !== undefined) params.append("year", year.toString());

      if (params.toString()) {
        url += "?" + params.toString();
      }

      console.log("🔄 Chargement des données dashboard:", url);

      // Utiliser le proxy pour les données du dashboard
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Gérer les erreurs d'authentification et de route
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 404 ||
          response.status === 500 ||
          response.status === 503
        ) {
          console.error("❌ Erreur serveur:", response.status);
          // Déclencher immédiatement la déconnexion sans délai
          window.dispatchEvent(
            new CustomEvent("session-error", {
              detail: {
                message: `Erreur ${response.status}: ${
                  response.status === 401
                    ? "Non autorisé"
                    : response.status === 403
                    ? "Accès interdit"
                    : response.status === 404
                    ? "Service non trouvé"
                    : response.status === 500
                    ? "Erreur serveur interne"
                    : "Service indisponible"
                }`,
                status: response.status,
              },
            })
          );
          return;
        }

        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.message || "Erreur lors du chargement des données"
        );
      }

      // Les données sont dans result.data selon la réponse Edge Function
      const data = result.data || result;
      setDashboardData(data);

      // Générer les options de filtres basées sur les données disponibles
      // Utiliser les données de demandes pour déterminer les périodes actives
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // Générer les mois disponibles (6 derniers mois + mois actuel)
      const monthsWithData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i - 1, 1);
        const monthValue = date.getMonth() + 1;
        const monthLabel = date.toLocaleDateString("fr-FR", { month: "long" });
        monthsWithData.push({ value: monthValue, label: monthLabel });
      }

      setAvailableMonths(monthsWithData);

      // Générer les années disponibles (année actuelle et 2 précédentes)
      const years = [currentYear, currentYear - 1, currentYear - 2];
      setAvailableYears(years);

      console.log("✅ Données dashboard chargées:", data);

      // Données chargées avec succès
    } catch (error) {
      console.error("❌ Erreur lors du chargement des données:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);

      // Gestion des erreurs sans affichage de toast
      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else if (errorMessage.includes("404")) {
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    if (!loading && session?.access_token) {
      loadDashboardData();
    }
  }, [loading, session?.access_token]);

  // Fonction pour appliquer les filtres
  const applyFilters = () => {
    loadDashboardData(selectedMonth || undefined, selectedYear || undefined);
    setShowFilters(false);
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setSelectedMonth(null);
    setSelectedYear(null);
    loadDashboardData();
    setShowFilters(false);
  };

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      console.log("🔄 Pas de session, redirection vers /login");
      // Réinitialiser le flag du toast de bienvenue lors de la déconnexion
      localStorage.removeItem('welcome_toast_shown');
      router.push("/login");
    }
  }, [loading, session, router]);

  // Gérer les erreurs de session
  useEffect(() => {
    if (
      error &&
      (error.includes("Session expirée") ||
        error.includes("401") ||
        error.includes("403"))
    ) {
      console.log("🔑 Erreur d'authentification détectée, déconnexion...");
      // Déclencher un événement personnalisé pour que le SessionErrorHandler gère la déconnexion
      window.dispatchEvent(
        new CustomEvent("session-error", {
          detail: { message: error },
        })
      );
    }
  }, [error]);

  // Utiliser les données Edge Function directement
  const statistics = dashboardData?.statistics;
  const financialPerformance = dashboardData?.financial_performance;
  const charts = dashboardData?.charts;
  const partnerInfo = dashboardData?.partner_info;
  const filters = dashboardData?.filters;
  const paymentSalaryStats = dashboardData?.payment_salary_stats; // ✅ NOUVEAU

  // Afficher un message de bienvenue (une seule fois par session)
  useEffect(() => {
    if (session?.partner && !isLoading && dashboardData && !welcomeToastShown) {
      console.log("Données du partenaire:", session.partner);
      toast.welcome(session.partner.company_name);
      setWelcomeToastShown(true);
      // Sauvegarder dans localStorage pour persister entre les rechargements
      localStorage.setItem('welcome_toast_shown', 'true');
    }
  }, [session?.partner, isLoading, dashboardData, welcomeToastShown]);

  // Si en cours de chargement, afficher des skeletons
  if (loading || isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Skeleton pour les filtres */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-24"></div>

        {/* Skeleton pour les cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-32"></div>
          ))}
        </div>

        {/* Skeleton pour les graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-80"></div>
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-80"></div>
        </div>

        {/* Skeleton pour le tableau */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-96"></div>
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

  // Si erreur, afficher le message d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => loadDashboardData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Si pas de données, afficher un message
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune donnée disponible
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Impossible de charger les données du dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Utiliser les mois et années disponibles depuis les données Edge Function
  const months =
    availableMonths.length > 0
      ? availableMonths
      : [
          { value: 1, label: "Janvier" },
          { value: 2, label: "Février" },
          { value: 3, label: "Mars" },
          { value: 4, label: "Avril" },
          { value: 5, label: "Mai" },
          { value: 6, label: "Juin" },
          { value: 7, label: "Juillet" },
          { value: 8, label: "Août" },
          { value: 9, label: "Septembre" },
          { value: 10, label: "Octobre" },
          { value: 11, label: "Novembre" },
          { value: 12, label: "Décembre" },
        ];

  const years =
    availableYears.length > 0
      ? availableYears
      : Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  // Utiliser les données Edge Function directement pour les graphiques
  const demandesEvolutionData = charts?.demandes_evolution || [];
  const montantsEvolutionData = charts?.montants_evolution || [];
  const repartitionMotifsData = charts?.repartition_motifs || [];

  // Vérifier s'il y a des données pour afficher les graphiques
  const hasDemandesData = demandesEvolutionData.some(
    (d: any) => d.demandes > 0
  );
  const hasMotifsData = repartitionMotifsData.length > 0;
  const hasMontantsData = montantsEvolutionData.some((d: any) => d.montant > 0);

  return (
    <div className="p-6 space-y-6 max-w-full overflow-hidden">
      {/* En-tête du tableau de bord */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-xl shadow-sm flex items-center justify-between p-6 mb-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div 
            className="rounded-lg w-16 h-16 flex items-center justify-center relative overflow-hidden border-2"
            style={{
              backgroundColor: partnerInfo?.logo_url?.toLowerCase().endsWith('.png') ? '#ffffff' : 
                              partnerInfo?.logo_url ? 'transparent' : '#1e40af',
              borderColor: partnerInfo?.logo_url?.toLowerCase().endsWith('.png') ? '#d1d5db' : 
                          partnerInfo?.logo_url ? '#4b5563' : 'transparent'
            }}
          >
            {partnerInfo?.logo_url ? (
              <Image
                src={partnerInfo.logo_url}
                alt={`Logo ${partnerInfo.company_name}`}
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 64px, 64px"
              />
            ) : (
              <span className="text-white font-bold text-xl">
                {partnerInfo?.company_name?.slice(0, 1)?.toUpperCase() || "Z"}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold dark:text-white">
              {partnerInfo?.company_name || session?.partner?.company_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {partnerInfo?.activity_domain ||
                session?.partner?.activity_domain}{" "}
              • {statistics?.active_employees || 0} employés actifs
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-blue-400 text-sm">
            Partenaire depuis{" "}
            {partnerInfo?.created_at
              ? new Date(partnerInfo.created_at).getFullYear()
              : new Date().getFullYear()}
          </span>
          <Badge variant="success" className="mt-1">
            Compte actif
          </Badge>
        </div>
      </div>

      {/* Informations de contexte - Extrait de la carte des filtres */}
      {filters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Période actuelle
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {filters.period_description || "Mois en cours"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Jour de paiement
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {filters.payment_day || "Non défini"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Filter className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Statut des filtres
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {filters.applied
                    ? "Filtres actifs"
                    : "Données du mois en cours"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres avancés - Style identique à la page remboursements */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow overflow-hidden backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Filtres avancés
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 border border-orange-300 dark:border-orange-600 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                {showFilters ? "Masquer" : "Afficher"}
              </button>
              <button
                onClick={resetFilters}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Réinitialiser
            </button>
            <button
              onClick={() => loadDashboardData()}
              disabled={isLoading}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                {isLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : null}
                Actualiser
            </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {/* Filtre par mois */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mois
              </label>
              <select
                value={selectedMonth || ""}
                onChange={(e) => {
                  const month = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  setSelectedMonth(month);
                  // Si on sélectionne un mois et qu'aucune année n'est sélectionnée, prendre l'année en cours
                  if (month && !selectedYear) {
                    setSelectedYear(new Date().getFullYear());
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
              >
                <option value="">Tous les mois</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par année */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Année
              </label>
              <select
                value={selectedYear || ""}
                onChange={(e) =>
                  setSelectedYear(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2 text-sm border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
              >
                <option value="">Toutes les années</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-end gap-2">
              <button
                onClick={applyFilters}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Appliquer
              </button>
              <button
                onClick={resetFilters}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Indicateur de chargement */}
        {isLoading && (
          <div className="px-4 pb-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            Mise à jour des données...
          </div>
        )}
      </div>

      {/* Cartes statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard
          title="Employés actifs/Total"
          value={`${statistics?.active_employees || 0}/${
            statistics?.total_employees || 0
          }`}
          icon={Users}
          color="orange"
        />
        <StatCard
          title="Demandes totales"
          value={statistics?.total_demandes || 0}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Demandes par employé"
          value={statistics?.demandes_per_employee || "0.0"}
          icon={ClipboardList}
          color="orange"
        />
        <StatCard
          title="Note moyenne"
          value={statistics?.average_rating || "0.0"}
          icon={Star}
          color="green"
        />
      </div>

      {/* Performance financière - Avances */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-xl p-6 mt-8 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--zalama-orange)" }}>
            Performance financière - Avances sur salaire
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDashboardData()}
              disabled={isLoading}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Actualiser les données"
            >
              <RefreshCw
                className={`h-4 w-4 text-gray-500 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start backdrop-blur-sm">
            <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">
              Montant total débloqué (Avances)
            </span>
            <span className="text-2xl font-bold dark:text-white">
              {gnfFormatter(financialPerformance?.debloque_mois)}
            </span>
          </div>
          <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start backdrop-blur-sm">
            <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">
              À rembourser (Avances)
            </span>
            <span className="text-2xl font-bold dark:text-white">
              {gnfFormatter(financialPerformance?.a_rembourser_mois)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start backdrop-blur-sm">
            <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">
              Date limite de remboursement
            </span>
            <span className="text-lg font-bold dark:text-white">
              {financialPerformance?.date_limite_remboursement
                ? new Date(
                    financialPerformance.date_limite_remboursement
                  ).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "Non définie"}
            </span>
          </div>
          <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start backdrop-blur-sm">
            <span className="text-gray-600 dark:text-gray-400 text-xs mb-1">
              Jours restants avant remboursement
            </span>
            <span className="text-lg font-bold dark:text-white">
              {financialPerformance?.jours_restants || "0"} jours
            </span>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    financialPerformance?.debloque_mois &&
                    financialPerformance?.a_rembourser_mois
                      ? Math.min(
                          (financialPerformance.a_rembourser_mois /
                          financialPerformance.debloque_mois) *
                            100,
                        100
                        )
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Taux de remboursement:{" "}
              {financialPerformance?.taux_remboursement || "0%"}
            </span>
          </div>
        </div>
      </div>

      {/* Performance Paiements de Salaire */}
      {paymentSalaryStats && (
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-xl p-6 mt-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--zalama-orange)" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Paiements de Salaires
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <span className="text-gray-600 dark:text-gray-400 text-xs mb-1 block">
                Total paiements effectués
              </span>
              <span className="text-2xl font-bold dark:text-white">
                {paymentSalaryStats.paiements_effectues || 0}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                sur {paymentSalaryStats.total_paiements || 0} paiements
              </span>
            </div>
            
            <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <span className="text-gray-600 dark:text-gray-400 text-xs mb-1 block">
                Montant total versé
              </span>
              <span className="text-xl font-bold dark:text-white">
                {gnfFormatter(paymentSalaryStats.montant_total_salaires)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                à {paymentSalaryStats.employes_payes_distincts || 0} employés
              </span>
            </div>

            <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 backdrop-blur-sm">
              <span className="text-gray-600 dark:text-gray-400 text-xs mb-1 block">
                Total à rembourser
              </span>
              <span className="text-xl font-bold dark:text-white">
                {gnfFormatter(paymentSalaryStats.montant_total_remboursements)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                Salaire + Frais (6%)
              </span>
            </div>
            
            {paymentSalaryStats.delai_remboursement && (
              <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                <span className="text-gray-600 dark:text-gray-400 text-xs mb-1 block">
                  Délai remboursement ZaLaMa
                </span>
                <span className="text-lg font-bold dark:text-white">
                  {formatDate(paymentSalaryStats.delai_remboursement)}
                </span>
                {paymentSalaryStats.jours_restants_remboursement !== null && (
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      paymentSalaryStats.jours_restants_remboursement > 7 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : paymentSalaryStats.jours_restants_remboursement > 0
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {paymentSalaryStats.jours_restants_remboursement > 0
                        ? `${paymentSalaryStats.jours_restants_remboursement} jours restants`
                        : paymentSalaryStats.jours_restants_remboursement === 0
                        ? "Échéance aujourd'hui"
                        : `Retard de ${Math.abs(paymentSalaryStats.jours_restants_remboursement)} jours`
                      }
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {paymentSalaryStats.montant_total_avances_deduites > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-700 dark:text-blue-400">
                  Avances déduites des salaires
                </span>
                <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  {gnfFormatter(paymentSalaryStats.montant_total_avances_deduites)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visualisations et Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Évolution des demandes */}
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: "var(--zalama-orange)" }}>
              Évolution des demandes
            </h3>
            {filters?.applied && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                Données filtrées
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={demandesEvolutionData}
              key={`demandes-${filters?.month}-${filters?.year}`}
            >
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
        </div>
        {/* Montants débloqués */}
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: "var(--zalama-orange)" }}>
              Montants débloqués
            </h3>
            {filters?.applied && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                Données filtrées
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={montantsEvolutionData}
              key={`montants-${filters?.month}-${filters?.year}`}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#232C3B" />
              <XAxis dataKey="mois" stroke="#A0AEC0" />
              <YAxis stroke="#A0AEC0" />
              <Tooltip formatter={(value) => gnfFormatter(Number(value))} />
              <Legend />
              <Bar dataKey="montant" fill="#4F8EF7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Répartition par motif + Remboursements récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Répartition par motif */}
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-semibold" style={{ color: "var(--zalama-orange)" }}>
              Répartition par motif
            </h3>
            {filters?.applied && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                Données filtrées
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={450}>
            <PieChart key={`motifs-${filters?.month}-${filters?.year}`}>
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
                {repartitionMotifsData.map((entry: any, index: number) => (
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
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Remboursements récents */}
        <RemboursementsRecents
          compact={true}
          remboursements={dashboardData?.remboursements}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
