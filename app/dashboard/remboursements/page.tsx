"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { useEdgeAuth } from "@/hooks/useEdgeAuth";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
import { toast } from "sonner";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import {
  RefreshCw,
  Mail,
  Phone,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle,
  CreditCard,
  Eye,
  ArrowLeft,
  ArrowRight,
  User,
  Calendar,
  Receipt,
  History,
  AlertCircle,
  Building,
  X,
  Filter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

type Remboursement = {
  id: string;
  employe_id: string;
  partenaire_id: string;
  demande_avance_id: string;
  montant_transaction: number;
  frais_service: number;
  montant_total_remboursement: number;
  date_limite_remboursement: string;
  statut: string;
  date_remboursement_effectue: string | null;
  employee: {
    nom: string;
    prenom: string;
    salaire_net: number;
    email?: string;
    telephone?: string;
    poste?: string;
  };
  demande_avance?: {
    montant_demande: number;
    date_validation: string;
  };
  tous_remboursements?: {
    id: string;
    montant_total_remboursement: number;
    statut: string;
    date_creation: string;
    demande_avance?: {
      montant_demande: number;
      date_validation: string;
    };
  }[];
};

// Fonction pour obtenir le badge de statut
const getStatusBadge = (statut: string) => {
  // Normaliser le statut
  const statutUpper = statut?.toUpperCase() || '';
  
  switch (statutUpper) {
    case "PAYE":
    case "PAYÉ":
      return <Badge variant="success" className="bg-green-500 text-white border-0">Payé</Badge>;
    case "EN_ATTENTE":
    case "EN ATTENTE":
    case "ATTENTE":
      return <Badge variant="warning" className="bg-yellow-500 text-white border-0">En attente</Badge>;
    case "EN_RETARD":
    case "EN RETARD":
    case "RETARD":
      return <Badge variant="error" className="bg-red-500 text-white border-0">En retard</Badge>;
    default:
      return <Badge variant="default" className="bg-gray-500 text-white border-0">{statut}</Badge>;
  }
};

export default function RemboursementsPage() {
  const { session, loading } = useEdgeAuth();
  const [remboursements, setRemboursements] = useState<Remboursement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalAttente, setTotalAttente] = useState(0);
  const [paying, setPaying] = useState(false);
  const [selectedRemboursement, setSelectedRemboursement] =
    useState<Remboursement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFinancialInfoModal, setShowFinancialInfoModal] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] =
    useState<any>(null);
  const [showEmployeeDetailsModal, setShowEmployeeDetailsModal] =
    useState(false);

  // États pour les données Edge Function
  const [currentMonthData, setCurrentMonthData] = useState<any>(null);
  const [edgeFunctionLoading, setEdgeFunctionLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  // ✅ État pour le type de données affichées
  const [dataType, setDataType] = useState<'tous' | 'avances' | 'paiements'>('tous');

  // États pour les données de paiements de salaire
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentStatistics, setPaymentStatistics] = useState<any>(null);

  // États pour les filtres de l'edge function partner-reimbursements
  const [filters, setFilters] = useState({
    mois: null as number | null,
    annee: null as number | null,
    status: null as string | null,
    employee_id: null as string | null,
    categorie: null as string | null,
    date_debut: null as string | null,
    date_fin: null as string | null,
    limit: 50,
    offset: 0,
  });

  // État pour le toggle des filtres
  const [showFilters, setShowFilters] = useState(false);

  // États pour les données dynamiques des filtres
  const [activeMonths, setActiveMonths] = useState<number[]>([]);
  const [activeYears, setActiveYears] = useState<number[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [activityPeriods, setActivityPeriods] = useState<any>(null);

  // Pagination pour les données regroupées par employé
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Augmenté pour les employés
  const dataForPagination = currentMonthData?.data || [];
  const totalPages = Math.ceil(dataForPagination.length / itemsPerPage);
  const paginatedEmployees = dataForPagination.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Fonction pour charger les données du mois en cours depuis l'Edge Function
  const loadCurrentMonthData = async () => {
    if (!session?.access_token) {
      console.log("Pas de token d'accès disponible");
      return;
    }

    setEdgeFunctionLoading(true);
    setIsLoading(true);
    try {
      edgeFunctionService.setAccessToken(session.access_token);

      // Utiliser directement l'endpoint des remboursements pour récupérer les données du mois en cours
      const remboursementsData =
        await edgeFunctionService.getPartnerRemboursements();

      if (!remboursementsData.success) {
        console.error("Erreur Edge Function:", remboursementsData.message);
        toast.error("Erreur lors du chargement des données du mois en cours");
        return;
      }

      // Garder les données originales de l'Edge Function (regroupées par employé)
      const data = remboursementsData.data || [];

      setCurrentMonthData({ data: data });

      // Mettre à jour les données locales avec les données du mois en cours
      if (data && Array.isArray(data)) {
        setRemboursements(data);

        // Calcul du total en attente (seulement les remboursements en attente)
        const total = data
          .filter((r: any) => r.statut_global === "EN_ATTENTE")
          .reduce(
            (sum: number, r: any) =>
              sum + Number(r.montant_total_remboursement),
            0
          );
        setTotalAttente(total);
      }

      toast.success(
        "Données des remboursements du mois en cours mises à jour avec succès"
      );
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données Edge Functions:",
        error
      );
      toast.error("Erreur lors du chargement des données du mois en cours");
    } finally {
      setEdgeFunctionLoading(false);
      setIsLoading(false);
    }
  };

  // Fonction pour transformer les données de l'Edge Function
  const transformEdgeFunctionData = (edgeData: any[]) => {
    const transformedRemboursements: any[] = [];

    edgeData.forEach((employeGroup: any) => {
      // Pour chaque groupe d'employé, créer un remboursement pour chaque remboursement détaillé
      employeGroup.remboursements_detailes?.forEach((remboursement: any) => {
        transformedRemboursements.push({
          id: remboursement.id,
          employe_id: employeGroup.employe_id,
          partenaire_id: employeGroup.partenaire_id,
          montant_transaction: remboursement.montant_transaction,
          montant_total_remboursement:
            remboursement.montant_total_remboursement,
          frais_service:
            employeGroup.frais_service_total /
            employeGroup.nombre_remboursements, // Répartir les frais
          statut: remboursement.statut,
          date_creation: remboursement.date_creation,
          date_limite_remboursement: employeGroup.periode?.fin,
          employee: employeGroup.employe,
          partenaire: employeGroup.partenaire,
          periode: employeGroup.periode,
          categorie: employeGroup.categorie,
          salaire_restant: employeGroup.salaire_restant,
          // Données pour compatibilité avec l'ancien format
          demande_avance: {
            montant_demande: remboursement.montant_transaction,
            date_validation: remboursement.date_creation,
          },
          tous_remboursements: employeGroup.remboursements_detailes,
        });
      });
    });

    return transformedRemboursements;
  };

  // Fonction pour charger les remboursements avec l'Edge Function
  const loadRemboursementsData = async (customFilters: any = {}) => {
    if (!session?.access_token) return;

    setEdgeFunctionLoading(true);
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

      console.log(
        "🔄 Chargement des remboursements avec filtres:",
        cleanFilters
      );

      // Charger les remboursements
      const remboursementsData =
        await edgeFunctionService.getPartnerRemboursements(cleanFilters);

      if (!remboursementsData.success) {
        console.error("Erreur Edge Function:", remboursementsData.message);
        toast.error("Erreur lors du chargement des remboursements");
        return;
      }

      const data = remboursementsData.data || [];
      console.log("Remboursements chargés:", data);

      // Garder les données originales de l'Edge Function (regroupées par employé)
      setCurrentMonthData({ data: data });
    } catch (error) {
      console.error("Erreur lors du chargement des remboursements:", error);
      toast.error("Erreur lors du chargement des remboursements");
    } finally {
      setEdgeFunctionLoading(false);
    }
  };

  // Fonction pour charger les données de filtres dynamiques
  const loadFilterData = async () => {
    if (!session?.access_token) return;

    try {
      edgeFunctionService.setAccessToken(session.access_token);

      // Charger les employés actifs
      const employeesData =
        await edgeFunctionService.getPartnerRemboursementsEmployees();
      if (employeesData.success && employeesData.data) {
        setActiveEmployees(employeesData.data);
      }

      // Charger les périodes d'activité
      const periodsData =
        await edgeFunctionService.getPartnerRemboursementsActivityPeriods();
      if (periodsData.success && periodsData.data) {
        setActivityPeriods(periodsData.data);
        setActiveYears(periodsData.data.years || []);
        setActiveMonths(
          periodsData.data.months?.map((m: any) => m.numero) || []
        );
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données de filtres:", error);
    }
  };

  // Fonction pour appliquer un filtre
  const applyFilter = async (filterKey: string, value: any) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);

    // Recharger les données avec les nouveaux filtres
    await loadRemboursementsData(newFilters);
    // Recharger les statistiques avec les nouveaux filtres
    await loadStatistics(newFilters);
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = async () => {
    const defaultFilters = {
      mois: null,
      annee: null,
      status: null,
      employee_id: null,
      categorie: null,
      date_debut: null,
      date_fin: null,
      limit: 50,
      offset: 0,
    };
    setFilters(defaultFilters);
    await loadRemboursementsData(defaultFilters);
  };

  // Charger les remboursements au montage
  useEffect(() => {
    if (!loading && session?.partner) {
      // Charger d'abord les données Edge Function
      loadCurrentMonthData();
      // Charger les données de filtres
      loadFilterData();
      // Charger les remboursements avec l'Edge Function
      loadRemboursementsData();
      // Charger les statistiques
      loadStatistics();
      // ✅ Charger aussi les paiements de salaire
      loadPaymentHistory();
      // Charger les employés pour avoir les salaires
      fetchEmployees();
    }
  }, [loading, session?.partner]);

  // Charger les données de fallback si pas de données Edge Function
  useEffect(() => {
    if (!currentMonthData && !edgeFunctionLoading) {
      loadRemboursementsData();
    }
  }, [currentMonthData, edgeFunctionLoading]);

  // Action "Payer tous" via l'API Djomy
  const handlePayerTous = async () => {
    if (!session?.partner?.id) return;

    setPaying(true);
    try {
      // Récupérer tous les remboursements en attente
      const remboursementsEnAttente = remboursements.filter(
        (r) => r.statut === "EN_ATTENTE"
      );

      if (remboursementsEnAttente.length === 0) {
        alert("Aucun remboursement en attente à payer");
        setPaying(false);
        return;
      }

      // Utiliser notre API route Djomy pour chaque remboursement
      const results = await Promise.allSettled(
        remboursementsEnAttente.map(async (remboursement) => {
          const response = await fetch("/api/remboursements/djomy-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              remboursementId: remboursement.id,
              paymentMethod: "OM", // Par défaut Orange Money
            }),
          });

          return response.json();
        })
      );

      // Analyser les résultats
      const successful = results.filter(
        (result) => result.status === "fulfilled" && result.value.success
      );
      const failed = results.filter(
        (result) => result.status === "rejected" || !result.value?.success
      );

      console.log(
        `Paiements réussis: ${successful.length}, Échecs: ${failed.length}`
      );

      if (successful.length > 0) {
        alert(
          `Paiements initiés avec succès pour ${successful.length} remboursement(s). Vérifiez les statuts.`
        );
        await loadRemboursementsData(); // Rafraîchir la liste
      }

      if (failed.length > 0) {
        console.error("Échecs de paiement:", failed);
        alert(`Erreur lors du paiement de ${failed.length} remboursement(s)`);
      }
    } catch (error) {
      console.error("Erreur lors du paiement en lot:", error);
      alert("Erreur lors du paiement en lot");
    } finally {
      setPaying(false);
    }
  };

  // Handler pour ouvrir la modal de détail
  const handleViewDetail = (remb: Remboursement) => {
    setSelectedRemboursement(remb);
    setShowDetailModal(true);
  };

  // Handler pour fermer la modal de détail
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedRemboursement(null);
  };

  // Handler pour payer un remboursement individuel via Djomy
  const handlePayerIndividuel = async (remboursement: Remboursement) => {
    if (remboursement.statut !== "EN_ATTENTE") {
      alert(
        "Ce remboursement ne peut pas être payé (statut: " +
          remboursement.statut +
          ")"
      );
      return;
    }

    setPaying(true);
    try {
      const response = await fetch("/api/remboursements/djomy-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remboursementId: remboursement.id,
          paymentMethod: "OM", // Par défaut Orange Money
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Paiement initié:", data);
        alert(
          `Paiement initié pour ${remboursement.employee.nom} ${remboursement.employee.prenom}. Transaction ID: ${data.data?.transactionId}`
        );
        await loadRemboursementsData(); // Rafraîchir la liste
      } else {
        console.error("Erreur lors du paiement:", data.error);
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error("Erreur lors du paiement individuel:", error);
      alert("Erreur lors du paiement");
    } finally {
      setPaying(false);
    }
  };

  // Handler pour rafraîchir les statuts des paiements
  const handleRefreshStatus = async () => {
    setIsLoading(true);
    try {
      // Rafraîchir la liste des remboursements
      await loadRemboursementsData();
      alert("Statuts mis à jour");
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      alert("Erreur lors du rafraîchissement");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler pour afficher les détails d'un employé
  const handleShowEmployeeDetails = (employeeData: any) => {
    setSelectedEmployeeDetails(employeeData);
    setShowEmployeeDetailsModal(true);
  };

  // Fonction pour charger les statistiques depuis l'Edge Function
  const loadStatistics = async (customFilters: any = {}) => {
    if (!session?.access_token) return;

    try {
      edgeFunctionService.setAccessToken(session.access_token);

      // Combiner les filtres par défaut avec les filtres personnalisés
      const activeFilters = { ...filters, ...customFilters };

      // Nettoyer les filtres (enlever les valeurs null/undefined)
      const cleanFilters = Object.fromEntries(
        Object.entries(activeFilters).filter(
          ([_, value]) => value !== null && value !== undefined
        )
      );

      const statisticsData =
        await edgeFunctionService.getPartnerRemboursementsStatistics(
          cleanFilters
        );

      if (statisticsData.success && statisticsData.data) {
        setStatistics(statisticsData.data);
        console.log("📊 Statistiques chargées:", statisticsData.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  // Données pour les graphiques - utiliser les données Edge Function en priorité
  const dataForCharts = currentMonthData?.data || remboursements;

  const stats = dataForCharts.reduce((acc: any, r: any) => {
    acc[r.statut] = (acc[r.statut] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const employeStats = dataForCharts.reduce((acc: any, r: any) => {
    const nom = r.employee?.nom + " " + r.employee?.prenom;
    acc[nom] = (acc[nom] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Fonction utilitaire pour formater en GNF
  const gnfFormatter = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0 GNF";
    }
    return `${value.toLocaleString()} GNF`;
  };

  // Fonction pour récupérer les employés
  const fetchEmployees = async () => {
    if (!session?.partner) return;
    try {
      edgeFunctionService.setAccessToken(session.access_token);
      const employeesData =
        await edgeFunctionService.getPartnerRemboursementsEmployees();
      if (employeesData.success && employeesData.data) {
        setEmployees(employeesData.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des employés:", error);
    }
  };

  // ✅ Fonction pour charger les paiements de salaire
  const loadPaymentHistory = async (customFilters: any = {}) => {
    if (!session?.access_token) return;

    try {
      edgeFunctionService.setAccessToken(session.access_token);

      // Combiner les filtres
      const activeFilters = { ...filters, ...customFilters };
      
      // Convertir les filtres pour partner-payment-history
      const paymentFilters: any = {
        page: 1,
        limit: 100
      };
      if (activeFilters.mois) paymentFilters.mois = activeFilters.mois;
      if (activeFilters.annee) paymentFilters.annee = activeFilters.annee;
      if (activeFilters.employee_id) paymentFilters.employe_id = activeFilters.employee_id;
      if (activeFilters.status) paymentFilters.statut = activeFilters.status;

      console.log('🔄 Chargement paiements de salaire avec filtres:', paymentFilters);

      // Charger les paiements de salaire
      const paymentsData = await edgeFunctionService.getPartnerPaymentHistory(paymentFilters);

      if (paymentsData.success && paymentsData.data) {
        setPaymentHistory(paymentsData.data);
        console.log('✅ Paiements de salaire chargés:', paymentsData.data.length);
      }

      // Charger aussi les statistiques
      const statsData = await edgeFunctionService.getPartnerPaymentHistoryStatistics();
      if (statsData.success && statsData.data) {
        setPaymentStatistics(statsData.data);
        console.log('📊 Statistiques paiements chargées:', statsData.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paiements de salaire:', error);
      toast.error('Erreur lors du chargement des paiements de salaire');
    }
  };

  // Fonction pour obtenir le salaire net de l'employé
  const getSalaireNet = (remboursement: any) => {
    // Pour les données Edge Function, utiliser salaire_disponible de la demande
    if (remboursement.salaire_disponible) {
      return Number(remboursement.salaire_disponible);
    }

    // Chercher le salaire dans les données des employés
    if (remboursement.employee?.id && employees.length > 0) {
      const employee = employees.find(
        (emp) => emp.id === remboursement.employee.id
      );
      if (employee?.salaire_net) {
        return Number(employee.salaire_net);
      }
    }

    // Fallback pour les données locales
    return Number(remboursement.employee?.salaire_net || 0);
  };

  // Fonction pour calculer le salaire restant de l'employé en fonction de la position du remboursement
  const calculateSalaireRestant = (remboursement: any) => {
    const salaireNet = getSalaireNet(remboursement);

    // Pour les données Edge Function, calculer simplement salaire - montant_transaction
    if (remboursement.montant_transaction) {
      return Math.max(
        0,
        salaireNet - Number(remboursement.montant_transaction)
      );
    }

    // Fallback pour les données locales
    const tousRemboursements = remboursement.tous_remboursements || [];
    const positionActuelle = tousRemboursements.findIndex(
      (remb: any) => remb.id === remboursement.id
    );

    // Si ce remboursement n'est pas trouvé, retourner le salaire net
    if (positionActuelle === -1) {
      return salaireNet;
    }

    // Calculer le salaire restant en déduisant seulement les remboursements jusqu'à cette position
    let salaireRestant = salaireNet;

    // Déduire les remboursements jusqu'à la position actuelle (inclusive)
    for (let i = 0; i <= positionActuelle; i++) {
      const remb = tousRemboursements[i];
      const montantRemboursement = Number(
        remb.montant_total_remboursement || 0
      );
      salaireRestant = Math.max(0, salaireRestant - montantRemboursement);
    }

    return salaireRestant;
  };

  // Fonction pour obtenir le montant demandé en toute sécurité
  const getMontantDemande = (remboursement: any) => {
    // Pour les données Edge Function, utiliser montant_transaction
    if (remboursement.montant_transaction) {
      return Number(remboursement.montant_transaction);
    }
    // Fallback pour les données locales
    return Number(remboursement.demande_avance?.montant_demande || 0);
  };

  // Fonction pour calculer les frais de service (6,5%)
  const calculateFraisService = (montantDemande: number) => {
    return montantDemande * 0.065; // 6,5%
  };

  // Fonction pour obtenir les frais de service en toute sécurité
  const getFraisService = (remboursement: any) => {
    // Pour les données Edge Function, utiliser frais_service
    if (remboursement.frais_service) {
      return Number(remboursement.frais_service);
    }
    // Fallback pour les données locales
    return calculateFraisService(getMontantDemande(remboursement));
  };

  // Fonction pour calculer le montant reçu (avance - frais)
  const calculateMontantRecu = (
    montantDemande: number,
    fraisService: number
  ) => {
    return montantDemande - fraisService;
  };

  // Fonction pour obtenir le montant reçu en toute sécurité
  const getMontantRecu = (remboursement: any) => {
    // Pour les données Edge Function, calculer montant_transaction - frais_service
    if (remboursement.montant_transaction && remboursement.frais_service) {
      return (
        Number(remboursement.montant_transaction) -
        Number(remboursement.frais_service)
      );
    }
    // Fallback pour les données locales
    return calculateMontantRecu(
      getMontantDemande(remboursement),
      getFraisService(remboursement)
    );
  };

  // Fonction pour calculer le remboursement dû à ZaLaMa
  const calculateRemboursementDu = (montantDemande: number) => {
    return montantDemande; // Le remboursement dû = montant demandé
  };

  // Fonction pour obtenir le remboursement dû en toute sécurité
  const getRemboursementDu = (remboursement: any) => {
    // Pour les données Edge Function, utiliser montant_total_remboursement
    if (remboursement.montant_total_remboursement) {
      return Number(remboursement.montant_total_remboursement);
    }
    // Fallback pour les données locales
    return calculateRemboursementDu(getMontantDemande(remboursement));
  };

  // Total des remboursements en attente - utiliser les statistiques Edge Function en priorité
  const totalRemboursements =
    statistics?.montant_restant ||
    (currentMonthData?.data
      ? currentMonthData.data
          .filter((r: any) => r.statut_global === "EN_ATTENTE")
          .reduce(
            (sum: number, r: any) =>
              sum + Number(r.montant_total_remboursement),
            0
          )
      : remboursements
          .filter((r) => r.statut === "EN_ATTENTE")
          .reduce((sum, r) => sum + Number(r.montant_total_remboursement), 0));

  // Debug: Log des données pour vérifier
  console.log("🔍 Debug - currentMonthData:", currentMonthData);
  console.log("🔍 Debug - remboursements:", remboursements);
  console.log("🔍 Debug - totalRemboursements:", totalRemboursements);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Skeleton pour l'en-tête */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="bg-gray-300 dark:bg-gray-700 rounded h-8 w-96"></div>
              <div className="bg-gray-300 dark:bg-gray-700 rounded h-5 w-80"></div>
            </div>
            <div className="flex gap-2">
              <div className="bg-gray-300 dark:bg-gray-700 rounded h-10 w-32"></div>
              <div className="bg-gray-300 dark:bg-gray-700 rounded h-10 w-48"></div>
            </div>
          </div>
        </div>

        {/* Skeleton pour les filtres */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-4 h-32"></div>

        {/* Skeleton pour les statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-32"></div>
          ))}
        </div>

        {/* Skeleton pour le tableau des remboursements */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-3">
            {/* En-tête du tableau */}
            <div className="grid grid-cols-8 gap-4 pb-3 border-b border-gray-300 dark:border-gray-700">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-300 dark:bg-gray-700 rounded h-5"
                ></div>
              ))}
            </div>
            {/* Lignes du tableau */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-8 gap-4 py-3">
                {[...Array(8)].map((_, j) => (
                  <div
                    key={j}
                    className="bg-gray-300 dark:bg-gray-700 rounded h-6"
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton pour la pagination */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-12"></div>

        {/* Skeleton pour les graphiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-64"></div>
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-full overflow-hidden">
      {/* En-tête professionnel */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow-sm p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Gestion des remboursements
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Suivi et traitement des remboursements d'avances salariales
            </p>
          </div>

          <div className="flex items-center gap-2">
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
                <RefreshCw
                  className={`h-4 w-4 text-gray-500 ${
                    edgeFunctionLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-2 px-4 py-2 mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Remboursement
                </span>
              </div>
              <div className="relative">
                {/* Curseur animé */}
                <div className="absolute -top-8 -left-8 w-6 h-6 pointer-events-none animate-cursor-click">
                  <div className="w-6 h-6 bg-white border-2 border-gray-800 rounded-sm transform rotate-45 relative">
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-gray-800 rounded-sm"></div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowFinancialInfoModal(true)}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0 relative overflow-hidden group cursor-pointer px-6 py-2"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                  <Building className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">
                    Voir coordonnées bancaires de ZaLaMa
                  </span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 group-hover:animate-shimmer"></div>
                </Button>
              </div>
            </div>

            {/* <Button
              onClick={() => handleRefreshStatus()}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <History className="w-4 h-4 mr-2" />
                  Rafraîchir
                </>
              )}
            </Button>
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Paiement via Chèque
              </span>
            </div> */}
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
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
                onClick={() => loadRemboursementsData(filters)}
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
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les mois</option>
              {activeMonths.map((month) => (
                <option key={month} value={month}>
                  {new Date(0, month - 1).toLocaleString("fr-FR", {
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
              onChange={(e) => applyFilter("status", e.target.value || null)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les statuts</option>
              <option value="PAYE">Payé</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="EN_RETARD">En retard</option>
              <option value="ANNULE">Annulé</option>
            </select>
          </div>

          {/* Filtre par employé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employé
            </label>
            <select
              value={filters.employee_id || ""}
              onChange={(e) =>
                applyFilter("employee_id", e.target.value || null)
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les employés</option>
              {activeEmployees.map((employee, index) => (
                <option key={`${employee.id}-${index}`} value={employee.id}>
                  {employee.nom_complet || `${employee.prenom} ${employee.nom}`}
                </option>
              ))}
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

          {/* Filtre par période personnalisée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Période personnalisée
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.date_debut || ""}
                onChange={(e) =>
                  applyFilter("date_debut", e.target.value || null)
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Date début"
              />
              <input
                type="date"
                value={filters.date_fin || ""}
                onChange={(e) =>
                  applyFilter("date_fin", e.target.value || null)
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Date fin"
              />
            </div>
          </div>
        </div>
        )}

        {/* Indicateur de filtres actifs supprimé */}
        {edgeFunctionLoading && (
          <div className="px-4 pb-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            Mise à jour des données...
          </div>
        )}
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                Total en attente
              </div>
              <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                {gnfFormatter(totalRemboursements)}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Total remboursements
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {statistics?.total_remboursements ||
                  (currentMonthData?.data
                    ? currentMonthData.data.length
                    : remboursements.length)}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                En attente
              </div>
              <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                {statistics?.remboursements_en_attente ||
                  (currentMonthData?.data
                    ? currentMonthData.data.filter(
                        (r: any) => r.statut_global === "EN_ATTENTE"
                      ).length
                    : remboursements.filter((r) => r.statut === "EN_ATTENTE")
                        .length)}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                Payés
              </div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                {statistics?.remboursements_payes ||
                  (currentMonthData?.data
                    ? currentMonthData.data.filter(
                        (r: any) => r.statut_global === "PAYE"
                      ).length
                    : remboursements.filter((r) => r.statut === "PAYE").length)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des remboursements regroupés par employé */}
      <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg shadow overflow-hidden backdrop-blur-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Remboursements par employé
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vue d'ensemble des remboursements regroupés par employé
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[var(--zalama-card)] border-b border-[var(--zalama-border)] border-opacity-20">
              <tr>
                <th className="w-1/4 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employé
                </th>
                <th className="w-1/8 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total remboursement
                </th>
                <th className="w-1/8 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Frais service total
                </th>
                <th className="w-1/8 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre de remboursements
                </th>
                <th className="w-1/8 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Salaire restant
                </th>
                <th className="w-1/8 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Période
                </th>
                <th className="w-1/8 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut global
                </th>
                <th className="w-1/8 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[var(--zalama-border)]">
              {currentMonthData?.data?.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-6 text-gray-400 text-sm"
                  >
                    Aucun remboursement trouvé.
                  </td>
                </tr>
              )}
              {paginatedEmployees.map((employeeData: any, idx: number) => (
                <tr
                  key={`${employeeData.employe_id}-${idx}`}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {(employeeData.employe as any)?.photo_url ? (
                          <Image
                            src={(employeeData.employe as any).photo_url}
                            alt={`${employeeData.employe?.prenom} ${employeeData.employe?.nom}`}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                            {employeeData.employe?.prenom?.charAt(0)}
                            {employeeData.employe?.nom?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {employeeData.employe?.prenom} {employeeData.employe?.nom}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {employeeData.employe?.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Salaire: {gnfFormatter(employeeData.employe?.salaire_net)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm font-medium text-orange-600 dark:text-orange-400">
                    {gnfFormatter(employeeData.montant_total_remboursement)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {gnfFormatter(employeeData.frais_service_total)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {employeeData.nombre_remboursements}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {gnfFormatter(employeeData.salaire_restant)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                    {employeeData.periode?.periode_complete || employeeData.periode?.description || 'N/A'}
                  </td>
                  <td className="px-3 py-4">
                    {getStatusBadge(employeeData.statut_global)}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <button
                      onClick={() => handleShowEmployeeDetails(employeeData)}
                      className="group relative p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      title="Voir les détails des remboursements"
                    >
                      <Eye className="h-4 w-4" />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Détails
                      </div>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {/* Pagination */}
        {dataForPagination.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={dataForPagination.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modal de détail professionnelle */}
      {showDetailModal && selectedRemboursement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-[var(--zalama-bg-darker)] border border-[var(--zalama-border)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--zalama-border)]/30 flex-shrink-0 bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--zalama-orange)] to-[var(--zalama-orange-accent)] rounded-full flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
              <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  Détail du remboursement
                </h2>
                  <p className="text-sm text-[var(--zalama-text-secondary)] mt-1">
                  Référence: {selectedRemboursement.id || "N/A"}
                </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-[var(--zalama-text-secondary)] hover:text-white transition-all duration-200 hover:scale-110"
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
                      {selectedRemboursement.employee?.prenom} {selectedRemboursement.employee?.nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Poste</p>
                    <p className="font-medium">{selectedRemboursement.employee?.poste || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-sm">{selectedRemboursement.employee?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedRemboursement.employee?.telephone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Détails Financiers */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Détails Financiers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">Montant demandé</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {gnfFormatter(getMontantDemande(selectedRemboursement))}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Frais de service (6,5%)</p>
                    <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                      {gnfFormatter(getFraisService(selectedRemboursement))}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-2">Montant reçu</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {gnfFormatter(getMontantRecu(selectedRemboursement))}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400 mb-2">Remboursement dû</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">
                      {gnfFormatter(getRemboursementDu(selectedRemboursement))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates et Statut */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Dates et Statut
                </h3>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date d'avance</span>
                    <span className="font-medium">
                      {selectedRemboursement.demande_avance?.date_validation
                        ? new Date(selectedRemboursement.demande_avance.date_validation).toLocaleDateString("fr-FR")
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date limite</span>
                    <span className="font-medium">
                      {new Date(selectedRemboursement.date_limite_remboursement).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date de paiement</span>
                    <span className="font-medium">
                      {selectedRemboursement.date_remboursement_effectue
                        ? new Date(selectedRemboursement.date_remboursement_effectue).toLocaleDateString("fr-FR")
                        : "Non payé"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Statut</span>
                    <span>{getStatusBadge(selectedRemboursement.statut)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-center p-6 border-t border-[var(--zalama-border)]/30 flex-shrink-0 bg-[var(--zalama-bg-light)]/30">
              <div className="flex items-center gap-4">
                <button
                onClick={() => setShowDetailModal(false)} 
                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-400 bg-transparent border border-gray-500/30 rounded-lg hover:bg-gray-500/10 hover:text-gray-300 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm transition-all duration-300 group"
              >
                  <X className="h-4 w-4 group-hover:scale-110 transition-all duration-300" />
                  <span className="group-hover:scale-105 transition-all duration-300">
                Fermer
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des informations financières de ZaLaMa */}
      {showFinancialInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-[var(--zalama-bg-darker)] border border-[var(--zalama-border)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--zalama-border)]/30 flex-shrink-0 bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--zalama-orange)] to-[var(--zalama-orange-accent)] rounded-full flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
              <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  Informations Financières - ZaLaMa SARL
                </h2>
                  <p className="text-sm text-[var(--zalama-text-secondary)] mt-1">
                  Relevé d'identité bancaire et coordonnées de l'entreprise
                </p>
              </div>
              </div>
              <button
                onClick={() => setShowFinancialInfoModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-[var(--zalama-text-secondary)] hover:text-white transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Informations bancaires */}
              <div className="bg-gradient-to-br from-[var(--zalama-green)]/10 to-[var(--zalama-blue)]/10 dark:from-[var(--zalama-green)]/20 dark:to-[var(--zalama-blue)]/20 border border-[var(--zalama-green)]/30 dark:border-[var(--zalama-green)]/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[var(--zalama-green)]" />
                  Relevé d'Identité Bancaire (RIB)
                </h3>

                {/* Disposition verticale avec scroll */}
                <div className="space-y-4">
                  {/* Informations de l'entreprise */}
                  <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-[var(--zalama-green)] dark:text-[var(--zalama-green)] mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Informations de l'entreprise
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Intitulé de compte :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-green)]/10 dark:bg-[var(--zalama-green)]/20 px-3 py-1 rounded">
                          ZALAMA SARL
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          RIB :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-blue)]/10 dark:bg-[var(--zalama-blue)]/20 px-3 py-1 rounded font-mono">
                          010008733602009966
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          IBAN :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-blue)]/10 dark:bg-[var(--zalama-blue)]/20 px-3 py-1 rounded font-mono">
                          GN010008733602009966
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Devise :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-green)]/10 dark:bg-[var(--zalama-green)]/20 px-3 py-1 rounded">
                          GNF
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informations de la banque */}
                  <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-[var(--zalama-blue)] dark:text-[var(--zalama-blue)] mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Informations de la banque
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Nom :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-blue)]/10 dark:bg-[var(--zalama-blue)]/20 px-3 py-1 rounded">
                          Ecobank
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Code Swift :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-blue)]/10 dark:bg-[var(--zalama-blue)]/20 px-3 py-1 rounded font-mono">
                          ECOCGNCN
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Code Banque :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-blue)]/10 dark:bg-[var(--zalama-blue)]/20 px-3 py-1 rounded font-mono">
                          GN010
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Code Guichet :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-blue)]/10 dark:bg-[var(--zalama-blue)]/20 px-3 py-1 rounded font-mono">
                          008
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Numéro de Compte :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-blue)]/10 dark:bg-[var(--zalama-blue)]/20 px-3 py-1 rounded font-mono">
                          7336020099
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informations UBA */}
                  <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-[var(--zalama-blue)] dark:text-[var(--zalama-blue)] mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Informations UBA
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Nom :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-blue)]/10 dark:bg-[var(--zalama-blue)]/20 px-3 py-1 rounded">
                          UBA GUINEA AGENCE DE MADINA
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Numéro de compte :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-blue)]/10 dark:bg-[var(--zalama-blue)]/20 px-3 py-1 rounded font-mono">
                          60021030009258
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Numéro RIB :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-blue)]/10 dark:bg-[var(--zalama-blue)]/20 px-3 py-1 rounded font-mono">
                          015-002-1030009258-56
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Intitulé du compte :
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white bg-[var(--zalama-green)]/10 dark:bg-[var(--zalama-green)]/20 px-3 py-1 rounded">
                          ZALAMA SARL
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Adresse de l'agence */}
                  <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] rounded-lg p-4">
                    <h4 className="text-sm font-medium text-[var(--zalama-green)] dark:text-[var(--zalama-green)] mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Adresse de l'agence
                    </h4>
                    <div className="bg-[var(--zalama-green)]/5 dark:bg-[var(--zalama-green)]/10 border border-[var(--zalama-green)]/20 dark:border-[var(--zalama-green)]/30 rounded-lg p-4">
                      <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                        <span className="font-medium">Immeuble AL Iman</span>
                        <br />
                        <span className="font-medium">
                          Avenue de la République
                        </span>
                        <br />
                        <span className="text-gray-600 dark:text-gray-400">
                          Conakry, Guinée
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Note importante */}
                  <div className="bg-[var(--zalama-green)]/5 dark:bg-[var(--zalama-green)]/10 border border-[var(--zalama-green)]/20 dark:border-[var(--zalama-green)]/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-[var(--zalama-green)] mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="text-sm font-medium text-[var(--zalama-green)] dark:text-[var(--zalama-green)] mb-1">
                          Note importante
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Veuillez utiliser ces coordonnées bancaires pour
                          effectuer vos virements de remboursement. Assurez-vous
                          de bien indiquer la référence de votre demande
                          d'avance dans le libellé du virement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-center p-6 border-t border-[var(--zalama-border)]/30 flex-shrink-0 bg-[var(--zalama-bg-light)]/30">
              <div className="flex items-center gap-4">
                <button
                onClick={() => setShowFinancialInfoModal(false)} 
                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-400 bg-transparent border border-gray-500/30 rounded-lg hover:bg-gray-500/10 hover:text-gray-300 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm transition-all duration-300 group"
              >
                  <X className="h-4 w-4 group-hover:scale-110 transition-all duration-300" />
                  <span className="group-hover:scale-105 transition-all duration-300">
                Fermer
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des détails d'un employé */}
      {showEmployeeDetailsModal && selectedEmployeeDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-[var(--zalama-bg-darker)] border border-[var(--zalama-border)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--zalama-border)]/30 flex-shrink-0 bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--zalama-orange)] to-[var(--zalama-orange-accent)] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    Détails de l'employé
                </h2>
                  <p className="text-sm text-[var(--zalama-text-secondary)] mt-1">
                    Informations complètes de l'employé
                </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmployeeDetailsModal(false)}
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
                    {(selectedEmployeeDetails.employe as any)?.photo_url ? (
                      <Image
                        src={(selectedEmployeeDetails.employe as any).photo_url}
                        alt={`${selectedEmployeeDetails.employe?.prenom} ${selectedEmployeeDetails.employe?.nom}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                        {selectedEmployeeDetails.employe?.prenom?.charAt(0)}
                        {selectedEmployeeDetails.employe?.nom?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedEmployeeDetails.employe?.prenom} {selectedEmployeeDetails.employe?.nom}
                    </h3>
                    <p className="text-[var(--zalama-text-secondary)] text-lg mt-1">
                      {selectedEmployeeDetails.employe?.poste || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="info" className="text-xs">
                    {selectedEmployeeDetails.nombre_remboursements} remboursement(s)
                  </Badge>
                </div>
              </div>

              {/* Informations en grille */}
              <div className="space-y-4">
                {/* Email - prend toute la largeur */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Email</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedEmployeeDetails.employe?.email || "Non renseigné"}
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
                      {selectedEmployeeDetails.employe?.telephone || "Non renseigné"}
                    </p>
                  </div>

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                        <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Salaire net</span>
                    </div>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {gnfFormatter(selectedEmployeeDetails.employe?.salaire_net)}
                    </p>
                  </div>

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Total remboursement</span>
                    </div>
                    <p className="font-medium text-red-600 dark:text-red-400">
                      {gnfFormatter(selectedEmployeeDetails.montant_total_remboursement)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Résumé des remboursements */}
              <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-xl p-6 shadow-sm backdrop-blur-sm">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--zalama-orange)]" />
                  Résumé des remboursements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Remboursements</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {selectedEmployeeDetails.nombre_remboursements}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-4 border border-orange-200 dark:border-orange-800/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">Total à rembourser</p>
                    </div>
                    <p className="text-xl font-bold text-orange-900 dark:text-orange-100 break-words">
                      {gnfFormatter(
                        selectedEmployeeDetails.montant_total_remboursement
                      )}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Frais service</p>
                    </div>
                    <p className="text-xl font-bold text-purple-900 dark:text-purple-100 break-words">
                      {gnfFormatter(
                        selectedEmployeeDetails.frais_service_total
                      )}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 font-medium">Salaire restant</p>
                    </div>
                    <p className="text-xl font-bold text-green-900 dark:text-green-100 break-words">
                      {gnfFormatter(selectedEmployeeDetails.salaire_restant)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Période */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8">
                <h4 className="text-xl font-semibold text-green-900 dark:text-green-300 mb-4">
                  Période de paiement
                </h4>
                <p className="text-base text-green-700 dark:text-green-300 mb-2">
                  {selectedEmployeeDetails.periode?.description}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {selectedEmployeeDetails.periode?.periode_complete}
                </p>
              </div>

              {/* Liste des remboursements individuels */}
              <div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Remboursements individuels
                </h4>
                <div className="space-y-4">
                  {selectedEmployeeDetails.remboursements_detailes?.map(
                    (remb: any, index: number) => (
                      <div
                        key={`${remb.id}-${index}`}
                        className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-xl p-5 shadow-sm backdrop-blur-sm"
                      >
                        {/* En-tête du remboursement */}
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--zalama-border)]/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[var(--zalama-orange)] to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {index + 1}
                            </div>
                            <div>
                              <h5 className="font-semibold text-white">
                                Remboursement #{index + 1}
                              </h5>
                              <p className="text-xs text-[var(--zalama-text-secondary)]">
                                {new Date(remb.date_creation).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[var(--zalama-text-secondary)] mb-1">Total dû</p>
                            <span className="font-bold text-xl text-orange-500">
                              {gnfFormatter(remb.montant_total_remboursement)}
                            </span>
                          </div>
                        </div>

                        {/* Détails financiers en cartes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-200 dark:border-blue-800/30">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Montant demandé</p>
                            </div>
                            <p className="text-base font-bold text-blue-900 dark:text-blue-100">
                              {gnfFormatter(remb.montant_transaction)}
                            </p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 border border-purple-200 dark:border-purple-800/30">
                            <div className="flex items-center gap-2 mb-1">
                              <CreditCard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">Frais service (6,5%)</p>
                            </div>
                            <p className="text-base font-bold text-purple-900 dark:text-purple-100">
                              {gnfFormatter(remb.montant_transaction * 0.065)}
                            </p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3 border border-green-200 dark:border-green-800/30">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                              <p className="text-xs text-green-700 dark:text-green-300 font-medium">Montant reçu</p>
                            </div>
                            <p className="text-base font-bold text-green-900 dark:text-green-100">
                              {gnfFormatter(
                                remb.montant_transaction - remb.montant_transaction * 0.065
                              )}
                            </p>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3 border border-orange-200 dark:border-orange-800/30">
                            <div className="flex items-center gap-2 mb-1">
                              <Receipt className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                              <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">Remboursement dû</p>
                            </div>
                            <p className="text-base font-bold text-orange-900 dark:text-orange-100">
                              {gnfFormatter(remb.montant_total_remboursement)}
                            </p>
                          </div>
                        </div>

                        {/* Statut */}
                        <div className="flex items-center justify-center pt-4 border-t border-[var(--zalama-border)]/30">
                          {getStatusBadge(remb.statut)}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
