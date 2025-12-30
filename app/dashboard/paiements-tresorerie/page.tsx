"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Banknote,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Building,
  Users,
  FileText,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Search,
} from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import {
  useTreasuryAdvances,
  useRepayTreasuryAdvance,
} from "@/hooks/useTreasuryAdvances";
import Pagination from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  TreasuryAdvance,
  TreasuryAdvanceStatus,
} from "@/types/api";

// Fonction pour obtenir le badge de statut
const getStatusBadge = (statut: TreasuryAdvanceStatus) => {
  switch (statut) {
    case "REQUESTED":
      return <Badge className="bg-blue-500 text-white">Demandée</Badge>;
    case "WAITING_ADMIN_VALIDATION":
      return <Badge className="bg-yellow-500 text-white">En validation</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-500 text-white">Approuvée</Badge>;
    case "REJECTED":
      return <Badge className="bg-red-500 text-white">Rejetée</Badge>;
    case "RELEASED":
      return <Badge className="bg-purple-500 text-white">Débloquée</Badge>;
    case "REPAYMENT_PENDING":
      return <Badge className="bg-orange-500 text-white">Remboursement en attente</Badge>;
    case "OVERDUE":
      return <Badge className="bg-red-600 text-white">En retard</Badge>;
    case "PENALTY_APPLIED":
      return <Badge className="bg-red-700 text-white">Pénalité appliquée</Badge>;
    case "REPAID":
      return <Badge className="bg-gray-500 text-white">Remboursée</Badge>;
    default:
      return <Badge>{statut}</Badge>;
  }
};

// Fonction pour formatter les montants en GNF
const gnfFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0 GNF";
  }
  return `${value.toLocaleString()} GNF`;
};

// Fonction pour formatter les montants (sans GNF) - comme dans la page wallet
const formatAmount = (amount: number | undefined | null) => {
  if (!amount || isNaN(amount)) return '0';
  return new Intl.NumberFormat('fr-FR').format(amount);
};

