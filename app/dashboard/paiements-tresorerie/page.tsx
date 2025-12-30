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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
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
      <div className="p-6 space-y-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--zalama-orange)" }}>
            Paiements par Avances de Trésorerie
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez les demandes d'avances de trésorerie pour le paiement des salaires
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/paiements-tresorerie/nouvelle-demande")}
          className="flex items-center gap-2"
          style={{ background: "var(--zalama-orange)" }}
        >
          <Plus className="w-4 h-4" />
          Nouvelle demande
        </Button>
      </div>

      {/* Filtres */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow overflow-hidden backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtres</h3>
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
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {/* Recherche */}
            <div>
              <Label className="mb-1">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Référence, commentaire..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Statut */}
            <div>
              <Label className="mb-1">Statut</Label>
              <Select
                value={selectedStatus || "all"}
                onValueChange={(value) => handleStatusChange(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="REQUESTED">Demandée</SelectItem>
                  <SelectItem value="WAITING_ADMIN_VALIDATION">En validation</SelectItem>
                  <SelectItem value="APPROVED">Approuvée</SelectItem>
                  <SelectItem value="REJECTED">Rejetée</SelectItem>
                  <SelectItem value="RELEASED">Débloquée</SelectItem>
                  <SelectItem value="REPAYMENT_PENDING">Remboursement en attente</SelectItem>
                  <SelectItem value="OVERDUE">En retard</SelectItem>
                  <SelectItem value="PENALTY_APPLIED">Pénalité appliquée</SelectItem>
                  <SelectItem value="REPAID">Remboursée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total demandes</p>
              <p className="text-2xl font-bold dark:text-white">{totalAdvances}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
              <p className="text-2xl font-bold dark:text-white">
                {filteredAdvances.filter((a) => a.statut === "REQUESTED" || a.statut === "WAITING_ADMIN_VALIDATION").length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approuvées</p>
              <p className="text-2xl font-bold dark:text-white">
                {filteredAdvances.filter((a) => a.statut === "APPROVED" || a.statut === "RELEASED").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remboursées</p>
              <p className="text-2xl font-bold dark:text-white">
                {filteredAdvances.filter((a) => a.statut === "REPAID").length}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tableau des avances */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date création
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune avance de trésorerie trouvée
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((advance) => (
                  <tr
                    key={advance.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium dark:text-white">
                        {advance.reference || advance.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold dark:text-white">
                        {gnfFormatter(advance.montantTotal)}
                      </div>
                      {advance.montantRembourse !== undefined && advance.montantRembourse < advance.montantTotal && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Restant: {gnfFormatter(advance.montantTotal - advance.montantRembourse)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(advance.statut)}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm dark:text-white">{formatDate(advance.dateDemande)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            setSelectedAdvance(advance);
                            await loadAdvanceDetails(advance.id);
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(advance.statut === "RELEASED" ||
                          advance.statut === "REPAYMENT_PENDING" ||
                          advance.statut === "OVERDUE") && (
                          <Button
                            variant="ghost"
                            size="sm"
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
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

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

