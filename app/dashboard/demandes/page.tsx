"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  Download,
  MoreHorizontal,
  User,
  MessageSquare,
  PlusSquare,
  MailWarning,
  DollarSign,
  PieChart as PieChartIcon,
  Check,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useEdgeAuth } from "@/hooks/useEdgeAuth";
import StatCard from "@/components/dashboard/StatCard";
import { toast } from "sonner";
import { PartnerDataService } from "@/lib/services";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
import type { SalaryAdvanceRequest, Employee } from "@/lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Type étendu pour inclure les données des employés
interface SalaryAdvanceRequestWithEmployee extends SalaryAdvanceRequest {
  employees?: Employee;
}

// Types de services disponibles
const serviceTypes = [
  { id: "avance-salaire", label: "Avance sur Salaire", icon: PlusSquare },
  {
    id: "conseil-financier",
    label: "Gestion et Conseil Financier",
    icon: MailWarning,
  },
  { id: "paiement-salaire", label: "Paiement de Salaire", icon: DollarSign },
];

export default function DemandesPage() {
  const { session } = useEdgeAuth();
  const router = useRouter();
  const [demandesAvance, setDemandesAvance] = useState<
    SalaryAdvanceRequestWithEmployee[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false); // Nouvel état pour le loading du tableau
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const [approvingRequest, setApprovingRequest] = useState<string | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<string | null>(null);
  
  // États pour les données Edge Functions (mois en cours)
  const [currentMonthData, setCurrentMonthData] = useState<any>(null);
  const [edgeFunctionLoading, setEdgeFunctionLoading] = useState(false);

  // Fonction pour charger les demandes
  const loadDemandes = async (showTableLoader = false, delay = 0) => {
    if (!session?.partner) return;

    if (showTableLoader) {
      setTableLoading(true);
    } else {
      setLoading(true);
    }

    try {
      // Ajouter un délai si spécifié
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Utiliser le service pour récupérer les vraies données
      const partnerService = new PartnerDataService(session.partner.id);
      const demandes = await partnerService.getSalaryAdvanceRequests();

      setDemandesAvance(demandes);
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error);
      toast.error("Erreur lors du chargement des demandes");
    } finally {
      if (showTableLoader) {
        setTableLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Charger les données du mois en cours via Edge Functions
  const loadCurrentMonthData = async () => {
    if (!session?.access_token) {
      console.log("Pas de token d'accès disponible");
      return;
    }

    setEdgeFunctionLoading(true);
    setLoading(true);
    try {
      edgeFunctionService.setAccessToken(session.access_token);
      
      // Utiliser directement l'endpoint des demandes pour récupérer les données du mois en cours
      const demandesData = await edgeFunctionService.getDashboardDemandes();

      if (demandesData.error) {
        console.error("Erreur Edge Function:", demandesData.error);
        toast.error("Erreur lors du chargement des données du mois en cours");
        return;
      }

      // Les données sont directement dans la réponse selon votre exemple
      // Stocker les données pour les statistiques
      setCurrentMonthData(demandesData);
      
      // Mettre à jour les données locales avec les données du mois en cours
      if (demandesData.data && Array.isArray(demandesData.data)) {
          setDemandesAvance(demandesData.data);
      }
      
      toast.success("Données des demandes du mois en cours mises à jour avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement des données Edge Functions:", error);
      toast.error("Erreur lors du chargement des données du mois en cours");
    } finally {
      setEdgeFunctionLoading(false);
      setLoading(false);
    }
  };

  // Charger les demandes au montage
  useEffect(() => {
    // Charger d'abord les données Edge Function
    loadCurrentMonthData();
  }, [session?.partner]);

  // Charger les données de fallback si pas de données Edge Function
  useEffect(() => {
    if (!currentMonthData && !edgeFunctionLoading) {
      loadDemandes();
    }
  }, [currentMonthData, edgeFunctionLoading]);

  // Charger les données de fallback au démarrage si pas de données
  useEffect(() => {
    if (demandesAvance.length === 0 && !edgeFunctionLoading && !loading) {
      loadDemandes();
    }
  }, [demandesAvance.length, edgeFunctionLoading, loading]);

  // Formater les demandes
  const allDemandes = demandesAvance.map((d) => ({
    ...d,
    type_demande: "Avance sur Salaire",
    demandeur: d.employees
      ? `${d.employees.prenom} ${d.employees.nom}`
      : `Employé ${d.employe_id}`,
    date: new Date(d.date_creation).toLocaleDateString("fr-FR"),
    montant: d.montant_demande,
    commentaires: 0,
    poste: d.employees?.poste || "Non spécifié",
  }));

  // Filtrer les demandes
  const filteredDemandes = allDemandes.filter((demande) => {
    const matchesSearch =
      !searchTerm ||
      demande.type_demande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.demandeur?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesService =
      !selectedService || demande.type_demande === selectedService;
    const matchesStatus = !statusFilter || demande.statut === statusFilter;

    return matchesSearch && matchesService && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredDemandes.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Calculer les statistiques - utiliser les données Edge Function en priorité
  const totalDemandes = currentMonthData?.statistics?.total || 
    currentMonthData?.count ||
    allDemandes.length;
  
  const approvedDemandes = currentMonthData?.statistics?.status_breakdown?.Validé || 
    currentMonthData?.statistics?.by_status?.approved ||
    allDemandes.filter((d) => d.statut === "Validé").length;
  
  const pendingDemandes = currentMonthData?.statistics?.status_breakdown?.["En attente"] || 
    currentMonthData?.statistics?.by_status?.pending ||
    allDemandes.filter((d) => d.statut === "En attente").length;
  
  const pendingRHResponsable = currentMonthData?.statistics?.status_breakdown?.["En attente RH/Responsable"] || 
    currentMonthData?.statistics?.by_status?.pending_rh_responsable ||
    allDemandes.filter((d) => d.statut === "En attente RH/Responsable").length;
  
  const rejectedDemandes = currentMonthData?.statistics?.status_breakdown?.Rejeté || 
    currentMonthData?.statistics?.by_status?.rejected ||
    allDemandes.filter((d) => d.statut === "Rejeté").length;

  const stats = [
    {
      title: "Total demandes",
      value: totalDemandes,
      icon: FileText,
      color: "blue" as const,
    },
    {
      title: "Validées",
      value: approvedDemandes,
      icon: CheckCircle,
      color: "green" as const,
    },
    {
      title: "En attente",
      value: pendingDemandes,
      icon: Clock,
      color: "yellow" as const,
    },
    {
      title: "En attente RH/Responsable",
      value: pendingRHResponsable,
      icon: Clock,
      color: "purple" as const,
    },
    {
      title: "Rejetées",
      value: rejectedDemandes,
      icon: AlertCircle,
      color: "red" as const,
    },
  ];

  // Fonction pour approuver une demande
  const handleApproveRequest = async (requestId: string) => {
    if (!session?.access_token) {
      toast.error("Session non valide");
      return;
    }

    setApprovingRequest(requestId);
    try {
      // Déterminer le rôle de l'utilisateur
      const userRole = session.admin?.role?.toLowerCase();
      const approverRole =
        userRole === "rh" || userRole === "responsable" ? userRole : "rh";

      // Afficher un toast de chargement
      const loadingToast = toast.loading(
        "Traitement de l'approbation... (8 secondes)"
      );

      const result = await edgeFunctionService.approveRequest(
        session.access_token,
        {
          requestId: requestId,
          action: "approve",
          approverId: session.admin?.id || session.user?.id,
          approverRole: approverRole as "rh" | "responsable",
          reason: "Demande approuvée par le service RH",
        }
      );

      // Fermer le toast de chargement
      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success("Demande approuvée avec succès");
        // Recharger les demandes avec un délai de 8 secondes pour montrer le loading complet
        await loadDemandes(true, 8000);
      } else {
        throw new Error(result.message || "Erreur lors de l'approbation");
      }
    } catch (error: any) {
      console.error("Erreur lors de l'approbation:", error);
      toast.error(error.message || "Erreur lors de l'approbation");
    } finally {
      setApprovingRequest(null);
    }
  };

  // Fonction pour rejeter une demande
  const handleRejectRequest = async (requestId: string) => {
    if (!session?.access_token) {
      toast.error("Session non valide");
      return;
    }

    setRejectingRequest(requestId);
    try {
      // Déterminer le rôle de l'utilisateur
      const userRole = session.admin?.role?.toLowerCase();
      const approverRole =
        userRole === "rh" || userRole === "responsable"
          ? userRole
          : "responsable";

      // Afficher un toast de chargement
      const loadingToast = toast.loading("Traitement du rejet... (8 secondes)");

      const result = await edgeFunctionService.rejectRequest(
        session.access_token,
        {
          requestId: requestId,
          action: "reject",
          approverId: session.admin?.id || session.user?.id,
          approverRole: approverRole as "rh" | "responsable",
          reason: "Demande rejetée par le service RH",
        }
      );

      // Fermer le toast de chargement
      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success("Demande rejetée avec succès");
        // Recharger les demandes avec un délai de 8 secondes pour montrer le loading complet
        await loadDemandes(true, 8000);
      } else {
        throw new Error(result.message || "Erreur lors du rejet");
      }
    } catch (error: any) {
      console.error("Erreur lors du rejet:", error);
      toast.error(error.message || "Erreur lors du rejet");
    } finally {
      setRejectingRequest(null);
    }
  };

  // Gérer le clic en dehors du menu des filtres
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node)
      ) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading && demandesAvance.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[var(--zalama-text)]">
                Demandes de Services
              </h1>
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
            <p className="text-[var(--zalama-text)]/60 mt-1">
              Gérez les demandes d'avance sur salaire et de prêts P2P de vos
              employés
            </p>
          </div>
          {/* Indicateur de rafraîchissement */}
          {tableLoading && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Mise à jour...</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              // TODO: Implémenter l'export CSV
              toast.info("Export CSV à implémenter");
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--zalama-text)] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Répartition par motifs de demande */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par motifs de demande
          </h3>
          {(() => {
            // Calculer la répartition par motifs à partir des vraies données
            const motifCounts = allDemandes.reduce((acc, demande) => {
              const motif = demande.type_motif || "Non spécifié";
              acc[motif] = (acc[motif] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const repartitionMotifsData = Object.entries(motifCounts).map(
              ([motif, count], index) => {
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
              }
            );

            const hasMotifsData = repartitionMotifsData.length > 0;

            return hasMotifsData ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartitionMotifsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ motif, percent }) =>
                      `${motif} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="valeur"
                  >
                    {repartitionMotifsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune donnée disponible</p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Répartition par statut */}
        <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par statut
          </h3>
          {(() => {
            const statutCounts = allDemandes.reduce((acc, demande) => {
              const statut = demande.statut || "Non défini";
              acc[statut] = (acc[statut] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const repartitionStatutData = Object.entries(statutCounts).map(
              ([statut, count], index) => {
                const colors = ["#10B981", "#F59E0B", "#EF4444", "#6366F1"];
                return {
                  statut,
                  valeur: count,
                  color: colors[index % colors.length],
                };
              }
            );

            const hasStatutData = repartitionStatutData.length > 0;

            return hasStatutData ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartitionStatutData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ statut, percent }) =>
                      `${statut} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="valeur"
                  >
                    {repartitionStatutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune donnée disponible</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une demande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-3">
            {/* Filtre par service */}
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--zalama-text)] bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Filter className="h-4 w-4" />
                {selectedService || "Tous les services"}
              </button>

              {showFilterMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedService("");
                        setShowFilterMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--zalama-text)] hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      Tous les services
                    </button>
                    {serviceTypes.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service.label);
                          setShowFilterMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--zalama-text)] hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded transition-colors"
                      >
                        <service.icon className="h-4 w-4" />
                        {service.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filtre par statut */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 text-sm font-medium text-[var(--zalama-text)] bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="" className="dark:bg-[var(--zalama-card)] text-[var(--zalama-text)]">
                Tous les statuts
              </option>
              <option value="En attente" className="dark:bg-[var(--zalama-card)] text-[var(--zalama-text)]">En attente</option>
              <option value="En attente RH/Responsable" className="dark:bg-[var(--zalama-card)] text-[var(--zalama-text)]">
                En attente RH/Responsable
              </option>
              <option value="Validé" className="dark:bg-[var(--zalama-card)] text-[var(--zalama-text)]">Validé</option>
              <option value="Rejeté" className="dark:bg-[var(--zalama-card)] text-[var(--zalama-text)]">Rejeté</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow-sm relative">
        {/* Overlay de loading pour le tableau */}
        {tableLoading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                Traitement en cours...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Mise à jour des données de la demande
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                ⏱️ Temps estimé : 8 secondes
              </p>
              <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        {currentItems.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--zalama-text)] mb-2">
              Aucune demande trouvée
            </h3>
            <p className="text-[var(--zalama-text)]/60">
              {searchTerm || selectedService || statusFilter
                ? "Aucune demande ne correspond aux critères sélectionnés."
                : "Aucune demande n'a encore été créée."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentItems.map((demande) => (
              <div
                key={demande.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[var(--zalama-text)]">
                        {demande.type_demande}
                      </h3>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          demande.statut === "En attente"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : demande.statut === "Validé"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : demande.statut === "Rejeté"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {demande.statut}
                      </span>
                    </div>
                    <p className="text-[var(--zalama-text)]/80 mb-3">
                      {demande.motif}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--zalama-text)]/60">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>{demande.demandeur}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{demande.date}</span>
                      </div>
                      <div className="flex items-center">
                        {(() => {
                          const IconComponent = serviceTypes.find(
                            (s) => s.label === demande.type_demande
                          )?.icon;
                          return IconComponent ? (
                            <IconComponent className="h-3 w-3 mr-1" />
                          ) : null;
                        })()}
                        <span>{demande.type_demande}</span>
                      </div>
                      {demande.montant !== null && (
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          <span>{demande.montant.toLocaleString()} GNF</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span>{demande.commentaires} commentaires</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {/* Actions pour les demandes en attente RH/Responsable */}
                    {demande.statut === "En attente RH/Responsable" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          ⏳ En attente d'approbation
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveRequest(demande.id);
                          }}
                          disabled={
                            approvingRequest === demande.id ||
                            rejectingRequest === demande.id ||
                            tableLoading
                          }
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {approvingRequest === demande.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          {approvingRequest === demande.id
                            ? "Traitement..."
                            : "Approuver"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRejectRequest(demande.id);
                          }}
                          disabled={
                            rejectingRequest === demande.id ||
                            approvingRequest === demande.id ||
                            tableLoading
                          }
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {rejectingRequest === demande.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {rejectingRequest === demande.id
                            ? "Traitement..."
                            : "Rejeter"}
                        </button>
                      </div>
                    ) : (
                      // Indicateur pour les autres statuts
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {demande.statut === "Validé" && "✅ Traitée"}
                        {demande.statut === "Rejeté" && "❌ Rejetée"}
                        {demande.statut === "En attente" && "⏳ En cours"}
                      </div>
                    )}
                    <button className="p-1 rounded-full hover:bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]/70 hover:text-[var(--zalama-text)]">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-[var(--zalama-text)] bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  currentPage === index + 1
                    ? "bg-[var(--zalama-primary)] text-white"
                    : "text-[var(--zalama-text)] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-[var(--zalama-text)] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
