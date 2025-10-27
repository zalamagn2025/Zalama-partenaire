"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Phone,
  Calendar,
  Hash,
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
import Pagination from "@/components/ui/Pagination";

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
  const [showFilters, setShowFilters] = useState(false);

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
        // Debug: vérifier si les photos sont présentes
        const employeesWithPhotos = Array.from(employeesMap.values()).filter(emp => emp.photo_url);
        console.log("📸 Employés avec photos:", employeesWithPhotos.length, "sur", employeesMap.size);
        if (employeesWithPhotos.length > 0) {
          console.log("📸 Exemple de photo:", employeesWithPhotos[0].photo_url);
        }
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
        {/* Skeleton pour les filtres avancés */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-20"></div>

        {/* Skeleton pour les statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-32"></div>
          ))}
        </div>

        {/* Skeleton pour la barre de recherche */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-16"></div>

        {/* Skeleton pour le tableau des demandes */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-3">
            {/* En-tête du tableau */}
            <div className="grid grid-cols-6 gap-4 pb-3 border-b border-gray-300 dark:border-gray-700">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-300 dark:bg-gray-700 rounded h-5"></div>
              ))}
                  </div>
            {/* Lignes du tableau */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 py-3">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="bg-gray-300 dark:bg-gray-700 rounded h-6"></div>
                ))}
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
     {/* Filtres avancés - Style identique à la page dashboard */}
     <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow overflow-hidden backdrop-blur-sm mb-6">
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
              onClick={() => loadSalaryDemandsData(filters)}
              disabled={edgeFunctionLoading}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
                {edgeFunctionLoading ? (
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
              value={filters.mois || ""}
              onChange={(e) =>
                applyFilter(
                  "mois",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
                className="w-full px-3 py-2 text-sm border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
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
                className="w-full px-3 py-2 text-sm border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
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
                className="w-full px-3 py-2 text-sm border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
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
                className="w-full px-3 py-2 text-sm border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
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
                className="w-full px-3 py-2 text-sm border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
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
                className="w-full px-3 py-2 text-sm border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
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
        )}
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
          <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg shadow overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-[var(--zalama-card)]">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nom de l'employé
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-3 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[var(--zalama-border)]">
                {currentItems.map((demande) => (
                  <tr
                    key={demande.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {(() => {
                            const employeeData = employeesData.get(demande.employe_id);
                            const photoUrl = employeeData?.photo_url || (demande.employees as any)?.photo_url;
                            console.log(`🔍 Demande ${demande.id}:`, {
                              employe_id: demande.employe_id,
                              hasEmployeeData: !!employeeData,
                              photoUrl: photoUrl,
                              employeesPhotoUrl: (demande.employees as any)?.photo_url
                            });
                            return photoUrl ? (
                              <Image
                                src={photoUrl}
                                alt={demande.demandeur}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                                {demande.demandeur.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                              </span>
                            );
                          })()}
                          </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {demande.demandeur}
                          </div>
                          {demande.poste &&
                            demande.poste !== "Non spécifié" && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {demande.poste}
                              </div>
                            )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Badge
                        variant={
                          demande.categorie === "mono-mois"
                            ? "info"
                            : demande.categorie === "multi-mois"
                            ? "purple"
                            : "default"
                        }
                        className="text-xs"
                      >
                        {demande.categorie === "mono-mois"
                          ? "Mono-mois"
                          : demande.categorie === "multi-mois"
                          ? "Multi-mois"
                          : demande.categorie || "N/A"}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {(demande.montant || 0).toLocaleString()} GNF
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900 dark:text-white truncate max-w-20">
                        {demande.type_motif || "Autre"}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {demande.date}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Badge
                        variant={
                          demande.statut === "En attente" ||
                          demande.statut === "En attente RH/Responsable"
                            ? "warning"
                            : demande.statut === "Validé"
                            ? "success"
                            : demande.statut === "Rejeté"
                            ? "error"
                            : "default"
                        }
                        className="text-xs"
                      >
                        {demande.statut}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-center">
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
                              className="group relative p-2 rounded-full bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                              title="Approuver la demande"
                            >
                              {approvingRequest === demande.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                                {approvingRequest === demande.id ? "Traitement..." : "Approuver"}
                              </div>
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
                              className="group relative p-2 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                              title="Rejeter la demande"
                            >
                              {rejectingRequest === demande.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                                {rejectingRequest === demande.id ? "Traitement..." : "Rejeter"}
                              </div>
                            </button>
                          </div>
                        ) : null}
                        <button
                          onClick={() => {
                            setSelectedDemande(demande);
                            setShowDetailsModal(true);
                          }}
                          className="group relative p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            Voir
                          </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>
        )}

      {/* Pagination */}
        {filteredDemandes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDemandes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modal de détails de la demande */}
      {showDetailsModal && selectedDemande && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-[var(--zalama-bg-darker)] border border-[var(--zalama-border)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--zalama-border)]/30 flex-shrink-0 bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--zalama-orange)] to-[var(--zalama-orange-accent)] rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  Détails de la demande
                </h2>
                  <p className="text-sm text-[var(--zalama-text-secondary)] mt-1">
                  Référence: {selectedDemande.demandes_detailes?.[0]?.numero_reception || selectedDemande.id || "N/A"}
                </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-[var(--zalama-text-secondary)] hover:text-white transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* En-tête avec photo et nom */}
              <div className="flex items-center justify-between gap-6 pb-6 border-b border-[var(--zalama-border)]/30">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                    {(() => {
                      const employeeData = employeesData.get(selectedDemande.employe_id);
                      const photoUrl = employeeData?.photo_url || (selectedDemande.employees as any)?.photo_url;
                      return photoUrl ? (
                        <Image
                          src={photoUrl}
                          alt={selectedDemande.demandeur || "Employé"}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                          {selectedDemande.employees
                            ? `${selectedDemande.employees.prenom.charAt(0)}${selectedDemande.employees.nom.charAt(0)}`
                            : selectedDemande.demandeur
                            ? selectedDemande.demandeur.split(' ').map((n: string) => n.charAt(0)).join('').slice(0, 2)
                            : "??"}
                        </span>
                      );
                    })()}
                  </div>
              <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedDemande.employees
                        ? `${selectedDemande.employees.prenom} ${selectedDemande.employees.nom}`
                        : selectedDemande.demandeur || "N/A"}
                    </h3>
                    <p className="text-[var(--zalama-text-secondary)] text-lg mt-1">
                      {selectedDemande.employees?.poste || selectedDemande.poste || "N/A"}
                    </p>
                  </div>
                  </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      selectedDemande.statut_global === "Validé" || selectedDemande.statut === "Validé"
                        ? "success"
                        : selectedDemande.statut_global === "Rejeté" || selectedDemande.statut === "Rejeté"
                        ? "error"
                        : "warning"
                    }
                    className="text-xs"
                  >
                    {selectedDemande.statut_global || selectedDemande.statut || "N/A"}
                  </Badge>
                  <Badge
                    variant={
                      selectedDemande.categorie === "mono-mois"
                        ? "info"
                        : selectedDemande.categorie === "multi-mois"
                        ? "purple"
                        : "default"
                    }
                    className="text-xs"
                  >
                    {selectedDemande.categorie === "mono-mois"
                      ? "Mono-mois"
                      : selectedDemande.categorie === "multi-mois"
                      ? "Multi-mois"
                      : selectedDemande.categorie || "N/A"}
                  </Badge>
                  </div>
                  </div>

              {/* Informations en grille */}
              <div className="space-y-4">
                {/* Email - prend toute la largeur */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <MailWarning className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Email</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedDemande.employe?.email || "Non renseigné"}
                  </p>
              </div>

                {/* Autres informations en grille */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Téléphone</span>
                  </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedDemande.employe?.telephone || "Non renseigné"}
                    </p>
                  </div>

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                        <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Montant demandé</span>
                  </div>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {(selectedDemande.montant_total_demande || selectedDemande.montant || 0).toLocaleString()} GNF
                    </p>
                  </div>

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Type de motif</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedDemande.demandes_detailes?.[0]?.type_motif || selectedDemande.type_motif || "Autre"}
                    </p>
              </div>

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Date de création</span>
                  </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedDemande.date_creation_premiere
                        ? new Date(selectedDemande.date_creation_premiere).toLocaleDateString("fr-FR")
                        : selectedDemande.date
                        ? new Date(selectedDemande.date).toLocaleDateString("fr-FR")
                        : "Non définie"}
                    </p>
                </div>

                  {selectedDemande.demandes_detailes?.[0]?.date_validation && (
                    <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                          <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Date de validation</span>
                      </div>
                      <p className="font-medium text-teal-600 dark:text-teal-400">
                        {new Date(selectedDemande.demandes_detailes[0].date_validation).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  )}

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                        <Hash className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Référence</span>
                    </div>
                    <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                      {selectedDemande.demandes_detailes?.[0]?.numero_reception || selectedDemande.id || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Motif - prend toute la largeur */}
                {(selectedDemande.demandes_detailes?.[0]?.motif || selectedDemande.motif) && (
                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                        <MessageSquare className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Motif</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedDemande.demandes_detailes?.[0]?.motif || selectedDemande.motif}
                    </p>
                  </div>
                )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