// Fonction pour formatter les dates
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function PaiementsTresoreriePage() {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // États pour les filtres
  const [selectedStatus, setSelectedStatus] = useState<string | null>(() => {
    return searchParams.get("status") || null;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  });
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  // États pour les modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<TreasuryAdvance | null>(null);
  const [selectedAdvanceDetails, setSelectedAdvanceDetails] = useState<any>(null);

  // États pour le remboursement
  const [repayFormData, setRepayFormData] = useState({
    montant: 0,
    methodeRemboursement: "WALLET" as "WALLET" | "EXTERNAL",
    numeroCompteRemboursement: "",
    reference: "",
    commentaire: "",
  });

  // Hook pour synchroniser les filtres avec l'URL
  const { updateFilter, resetFilters: resetUrlFilters } = useUrlFilters(
    {
      status: selectedStatus,
      search: searchTerm,
      page: currentPage,
    },
    {
      exclude: [
        "showFilters",
        "showDetailModal",
        "showRepayModal",
        "selectedAdvance",
      ],
    }
  );

  // Utiliser les hooks pour récupérer les données
  const { data: advancesResponse, isLoading, refetch } = useTreasuryAdvances({
    statut: selectedStatus as TreasuryAdvanceStatus | undefined,
    limit: itemsPerPage,
    page: currentPage,
  });


  // Hook pour rembourser
  const repayMutation = useRepayTreasuryAdvance();

  // Extraire les données - La réponse API retourne { data: [...], total, page, limit, totalPages }
  const advancesListResponse = advancesResponse as any;
  const advancesData = (advancesListResponse?.data || []) as TreasuryAdvance[];
  const totalAdvances = advancesListResponse?.total || advancesData.length;
  const totalPages = advancesListResponse?.totalPages || Math.ceil(totalAdvances / itemsPerPage);

  // Fonction pour charger les détails d'une avance
  const loadAdvanceDetails = async (id: string) => {
    try {
      const { getApiUrl } = await import('@/config/api');
      const response = await fetch(
        getApiUrl(`/treasury-advances/${id}`),
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedAdvanceDetails(data.data || data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
    }
  };

  // Fonctions wrapper pour mettre à jour les filtres et l'URL
  const handleStatusChange = (value: string | null) => {
    setSelectedStatus(value);
    updateFilter("status", value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    updateFilter("search", value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateFilter("page", page);
  };

  // Fonction pour rembourser
  const handleRepay = async () => {
    if (!selectedAdvance) {
      toast.error("Aucune avance sélectionnée");
      return;
    }

    if (repayFormData.montant <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    if (
      repayFormData.methodeRemboursement === "EXTERNAL" &&
      !repayFormData.numeroCompteRemboursement
    ) {
      toast.error("Veuillez renseigner le numéro de compte");
      return;
    }

    try {
      await repayMutation.mutateAsync({
        id: selectedAdvance.id,
        data: {
          montant: repayFormData.montant,
          methodeRemboursement: repayFormData.methodeRemboursement,
          numeroCompteRemboursement:
            repayFormData.methodeRemboursement === "EXTERNAL"
              ? repayFormData.numeroCompteRemboursement
              : undefined,
          reference: repayFormData.reference || undefined,
          commentaire: repayFormData.commentaire || undefined,
        },
      });

      toast.success("Remboursement effectué avec succès");
      setShowRepayModal(false);
      setRepayFormData({
        montant: 0,
        methodeRemboursement: "WALLET",
        numeroCompteRemboursement: "",
        reference: "",
        commentaire: "",
      });
      refetch();
      if (selectedAdvance) {
        loadAdvanceDetails(selectedAdvance.id);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du remboursement");
    }
  };

  // Filtrer les données selon le terme de recherche
  const filteredAdvances = advancesData.filter((advance) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      advance.reference?.toLowerCase().includes(searchLower) ||
      advance.commentaire?.toLowerCase().includes(searchLower) ||
      advance.id.toLowerCase().includes(searchLower)
    );
  });

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [loading, session, router]);

  // Si en cours de chargement initial
  if (loading || isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Skeleton pour l'en-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-3">
            <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-10 w-96"></div>
            <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-6 w-80"></div>
          </div>
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-12 w-48"></div>
        </div>

        {/* Skeleton pour les statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-32"></div>
          ))}
        </div>

        {/* Skeleton pour les filtres */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-20"></div>

        {/* Skeleton pour le tableau */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-3">
            {/* En-tête du tableau */}
            <div className="grid grid-cols-7 gap-4 pb-3 border-b border-gray-300 dark:border-gray-700">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-300 dark:bg-gray-700 rounded h-5"
                ></div>
              ))}
            </div>
            {/* Lignes du tableau */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-4 py-3">
                {[...Array(7)].map((_, j) => (
                  <div
                    key={j}
                    className="bg-gray-300 dark:bg-gray-700 rounded h-6"
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculer les statistiques
  const totalDemandes = filteredAdvances.length;
  const enAttente = filteredAdvances.filter((a) => a.statut === "REQUESTED" || a.statut === "WAITING_ADMIN_VALIDATION").length;
  const approuvees = filteredAdvances.filter((a) => a.statut === "APPROVED" || a.statut === "RELEASED").length;
  const remboursees = filteredAdvances.filter((a) => a.statut === "REPAID").length;
  const totalMontant = filteredAdvances.reduce((sum, a) => sum + a.montantTotal, 0);
  const totalRembourse = filteredAdvances.reduce((sum, a) => sum + a.montantRembourse, 0);
  const totalRestant = totalMontant - totalRembourse;

  return (
    <div className="p-6">
      {/* En-tête avec titre et bouton d'action */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Paiements par Avances de Trésorerie
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Gérez les demandes d'avances de trésorerie pour le paiement des salaires
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/paiements-tresorerie/nouvelle-demande")}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            style={{ background: 'var(--zalama-orange)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--zalama-orange)'}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nouvelle demande</span>
          </button>
        </div>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        {/* Total Demandes */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-5 border border-blue-200 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge variant="info" className="text-xs">Total</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {totalDemandes}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Total Demandes
            </p>
          </div>
        </div>

        {/* Montant Total */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-5 border border-green-200 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="success" className="text-xs">Montant</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {formatAmount(totalMontant)} GNF
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Montant Total
            </p>
          </div>
        </div>

        {/* En Attente */}
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-5 border border-orange-200 dark:border-orange-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <Badge variant="warning" className="text-xs">En attente</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {enAttente}
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              En Attente
            </p>
          </div>
        </div>

        {/* Approuvées */}
        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-5 border border-purple-200 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">Approuvées</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {approuvees}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
              Approuvées
            </p>
          </div>
        </div>

        {/* Remboursées */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-5 border border-green-200 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Banknote className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="success" className="text-xs">Remboursées</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {remboursees}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Remboursées
            </p>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
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
                onClick={() => {
                  setSelectedStatus(null);
                  setSearchTerm("");
                  resetUrlFilters();
                  setCurrentPage(1);
                }}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => refetch()}
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
            {/* Barre de recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recherche
              </label>
              <div>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                value={selectedStatus || "all"}
                onChange={(e) => handleStatusChange(e.target.value === "all" ? null : e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="REQUESTED">Demandée</option>
                <option value="WAITING_ADMIN_VALIDATION">En validation</option>
                <option value="APPROVED">Approuvée</option>
                <option value="REJECTED">Rejetée</option>
                <option value="RELEASED">Débloquée</option>
                <option value="REPAYMENT_PENDING">Remboursement en attente</option>
                <option value="OVERDUE">En retard</option>
                <option value="PENALTY_APPLIED">Pénalité appliquée</option>
                <option value="REPAID">Remboursée</option>
              </select>
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


      {/* Tableau des avances */}
      {isLoading ? (
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="space-y-3">
            {/* En-tête du tableau */}
            <div className="grid grid-cols-7 gap-4 pb-3 border-b border-gray-300 dark:border-gray-700">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-300 dark:bg-gray-700 rounded h-5"
                ></div>
              ))}
            </div>
            {/* Lignes du tableau */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-4 py-3">
                {[...Array(7)].map((_, j) => (
                  <div
                    key={j}
                    className="bg-gray-300 dark:bg-gray-700 rounded h-6"
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : filteredAdvances.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune avance trouvée
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Aucune avance de trésorerie ne correspond aux critères de recherche.
          </p>
        </div>
      ) : (
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
                <tr>
                  <th className="w-1/5 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="w-1/6 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Montant Total
                  </th>
                  <th className="w-1/6 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Montant Remboursé
                  </th>
                  <th className="w-1/6 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Montant Restant
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="w-1/8 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date création
                  </th>
                  <th className="w-1/12 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[var(--zalama-border)]">
                {filteredAdvances.map((advance) => (
                  <tr
                    key={advance.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {advance.reference || advance.id.slice(0, 8)}
                      </div>
                      {advance.commentaire && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {advance.commentaire}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatAmount(advance.montantTotal)}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatAmount(advance.montantRembourse)}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        {formatAmount(advance.montantTotal - advance.montantRembourse)}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      {getStatusBadge(advance.statut)}
                    </td>
                    <td className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(advance.dateDemande)}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={async () => {
                            setSelectedAdvance(advance);
                            await loadAdvanceDetails(advance.id);
                            setShowDetailModal(true);
                          }}
                          className="group relative p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                            Voir
                          </div>
                        </button>
                        {(advance.statut === "RELEASED" ||
                          advance.statut === "REPAYMENT_PENDING" ||
                          advance.statut === "OVERDUE") && (
                          <button
                            onClick={() => {
                              setSelectedAdvance(advance);
                              const montantRestant = advance.montantTotal - advance.montantRembourse;
                              setRepayFormData({
                                montant: montantRestant > 0 ? montantRestant : advance.montantTotal,
                                methodeRemboursement: "WALLET",
                                numeroCompteRemboursement: "",
                                reference: "",
                                commentaire: "",
                              });
                              setShowRepayModal(true);
                            }}
                            className="group relative p-2 rounded-full bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            title="Rembourser"
                          >
                            <DollarSign className="h-4 w-4" />
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                              Rembourser
                            </div>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredAdvances.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalAdvances}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}

      {/* Modal de détails */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'avance de trésorerie</DialogTitle>
          </DialogHeader>
          {selectedAdvance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Référence</Label>
                  <p className="text-sm dark:text-white">
                    {selectedAdvance.reference || selectedAdvance.id}
                  </p>
                </div>
                <div>
                  <Label>Statut</Label>
                  <div>{getStatusBadge(selectedAdvance.statut)}</div>
                </div>
                <div>
                  <Label>Montant total</Label>
                  <p className="text-sm font-semibold dark:text-white">
                    {gnfFormatter(selectedAdvance.montantTotal)}
                  </p>
                </div>
                <div>
                  <Label>Montant demandé</Label>
                  <p className="text-sm dark:text-white">
                    {gnfFormatter(selectedAdvance.montantDemande)}
                  </p>
                </div>
                <div>
                  <Label>Frais de trésorerie</Label>
                  <p className="text-sm dark:text-white">
                    {gnfFormatter(selectedAdvance.fraisTresorerie)}
                  </p>
                </div>
                <div>
                  <Label>Montant remboursé</Label>
                  <p className="text-sm dark:text-white">
                    {gnfFormatter(selectedAdvance.montantRembourse)}
                  </p>
                </div>
                <div>
                  <Label>Montant restant</Label>
                  <p className="text-sm font-semibold dark:text-white">
                    {gnfFormatter(selectedAdvance.montantTotal - selectedAdvance.montantRembourse)}
                  </p>
                </div>
                <div>
                  <Label>Date de demande</Label>
                  <p className="text-sm dark:text-white">{formatDate(selectedAdvance.dateDemande)}</p>
                </div>
                {selectedAdvance.dateApprobation && (
                  <div>
                    <Label>Date d'approbation</Label>
                    <p className="text-sm dark:text-white">
                      {formatDate(selectedAdvance.dateApprobation)}
                    </p>
                  </div>
                )}
                {selectedAdvance.dateDeblocage && (
                  <div>
                    <Label>Date de déblocage</Label>
                    <p className="text-sm dark:text-white">
                      {formatDate(selectedAdvance.dateDeblocage)}
                    </p>
                  </div>
                )}
                {selectedAdvance.dateLimiteRemboursement && (
                  <div>
                    <Label>Date limite de remboursement</Label>
                    <p className="text-sm dark:text-white">
                      {formatDate(selectedAdvance.dateLimiteRemboursement)}
                    </p>
                  </div>
                )}
                {selectedAdvance.dureeSemaines && (
                  <div>
                    <Label>Durée (semaines)</Label>
                    <p className="text-sm dark:text-white">{selectedAdvance.dureeSemaines}</p>
                  </div>
                )}
              </div>
              {selectedAdvance.commentaire && (
                <div>
                  <Label>Commentaire</Label>
                  <p className="text-sm dark:text-white">{selectedAdvance.commentaire}</p>
                </div>
              )}
              {selectedAdvance.rejetMotif && (
                <div>
                  <Label>Motif de rejet</Label>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {selectedAdvance.rejetMotif}
                  </p>
                </div>
              )}
              {selectedAdvanceDetails?.remboursements &&
                selectedAdvanceDetails.remboursements.length > 0 && (
                  <div>
                    <Label>Historique des remboursements</Label>
                    <div className="mt-2 space-y-2">
                      {selectedAdvanceDetails.remboursements.map((remb: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex justify-between">
                            <span className="text-sm font-semibold dark:text-white">
                              {gnfFormatter(remb.montant)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(remb.date_remboursement)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Méthode: {remb.methode_remboursement}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Fermer
            </Button>
            {(selectedAdvance?.statut === "RELEASED" ||
              selectedAdvance?.statut === "REPAYMENT_PENDING" ||
              selectedAdvance?.statut === "OVERDUE") && (
              <Button
                onClick={() => {
                  setShowDetailModal(false);
                  const montantRestant = selectedAdvance.montantTotal - selectedAdvance.montantRembourse;
                  setRepayFormData({
                    montant: montantRestant > 0 ? montantRestant : selectedAdvance.montantTotal,
                    methodeRemboursement: "WALLET",
                    numeroCompteRemboursement: "",
                    reference: "",
                    commentaire: "",
                  });
                  setShowRepayModal(true);
                }}
                style={{ background: "var(--zalama-orange)" }}
              >
                Rembourser
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de remboursement */}
      <Dialog open={showRepayModal} onOpenChange={setShowRepayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rembourser l'avance de trésorerie</DialogTitle>
            <DialogDescription>
              Effectuez un remboursement partiel ou total de l'avance
            </DialogDescription>
          </DialogHeader>
          {selectedAdvance && (
            <div className="space-y-4">
              <div>
                <Label>Montant à rembourser *</Label>
                <Input
                  type="number"
                  value={repayFormData.montant}
                  onChange={(e) =>
                    setRepayFormData({
                      ...repayFormData,
                      montant: parseFloat(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={selectedAdvance.montantTotal - selectedAdvance.montantRembourse}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Montant restant: {gnfFormatter(selectedAdvance.montantTotal - selectedAdvance.montantRembourse)}
                </p>
              </div>
              <div>
                <Label>Méthode de remboursement *</Label>
                <Select
                  value={repayFormData.methodeRemboursement}
                  onValueChange={(value: "WALLET" | "EXTERNAL") =>
                    setRepayFormData({ ...repayFormData, methodeRemboursement: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WALLET">Wallet partenaire</SelectItem>
                    <SelectItem value="EXTERNAL">Virement externe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {repayFormData.methodeRemboursement === "EXTERNAL" && (
                <div>
                  <Label>Numéro de compte *</Label>
                  <Input
                    value={repayFormData.numeroCompteRemboursement}
                    onChange={(e) =>
                      setRepayFormData({
                        ...repayFormData,
                        numeroCompteRemboursement: e.target.value,
                      })
                    }
                    placeholder="Numéro de compte"
                  />
                </div>
              )}
              <div>
                <Label>Référence</Label>
                <Input
                  value={repayFormData.reference}
                  onChange={(e) =>
                    setRepayFormData({ ...repayFormData, reference: e.target.value })
                  }
                  placeholder="Référence optionnelle"
                />
              </div>
              <div>
                <Label>Commentaire</Label>
                <Textarea
                  value={repayFormData.commentaire}
                  onChange={(e) =>
                    setRepayFormData({ ...repayFormData, commentaire: e.target.value })
                  }
                  placeholder="Commentaire optionnel"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRepayModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleRepay}
              disabled={repayMutation.isPending}
              style={{ background: "var(--zalama-orange)" }}
            >
              {repayMutation.isPending ? "Remboursement..." : "Effectuer le remboursement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

