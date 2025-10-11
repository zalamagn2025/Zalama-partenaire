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
  Download,
  User,
  MessageSquare,
  PlusSquare,
  MailWarning,
  DollarSign,
  PieChart as PieChartIcon,
  Check,
  X,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useEdgeAuth } from "@/hooks/useEdgeAuth";
import StatCard from "@/components/dashboard/StatCard";
import LoadingSpinner, { LoadingButton } from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";
import { PartnerDataService } from "@/lib/services";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
import type { SalaryAdvanceRequest, Employee } from "@/lib/supabase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

// Fonction pour obtenir le badge de statut
const getStatusBadge = (statut: string) => {
  switch (statut) {
    case "Validé":
      return <Badge className="bg-green-500">Validé</Badge>;
    case "En attente":
      return <Badge className="bg-yellow-500">En attente</Badge>;
    case "Rejeté":
      return <Badge className="bg-red-500">Rejeté</Badge>;
    case "Annulé":
      return <Badge className="bg-gray-500">Annulé</Badge>;
    case "Approuvée RH/Responsable":
      return <Badge className="bg-blue-500">Approuvée RH</Badge>;
    case "Rejetée RH/Responsable":
      return <Badge className="bg-red-600">Rejetée RH</Badge>;
    default:
      return <Badge className="bg-gray-500">{statut}</Badge>;
  }
};

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<any>(null);

  // États pour les filtres de l'edge function
  const [filters, setFilters] = useState({
    mois: null as number | null,
    annee: null as number | null,
    status: null as string | null,
    type_motif: null as string | null,
    categorie: null as string | null,
    statut_remboursement: null as string | null,
    limit: 50,
    offset: 0,
  });

  // États pour les données de filtres
  const [activityPeriods, setActivityPeriods] = useState<any>(null);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // État pour stocker les informations des employés
  const [employeesData, setEmployeesData] = useState<Map<string, any>>(
    new Map()
  );

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
    } catch (error: any) {
      console.error("Erreur lors du chargement des demandes:", error);

      // Gérer les erreurs d'authentification et serveur
      if (
        error.message &&
        (error.message.includes("Erreur serveur") ||
          error.message.includes("500") ||
          error.message.includes("401") ||
          error.message.includes("403") ||
          error.message.includes("404") ||
          error.message.includes("503"))
      ) {
        console.error("❌ Erreur serveur détectée, déconnexion...");
        window.dispatchEvent(
          new CustomEvent("session-error", {
            detail: {
              message: error.message,
              status: error.status || 500,
            },
          })
        );
        return;
      }

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
  const loadSalaryDemandsData = async (customFilters = {}) => {
    if (!session?.access_token) {
      console.log("Pas de token d'accès disponible");
      return;
    }

    setEdgeFunctionLoading(true);
    setLoading(true);
    try {
      edgeFunctionService.setAccessToken(session.access_token);

      // Combiner les filtres par défaut avec les filtres personnalisés
      const activeFilters = { ...filters, ...customFilters };

      // Nettoyer les filtres (enlever les valeurs null/undefined)
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(
          ([_, value]) => value !== null && value !== undefined && value !== ""
        )
      );

      console.log("🔄 Chargement des demandes avec filtres:", cleanFilters);

      // Utiliser l'endpoint des demandes avec filtres
      const demandesData = await edgeFunctionService.getSalaryDemands(
        cleanFilters
      );

      if (!demandesData.success) {
        console.error("Erreur Edge Function:", demandesData.message);
        toast.error("Erreur lors du chargement des données");
        return;
      }

      // Stocker les données pour les statistiques
      setCurrentMonthData(demandesData);

      // Mettre à jour les données locales
      if (demandesData.data && Array.isArray(demandesData.data)) {
        const firstDemande = demandesData.data[0] as any;
        console.log("🔍 Première demande brute:", firstDemande);
        console.log("🔍 Structure employé première demande:", {
          hasEmploye: !!firstDemande?.employe,
          employeType: typeof firstDemande?.employe,
          employeKeys: firstDemande?.employe
            ? Object.keys(firstDemande.employe)
            : [],
          employePrenom: firstDemande?.employe?.prenom,
          employeNom: firstDemande?.employe?.nom,
          employeData: firstDemande?.employe,
          employeStringified: JSON.stringify(firstDemande?.employe),
        });

        // Debug pour toutes les demandes
        demandesData.data.forEach((demande: any, index: number) => {
          console.log(`🔍 Demande ${index}:`, {
            employe_id: demande.employe_id,
            hasEmploye: !!demande.employe,
            employeKeys: demande.employe ? Object.keys(demande.employe) : [],
            employePrenom: demande.employe?.prenom,
            employeNom: demande.employe?.nom,
          });
        });

        setDemandesAvance(demandesData.data);
      }

      console.log(
        "✅ Données chargées avec succès:",
        demandesData.data?.length,
        "demandes"
      );
    } catch (error: any) {
      console.error(
        "Erreur lors du chargement des données Edge Functions:",
        error
      );

      // Gérer les erreurs d'authentification et serveur
      if (
        error.message &&
        (error.message.includes("Erreur serveur") ||
          error.message.includes("500") ||
          error.message.includes("401") ||
          error.message.includes("403") ||
          error.message.includes("404") ||
          error.message.includes("503"))
      ) {
        console.error("❌ Erreur serveur détectée, déconnexion...");
        window.dispatchEvent(
          new CustomEvent("session-error", {
            detail: {
              message: error.message,
              status: error.status || 500,
            },
          })
        );
        return;
      }

      toast.error("Erreur lors du chargement des données");
    } finally {
      setEdgeFunctionLoading(false);
      setLoading(false);
    }
  };

  const loadCurrentMonthData = async () => {
    await loadSalaryDemandsData();
  };

  // Fonction pour charger les informations des employés
  const loadEmployeesData = async () => {
    if (!session?.access_token) return;

    try {
      edgeFunctionService.setAccessToken(session.access_token);
      const employeesData =
        await edgeFunctionService.getSalaryDemandsEmployees();

      if (employeesData.success && employeesData.data) {
        // Créer une Map pour un accès rapide par ID
        const employeesMap = new Map();
        employeesData.data.forEach((employee: any) => {
          employeesMap.set(employee.id, employee);
        });
        setEmployeesData(employeesMap);
        console.log(
          "✅ Données employés chargées:",
          employeesMap.size,
          "employés"
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des employés:", error);
    }
  };

  // Charger les périodes d'activité pour les filtres
  const loadActivityPeriods = async () => {
    if (!session?.access_token) return;

    try {
      edgeFunctionService.setAccessToken(session.access_token);
      const periodsData =
        await edgeFunctionService.getSalaryDemandsActivityPeriods();

      console.log("🔍 Périodes d'activité reçues:", periodsData);

      if (periodsData.success && periodsData.data) {
        // Transformer les données pour correspondre au format attendu
        const transformedData = {
          mois: periodsData.data.months?.map((m: any) => m.numero) || [],
          annees: periodsData.data.years || [],
        };
        setActivityPeriods(transformedData);
        console.log("✅ Périodes d'activité définies:", transformedData);
        console.log("📊 Données brutes:", periodsData.data);
      } else {
        console.log(
          "❌ Pas de données de périodes d'activité, utilisation du fallback"
        );
        // Fallback: générer les mois et années disponibles
        generateFallbackPeriods();
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement des périodes d'activité:",
        error
      );
      // Fallback en cas d'erreur
      generateFallbackPeriods();
    }
  };

  // Fonction de fallback pour générer les périodes disponibles
  const generateFallbackPeriods = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Générer les 6 derniers mois + mois actuel (comme dans dashboard)
    const monthsWithData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i - 1, 1);
      const monthValue = date.getMonth() + 1;
      monthsWithData.push(monthValue);
    }

    // Générer les années disponibles (année actuelle et précédente)
    const yearsWithData = [currentYear - 1, currentYear];

    const fallbackPeriods = {
      mois: monthsWithData,
      annees: yearsWithData,
    };

    console.log("🔄 Périodes de fallback générées:", fallbackPeriods);
    setActivityPeriods(fallbackPeriods);
  };

  // Fonction pour appliquer un filtre
  const applyFilter = (filterKey: string, value: any) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);

    // Réinitialiser la pagination
    setCurrentPage(1);

    // Recharger les données avec les nouveaux filtres
    loadSalaryDemandsData(newFilters);
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    const defaultFilters = {
      mois: null,
      annee: null,
      status: null,
      type_motif: null,
      categorie: null,
      statut_remboursement: null,
      limit: 50,
      offset: 0,
    };
    setFilters(defaultFilters);
    setCurrentPage(1);
    loadSalaryDemandsData(defaultFilters);
  };

  // Charger les demandes au montage
  useEffect(() => {
    // Charger d'abord les données Edge Function
    loadCurrentMonthData();
    // Charger les données pour les filtres
    loadActivityPeriods();
    // Charger les données des employés
    loadEmployeesData();
  }, [session?.partner]);

  // Fallback pour les périodes d'activité si elles ne se chargent pas
  useEffect(() => {
    if (session?.partner && !activityPeriods) {
      const timer = setTimeout(() => {
        console.log("⏰ Timeout: génération des périodes de fallback");
        generateFallbackPeriods();
      }, 3000); // Attendre 3 secondes avant d'utiliser le fallback

      return () => clearTimeout(timer);
    }
  }, [session?.partner, activityPeriods]);

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
  const allDemandes = demandesAvance.map((d) => {
    // Gérer la structure de données de l'edge function
    const employe = (d as any).employe || (d as any).employee || d.employees;
    const demandesDetailes = (d as any).demandes_detailes || [];
    const premiereDemande = demandesDetailes[0] || {};

    // Debug pour voir la structure des données
    console.log("🔍 Formatage demande:", {
      id: d.id,
      employe_id: d.employe_id,
      hasEmployeData: !!employe,
      employeType: typeof employe,
      employeKeys: employe ? Object.keys(employe) : [],
      employePrenom: employe?.prenom,
      employeNom: employe?.nom,
      employeData: employe,
    });

    // Construire le nom de l'employé de manière plus robuste
    let demandeur = "Employé inconnu";

    // Vérifier si l'objet employé existe et a des propriétés
    if (
      employe &&
      typeof employe === "object" &&
      Object.keys(employe).length > 0
    ) {
      const prenom = employe.prenom || employe.first_name || "";
      const nom = employe.nom || employe.last_name || employe.name || "";
      demandeur = `${prenom} ${nom}`.trim();

      // Si toujours vide, essayer d'autres champs
      if (!demandeur) {
        demandeur =
          employe.display_name || employe.email || `Employé ${d.employe_id}`;
      }
    } else {
      // Fallback: chercher dans les données d'employés chargées
      const employeeFromMap = employeesData.get(d.employe_id);
      if (employeeFromMap) {
        const prenom =
          employeeFromMap.prenom || employeeFromMap.first_name || "";
        const nom =
          employeeFromMap.nom ||
          employeeFromMap.last_name ||
          employeeFromMap.name ||
          "";
        demandeur = `${prenom} ${nom}`.trim();

        if (!demandeur) {
          demandeur =
            employeeFromMap.display_name ||
            employeeFromMap.email ||
            `Employé ${d.employe_id}`;
        }
      } else {
        // Dernier fallback
        demandeur = `Employé ${d.employe_id}`;
      }
    }

    return {
      ...d,
      id: premiereDemande.id || d.id, // ✅ Utiliser l'ID de la première demande détaillée
      type_demande: "Avance sur Salaire",
      demandeur: demandeur,
      date: new Date(
        (d as any).date_creation_premiere || d.date_creation || new Date()
      ).toLocaleDateString("fr-FR"),
      montant:
        (d as any).montant_total_demande ||
        premiereDemande.montant_demande ||
        d.montant_demande ||
        0,
      commentaires: 0,
      poste: employe?.poste || employe?.position || "Non spécifié",
      categorie:
        (d as any).categorie ||
        (premiereDemande.num_installments === 1 ? "mono-mois" : "multi-mois"),
      statut:
        (d as any).statut_global ||
        premiereDemande.statut ||
        d.statut ||
        "Non défini",
      type_motif: premiereDemande.type_motif || d.type_motif || "Autre",
    };
  });

  // Filtrer les demandes (filtrage local pour la recherche textuelle)
  const filteredDemandes = allDemandes.filter((demande) => {
    const matchesSearch =
      !searchTerm ||
      demande.type_demande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.demandeur?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.motif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.montant?.toString().includes(searchTerm) ||
      demande.type_motif?.toLowerCase().includes(searchTerm.toLowerCase());

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
  const totalDemandes =
    currentMonthData?.statistics?.total ||
    currentMonthData?.count ||
    allDemandes.length;

  const approvedDemandes =
    currentMonthData?.statistics?.status_breakdown?.Validé ||
    currentMonthData?.statistics?.by_status?.approved ||
    allDemandes.filter((d) => d.statut === "Validé").length;

  const pendingDemandes =
    currentMonthData?.statistics?.status_breakdown?.["En attente"] ||
    currentMonthData?.statistics?.by_status?.pending ||
    allDemandes.filter((d) => d.statut === "En attente").length;

  const pendingRHResponsable =
    currentMonthData?.statistics?.status_breakdown?.[
      "En attente RH/Responsable"
    ] ||
    currentMonthData?.statistics?.by_status?.pending_rh_responsable ||
    allDemandes.filter((d) => d.statut === "En attente RH/Responsable").length;

  const rejectedDemandes =
    currentMonthData?.statistics?.status_breakdown?.Rejeté ||
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

      // Utiliser le nouveau proxy partner-approval
      const response = await fetch("/api/proxy/partner-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          requestId: requestId,
          action: "approve",
          approverId: session.admin?.id || session.user?.id,
          approverRole: approverRole,
          reason: "Demande approuvée par le service RH",
        }),
      });

      const result = await response.json();

      // Fermer le toast de chargement
      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success("Demande approuvée avec succès");
        // Recharger immédiatement les demandes pour avoir les données à jour
        await loadSalaryDemandsData(filters);
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

      // Utiliser le nouveau proxy partner-approval
      const response = await fetch("/api/proxy/partner-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          requestId: requestId,
          action: "reject",
          approverId: session.admin?.id || session.user?.id,
          approverRole: approverRole,
          reason: "Demande rejetée par le service RH",
        }),
      });

      const result = await response.json();

      // Fermer le toast de chargement
      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success("Demande rejetée avec succès");
        // Recharger immédiatement les demandes pour avoir les données à jour
        await loadSalaryDemandsData(filters);
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
      <div className="p-6 space-y-6 animate-pulse">
        {/* Skeleton pour l'en-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-3">
            <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-10 w-96"></div>
            <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-5 w-80"></div>
          </div>
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-10 w-40"></div>
        </div>

        {/* Skeleton pour les statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-32"></div>
          ))}
        </div>

        {/* Skeleton pour les filtres */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-24"></div>

        {/* Skeleton pour la liste des demandes */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-300 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-gray-400 dark:bg-gray-600 rounded-full h-12 w-12"></div>
                  <div className="space-y-2 flex-1">
                    <div className="bg-gray-400 dark:bg-gray-600 rounded h-6 w-64"></div>
                    <div className="bg-gray-400 dark:bg-gray-600 rounded h-4 w-48"></div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <div className="bg-gray-400 dark:bg-gray-600 rounded h-5 w-32"></div>
                    <div className="bg-gray-400 dark:bg-gray-600 rounded h-4 w-24"></div>
                  </div>
                  <div className="bg-gray-400 dark:bg-gray-600 rounded h-9 w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton pour la pagination */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-12"></div>
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
                <RefreshCw
                  className={`h-4 w-4 text-gray-500 ${
                    edgeFunctionLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
            <p className="text-[var(--zalama-text)]/60 mt-1">
              Gérez les demandes d'avance sur salaire et de prêts P2P de vos
              employés
            </p>
          </div>
          {/* Indicateur de rafraîchissement */}
          {tableLoading && (
            <LoadingButton
              loading={true}
              className="text-sm text-blue-600 dark:text-blue-400"
            >
              <span>Mise à jour...</span>
            </LoadingButton>
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

      {/* Barre de recherche simple */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow-sm p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom d'employé, motif, ou montant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
          />
        </div>
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
              onClick={() => loadSalaryDemandsData(filters)}
              disabled={edgeFunctionLoading}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <LoadingButton loading={edgeFunctionLoading}>
                Actualiser
              </LoadingButton>
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
              onChange={(e) =>
                applyFilter(
                  "mois",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les mois</option>
              {activityPeriods?.mois?.map((mois: number) => (
                <option key={mois} value={mois}>
                  {new Date(0, mois - 1).toLocaleString("fr-FR", {
                    month: "long",
                  })}
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
              value={filters.annee || ""}
              onChange={(e) =>
                applyFilter(
                  "annee",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les années</option>
              {activityPeriods?.annees?.map((annee: number) => (
                <option key={annee} value={annee}>
                  {annee}
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
              onChange={(e) => applyFilter("status", e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="En attente RH/Responsable">
                En attente RH/Responsable
              </option>
              <option value="Validé">Validé</option>
              <option value="Rejeté">Rejeté</option>
            </select>
          </div>

          {/* Filtre par catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Catégorie
            </label>
            <select
              value={filters.categorie || ""}
              onChange={(e) => applyFilter("categorie", e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les catégories</option>
              <option value="mono-mois">Mono-mois</option>
              <option value="multi-mois">Multi-mois</option>
            </select>
          </div>

          {/* Filtre par type de motif */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type de motif
            </label>
            <select
              value={filters.type_motif || ""}
              onChange={(e) =>
                applyFilter("type_motif", e.target.value || null)
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les motifs</option>
              <option value="sante">Santé</option>
              <option value="education">Éducation</option>
              <option value="transport">Transport</option>
              <option value="logement">Logement</option>
              <option value="alimentation">Alimentation</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {/* Filtre par statut de remboursement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statut remboursement
            </label>
            <select
              value={filters.statut_remboursement || ""}
              onChange={(e) =>
                applyFilter("statut_remboursement", e.target.value || null)
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="SANS_REMBOURSEMENT">Sans remboursement</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="PAYE">Payé</option>
              <option value="EN_RETARD">En retard</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>
        </div>

        {/* Indicateur de filtres actifs */}
      </div>

      {/* Liste des demandes */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow-sm relative">
        {/* Overlay de loading pour le tableau */}
        {tableLoading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <LoadingSpinner
              size="lg"
              message="Mise à jour des données de la demande"
            />
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
          <div className="w-full">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom de l'employé
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.map((demande) => (
                  <tr
                    key={demande.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center min-w-0">
                        <div className="flex-shrink-0 h-6 w-6">
                          <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="ml-2 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {demande.demandeur}
                          </div>
                          {demande.poste &&
                            demande.poste !== "Non spécifié" && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {demande.poste}
                              </div>
                            )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          demande.categorie === "mono-mois"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : demande.categorie === "multi-mois"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                        }`}
                      >
                        {demande.categorie || "N/A"}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {(demande.montant || 0).toLocaleString()} GNF
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <div className="text-sm text-gray-900 dark:text-white truncate max-w-20">
                        {demande.type_motif || "Autre"}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {demande.date}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          demande.statut === "En attente" ||
                          demande.statut === "En attente RH/Responsable"
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
                    </td>
                    <td className="px-2 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {/* Actions pour les demandes en attente RH/Responsable */}
                        {demande.statut === "En attente RH/Responsable" ? (
                          <div className="flex flex-col items-center gap-1">
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
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <LoadingButton
                                loading={approvingRequest === demande.id}
                              >
                                <Check className="h-3 w-3" />
                              </LoadingButton>
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
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <LoadingButton
                                loading={rejectingRequest === demande.id}
                              >
                                <X className="h-3 w-3" />
                              </LoadingButton>
                              {rejectingRequest === demande.id
                                ? "Traitement..."
                                : "Rejeter"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {demande.statut === "Validé" && "✅"}
                            {demande.statut === "Rejeté" && "❌"}
                            {demande.statut === "En attente" && "⏳"}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedDemande(demande);
                            setShowDetailsModal(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Détails
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Modal de détails de la demande */}
      {showDetailsModal && selectedDemande && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Détails de la demande
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Référence: {selectedDemande.demandes_detailes?.[0]?.numero_reception || selectedDemande.id || "N/A"}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Informations de l'employé */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Informations Employé
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">Nom complet</p>
                    <p className="font-medium">
                      {selectedDemande.employe
                        ? `${selectedDemande.employe.prenom} ${selectedDemande.employe.nom}`
                        : selectedDemande.demandeur || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Poste</p>
                    <p className="font-medium">{selectedDemande.employe?.poste || selectedDemande.poste || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-sm">{selectedDemande.employe?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedDemande.employe?.telephone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Informations de la demande */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Détails de la Demande
                </h3>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Référence</span>
                    <span className="font-mono font-medium">{selectedDemande.demandes_detailes?.[0]?.numero_reception || selectedDemande.id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date de création</span>
                    <span className="font-medium">
                      {selectedDemande.date_creation_premiere
                        ? new Date(selectedDemande.date_creation_premiere).toLocaleDateString("fr-FR")
                        : selectedDemande.date || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date de validation</span>
                    <span className="font-medium">
                      {selectedDemande.demandes_detailes?.[0]?.date_validation
                        ? new Date(selectedDemande.demandes_detailes[0].date_validation).toLocaleDateString("fr-FR")
                        : selectedDemande.updated_at
                        ? new Date(selectedDemande.updated_at).toLocaleDateString("fr-FR")
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type de demande</span>
                    <span className="font-medium">{selectedDemande.type_demande || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Statut</span>
                    <span>{getStatusBadge(selectedDemande.statut_global || selectedDemande.statut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Catégorie</span>
                    <span className="font-medium">{selectedDemande.categorie || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Montants */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Détails Financiers
                </h3>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Montant demandé</span>
                    <span className="font-medium text-green-600">
                      {(selectedDemande.montant_total_demande || selectedDemande.montant || 0).toLocaleString()} GNF
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type de motif</span>
                    <span className="font-medium">{selectedDemande.demandes_detailes?.[0]?.type_motif || selectedDemande.type_motif || "Autre"}</span>
                  </div>
                </div>
              </div>

              {/* Motif */}
              {selectedDemande.demandes_detailes?.[0]?.motif || selectedDemande.motif ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Motif
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedDemande.demandes_detailes?.[0]?.motif || selectedDemande.motif}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <Button 
                onClick={() => setShowDetailsModal(false)} 
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
