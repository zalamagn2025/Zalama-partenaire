"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useEdgeAuth } from "@/hooks/useEdgeAuth";
import { supabase } from "@/lib/supabase";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
import { RefreshCw } from "lucide-react";
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
  
  // États pour les données Edge Function
  const [currentMonthData, setCurrentMonthData] = useState<any>(null);
  const [edgeFunctionLoading, setEdgeFunctionLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  // Pagination - utiliser les données Edge Function en priorité
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const dataForPagination = currentMonthData?.data || remboursements;
  const totalPages = Math.ceil(dataForPagination.length / itemsPerPage);
  const paginatedRemboursements = dataForPagination.slice(
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
      const remboursementsData = await edgeFunctionService.getDashboardRemboursements();

      if (!remboursementsData.success) {
        console.error("Erreur Edge Function:", remboursementsData.message);
        toast.error("Erreur lors du chargement des données du mois en cours");
        return;
      }

      // Les données sont directement dans la réponse selon votre exemple
      setCurrentMonthData(remboursementsData);
      
      // Mettre à jour les données locales avec les données du mois en cours
      if (remboursementsData.data && Array.isArray(remboursementsData.data)) {
          setRemboursements(remboursementsData.data);
          
          // Calcul du total en attente (seulement les remboursements en attente)
          const total = remboursementsData.data
            .filter((r: any) => r.statut === "EN_ATTENTE")
            .reduce(
              (sum: number, r: any) => sum + Number(r.montant_total_remboursement),
              0
            );
          setTotalAttente(total);
      }
      
      toast.success("Données des remboursements du mois en cours mises à jour avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement des données Edge Functions:", error);
      toast.error("Erreur lors du chargement des données du mois en cours");
    } finally {
      setEdgeFunctionLoading(false);
      setIsLoading(false);
    }
  };

  // Fonction de récupération des remboursements (fallback)
  const fetchRemboursements = async () => {
    if (!session?.partner) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("remboursements")
      .select(
        `
        id, employe_id, partenaire_id, demande_avance_id, montant_transaction, frais_service, montant_total_remboursement, date_limite_remboursement, statut, date_remboursement_effectue,
        employee:employe_id (nom, prenom, salaire_net)
      `
      )
      .eq("partenaire_id", session.partner.id)
      .order("date_limite_remboursement", { ascending: true });
    if (error) {
      console.error("Erreur récupération remboursements:", error);
    }

    // Récupérer les données de demande d'avance pour chaque remboursement
    const remboursementsAvecDemandes = await Promise.all(
      (data || []).map(async (r: any) => {
        try {
          const { data: demandeData, error: demandeError } = await supabase
            .from("salary_advance_requests")
            .select("montant_demande, date_validation")
            .eq("id", r.demande_avance_id)
            .single();

          if (demandeError) {
            console.error("Erreur récupération demande avance:", demandeError);
            return {
              ...r,
              employee: Array.isArray(r.employee) ? r.employee[0] : r.employee,
              demande_avance: null,
            };
          }

          return {
            ...r,
            employee: Array.isArray(r.employee) ? r.employee[0] : r.employee,
            demande_avance: demandeData,
          };
        } catch (error) {
          console.error("Erreur lors de la récupération de la demande:", error);
          return {
            ...r,
            employee: Array.isArray(r.employee) ? r.employee[0] : r.employee,
            demande_avance: null,
          };
        }
      })
    );

    // Récupérer tous les remboursements de chaque employé pour calculer le salaire restant
    const remboursementsAvecTousRemboursements = await Promise.all(
      remboursementsAvecDemandes.map(async (r: any) => {
        try {
          // Récupérer tous les remboursements de cet employé (tous statuts)
          const { data: tousRemboursements, error: tousRemboursementsError } =
            await supabase
              .from("remboursements")
              .select(
                `
              id, montant_total_remboursement, statut, date_creation,
              demande_avance:demande_avance_id (montant_demande, date_validation)
            `
              )
              .eq("employe_id", r.employe_id)
              .order("date_creation", { ascending: true });

          if (tousRemboursementsError) {
            console.error(
              "Erreur récupération tous remboursements:",
              tousRemboursementsError
            );
            return {
              ...r,
              tous_remboursements: [],
            };
          }

          return {
            ...r,
            tous_remboursements: tousRemboursements || [],
          };
        } catch (error) {
          console.error(
            "Erreur lors de la récupération de tous les remboursements:",
            error
          );
          return {
            ...r,
            tous_remboursements: [],
          };
        }
      })
    );

    console.log(
      "Remboursements avec tous remboursements:",
      remboursementsAvecTousRemboursements
    );
    setRemboursements(remboursementsAvecTousRemboursements);

    // Calcul du total en attente (seulement les remboursements en attente)
    const total = (remboursementsAvecTousRemboursements || [])
      .filter((r: any) => r.statut === "EN_ATTENTE")
      .reduce(
        (sum: number, r: any) => sum + Number(r.montant_total_remboursement),
        0
      );
    setTotalAttente(total);
    setIsLoading(false);
  };

  // Charger les remboursements au montage
  useEffect(() => {
    // Charger d'abord les données Edge Function
    loadCurrentMonthData();
    // Charger les employés pour avoir les salaires
    fetchEmployees();
  }, [session?.partner]);

  // Charger les données de fallback si pas de données Edge Function
  useEffect(() => {
    if (!currentMonthData && !edgeFunctionLoading) {
      fetchRemboursements();
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
        await fetchRemboursements(); // Rafraîchir la liste
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
        await fetchRemboursements(); // Rafraîchir la liste
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
      await fetchRemboursements();
      alert("Statuts mis à jour");
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      alert("Erreur lors du rafraîchissement");
    } finally {
      setIsLoading(false);
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
      const employeesData = await edgeFunctionService.getDashboardEmployees();
      if (employeesData.success && employeesData.data) {
        setEmployees(employeesData.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des employés:", error);
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
      const employee = employees.find(emp => emp.id === remboursement.employee.id);
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
      return Math.max(0, salaireNet - Number(remboursement.montant_transaction));
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
      return Number(remboursement.montant_transaction) - Number(remboursement.frais_service);
    }
    // Fallback pour les données locales
    return calculateMontantRecu(getMontantDemande(remboursement), getFraisService(remboursement));
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

  // Fonction pour obtenir le montant demandé en toute sécurité
  const getMontantDemande = (remboursement: any) => {
    // Pour les données Edge Function, utiliser montant_transaction
    if (remboursement.montant_transaction) {
      return Number(remboursement.montant_transaction);
    }
    // Fallback pour les données locales
    return Number(remboursement.demande_avance?.montant_demande || 0);
  };

  // Total des remboursements en attente seulement - utiliser les données Edge Function en priorité
  const totalRemboursements = currentMonthData?.data ? 
    currentMonthData.data
      .filter((r: any) => r.statut === "EN_ATTENTE")
      .reduce((sum: number, r: any) => sum + Number(r.montant_total_remboursement), 0) :
    remboursements
      .filter((r) => r.statut === "EN_ATTENTE")
      .reduce((sum, r) => sum + Number(r.montant_total_remboursement), 0);

  // Skeleton
  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center mb-4">
          <div className="text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {edgeFunctionLoading ? "Chargement des données du mois en cours..." : "Chargement des remboursements..."}
            </p>
          </div>
        </div>
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* En-tête professionnel */}
      <div className="bg-white dark:bg-[var(--zalama-card)] rounded-lg shadow-sm border border-gray-200 dark:border-[var(--zalama-border)] p-6">
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
                <RefreshCw className={`h-4 w-4 text-gray-500 ${edgeFunctionLoading ? 'animate-spin' : ''}`} />
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

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--zalama-card)] border border-gray-200 dark:border-[var(--zalama-border)] rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total en attente
              </div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {gnfFormatter(totalRemboursements)}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[var(--zalama-card)] border border-gray-200 dark:border-[var(--zalama-border)] rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Total remboursements
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {currentMonthData?.data ? currentMonthData.data.length : remboursements.length}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[var(--zalama-card)] border border-gray-200 dark:border-[var(--zalama-border)] rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                En attente
              </div>
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {currentMonthData?.data ? 
                  currentMonthData.data.filter((r: any) => r.statut === "EN_ATTENTE").length :
                  remboursements.filter((r) => r.statut === "EN_ATTENTE").length}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[var(--zalama-card)] border border-gray-200 dark:border-[var(--zalama-border)] rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Payés
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {currentMonthData?.data ? 
                  currentMonthData.data.filter((r: any) => r.statut === "PAYE").length :
                  remboursements.filter((r) => r.statut === "PAYE").length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des remboursements */}
      <div className="bg-[var(--zalama-card)] border border-gray-200 dark:border-[var(--zalama-border)] rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Liste des remboursements
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestion et suivi de tous les remboursements d'avances salariales
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-[var(--zalama-card)] border border-sgray-200 dark:border-[var(--zalama-border)]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Montant demandé
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Frais service (6,5%)
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Montant reçu
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Remboursement dû
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Salaire restant
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date avance
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[var(--zalama-card)] divide-y divide-gray-200 dark:divide-[var(--zalama-border)]">
              {paginatedRemboursements.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-6 text-gray-400 text-sm"
                  >
                    Aucun remboursement trouvé.
                  </td>
                </tr>
              )}
              {paginatedRemboursements.map((r: any, idx: number) => (
                <tr
                  key={r.id}
                  className="dark:bg-[var(--zalama-card)]  transition-colors"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {r.employee?.nom} {r.employee?.prenom}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {gnfFormatter(getSalaireNet(r))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                    {gnfFormatter(getMontantDemande(r))}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    {gnfFormatter(getFraisService(r))}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                    {gnfFormatter(getMontantRecu(r))}
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400">
                    {gnfFormatter(getRemboursementDu(r))}
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {gnfFormatter(calculateSalaireRestant(r))}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">
                    {r.date_transaction_effectuee
                      ? new Date(r.date_transaction_effectuee).toLocaleDateString("fr-FR")
                      : r.demande_avance?.date_validation
                      ? new Date(r.demande_avance.date_validation).toLocaleDateString("fr-FR")
                      : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${
                        r.statut === "PAYE"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : r.statut === "EN_ATTENTE"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      }`}
                    >
                      {r.statut === "PAYE"
                        ? "Payé"
                        : r.statut === "EN_ATTENTE"
                        ? "En attente"
                        : r.statut}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetail(r)}
                        className="text-xs px-2 py-1 h-7 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Voir
                      </Button>
                      {/* {r.statut === "EN_ATTENTE" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handlePayerIndividuel(r)}
                          disabled={paying}
                          className="text-xs px-2 py-1 h-7 flex items-center gap-1 bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="w-3 h-3" />
                          Payer
                        </Button>
                      )} */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination compacte */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[var(--zalama-card)] border rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, dataForPagination.length)} sur{" "}
              {dataForPagination.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Graphiques compacts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Répartition par statut
          </h3>
          <div className="h-48">
            <Pie
              data={{
                labels: Object.keys(stats),
                datasets: [
                  {
                    data: Object.values(stats),
                    backgroundColor: [
                      "#f59e0b",
                      "#10b981",
                      "#6b7280",
                      "#ef4444",
                    ],
                    borderWidth: 0,
                  },
                ],
              }}
              options={{
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      padding: 15,
                      usePointStyle: true,
                      font: { size: 11 },
                    },
                  },
                },
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
        <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Par employé
          </h3>
          <div className="h-48">
            <Bar
              data={{
                labels: Object.keys(employeStats).map(
                  (name) => name.split(" ")[0]
                ), // Prenom uniquement
                datasets: [
                  {
                    data: Object.values(employeStats),
                    backgroundColor: "#6366f1",
                    borderRadius: 4,
                    barThickness: 20,
                  },
                ],
              }}
              options={{
                indexAxis: "y" as const,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      title: (context) =>
                        Object.keys(employeStats)[context[0].dataIndex],
                      label: (context) =>
                        `${context.parsed.x} remboursement(s)`,
                    },
                  },
                },
                scales: {
                  x: {
                    display: false,
                    grid: { display: false },
                  },
                  y: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                  },
                },
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal de détail professionnelle */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              Détail du remboursement
            </DialogTitle>
            <DialogDescription>
              Informations complètes et historique de la demande d'avance
              salariale
            </DialogDescription>
          </DialogHeader>

          {selectedRemboursement && (
            <div className="space-y-6">
              {/* Section Employé */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Informations employé
                  </h3>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Nom complet
                    </span>
                    <span className="font-medium">
                      {selectedRemboursement.employee?.nom}{" "}
                      {selectedRemboursement.employee?.prenom}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Salaire net mensuel
                    </span>
                    <span className="font-medium">
                      {gnfFormatter(getSalaireNet(selectedRemboursement))}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section Détails financiers */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Détails financiers
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                      Montant demandé
                    </div>
                    <div className="text-lg font-bold text-blue-800 dark:text-blue-300">
                      {gnfFormatter(getMontantDemande(selectedRemboursement))}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Frais de service (6,5%)
                    </div>
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-300">
                      {gnfFormatter(getFraisService(selectedRemboursement))}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1">
                      Montant reçu par l'employé
                    </div>
                    <div className="text-lg font-bold text-green-800 dark:text-green-300">
                      {gnfFormatter(getMontantRecu(selectedRemboursement))}
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <div className="text-sm text-red-600 dark:text-red-400 mb-1">
                      Dû à ZaLaMa
                    </div>
                    <div className="text-lg font-bold text-red-800 dark:text-red-300">
                      {gnfFormatter(getRemboursementDu(selectedRemboursement))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">
                    Salaire restant après remboursement
                  </div>
                  <div className="text-xl font-bold text-orange-800 dark:text-orange-300">
                    {gnfFormatter(
                      calculateSalaireRestant(selectedRemboursement)
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section Dates */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Informations temporelles
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Date de l'avance
                    </div>
                    <div className="font-medium">
                      {selectedRemboursement.demande_avance?.date_validation
                        ? new Date(
                            selectedRemboursement.demande_avance.date_validation
                          ).toLocaleDateString("fr-FR")
                        : "-"}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Date limite remboursement
                    </div>
                    <div className="font-medium">
                      {new Date(
                        selectedRemboursement.date_limite_remboursement
                      ).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Date de paiement
                    </div>
                    <div className="font-medium">
                      {selectedRemboursement.date_remboursement_effectue
                        ? new Date(
                            selectedRemboursement.date_remboursement_effectue
                          ).toLocaleDateString("fr-FR")
                        : "Non payé"}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section Statut */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Statut actuel
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium
                    ${
                      selectedRemboursement.statut === "PAYE"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : selectedRemboursement.statut === "EN_ATTENTE"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                    }`}
                  >
                    {selectedRemboursement.statut === "PAYE" ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Payé
                      </>
                    ) : selectedRemboursement.statut === "EN_ATTENTE" ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        En attente
                      </>
                    ) : (
                      selectedRemboursement.statut
                    )}
                  </span>
                </div>
              </div>

              {/* Section Historique */}
              {selectedRemboursement.tous_remboursements &&
                selectedRemboursement.tous_remboursements.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <History className="w-4 h-4 text-indigo-600" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Historique des remboursements
                        </h3>
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-400 px-2 py-1 rounded-full">
                          {selectedRemboursement.tous_remboursements.length}{" "}
                          remboursement(s)
                        </span>
                      </div>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {selectedRemboursement.tous_remboursements.map(
                          (remb, index) => {
                            // Calculer le salaire restant après ce remboursement
                            let salaireRestantApres = getSalaireNet(selectedRemboursement);
                            for (let i = 0; i <= index; i++) {
                              const rembCourant =
                                selectedRemboursement.tous_remboursements![i];
                              const montantRemboursement = Number(
                                rembCourant.montant_total_remboursement || 0
                              );
                              salaireRestantApres = Math.max(
                                0,
                                salaireRestantApres - montantRemboursement
                              );
                            }

                            return (
                              <div
                                key={index}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-xs font-bold text-indigo-800 dark:text-indigo-400">
                                      {index + 1}
                                    </div>
                                    <span className="font-medium">
                                      Remboursement #{index + 1}
                                    </span>
                                  </div>
                                  <span className="font-bold text-lg">
                                    {gnfFormatter(
                                      Number(
                                        remb.montant_total_remboursement || 0
                                      )
                                    )}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Statut:{" "}
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        remb.statut === "PAYE"
                                          ? "text-green-600"
                                          : "text-yellow-600"
                                      }`}
                                    >
                                      {remb.statut}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 dark:text-gray-400">
                                      Date:{" "}
                                    </span>
                                    <span className="font-medium">
                                      {remb.date_creation
                                        ? new Date(
                                            remb.date_creation
                                          ).toLocaleDateString("fr-FR")
                                        : "-"}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                    <span className="font-medium">
                                      Salaire restant après ce remboursement:{" "}
                                    </span>
                                    <span className="font-bold">
                                      {gnfFormatter(salaireRestantApres)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </>
                )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal des informations financières de ZaLaMa */}
      <Dialog
        open={showFinancialInfoModal}
        onOpenChange={setShowFinancialInfoModal}
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building className="w-6 h-6 text-[var(--zalama-green)]" />
              Informations Financières - ZaLaMa SARL
            </DialogTitle>

            <DialogDescription>
              Relevé d'identité bancaire et coordonnées de l'entreprise
            </DialogDescription>
          </DialogHeader>

          {/* Conteneur avec scroll */}
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-6">
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
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowFinancialInfoModal(false)}
              className="flex items-center gap-2 border-[var(--zalama-border)] hover:bg-[var(--zalama-green)]/10 dark:hover:bg-[var(--zalama-green)]/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
