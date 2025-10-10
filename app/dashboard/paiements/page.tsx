"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Banknote, 
  TrendingUp, 
  Calendar, 
  Users, 
  Filter, 
  RefreshCw, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download
} from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import StatCard from "@/components/dashboard/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Fonction pour formatter les montants en GNF
const gnfFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0 GNF";
  }
  return `${value.toLocaleString()} GNF`;
};

// Fonction pour formatter les dates
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Interface pour les statistiques
interface PaymentStatistics {
  total_paiements: number;
  paiements_effectues: number;
  paiements_en_attente: number;
  montant_total_salaires: number;
  montant_total_avances_deduites: number;
  montant_total_frais: number;
  montant_total_remboursements: number;
  employes_payes_distincts: number;
  dernier_paiement: string | null;
  paiements_par_mois: Record<string, any>;
}

// Interface pour un paiement
interface Payment {
  id: string;
  employe_id: string;
  periode_debut: string;
  periode_fin: string;
  salaire_net: number;
  avances_deduites: number;
  salaire_disponible: number;
  methode_paiement: string;
  intervention_zalama: boolean;
  frais_intervention: number;
  montant_total_remboursement: number;
  statut: string;
  date_paiement: string;
  date_limite: string;
  reference_paiement: string;
  commentaire: string | null;
  created_at: string;
  employe?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    poste: string;
  } | null;
}

// Interface pour la réponse paginée
interface PaginatedResponse {
  success: boolean;
  data: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export default function PaiementsPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useEdgeAuthContext();

  // États
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState<PaymentStatistics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  // Filtres
  const [filters, setFilters] = useState({
    statut: "all",
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
  });

  // Modal
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Ouvrir le modal
  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  // Fonction pour récupérer les statistiques
  const fetchStatistics = async () => {
    if (!session?.access_token) return;

    try {
      setLoadingStats(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/partner-payment-history?action=statistics`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des statistiques");
      }

      const result = await response.json();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger les statistiques");
    } finally {
      setLoadingStats(false);
    }
  };

  // Fonction pour récupérer les paiements
  const fetchPayments = async (page = 1) => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      
      // Construire l'URL avec les filtres
      const params = new URLSearchParams({
        action: "list",
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.statut !== "all") {
        params.append("statut", filters.statut);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/partner-payment-history?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des paiements");
      }

      const result: PaginatedResponse = await response.json();
      if (result.success) {
        setPayments(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Impossible de charger les paiements");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour rafraîchir les données
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStatistics(), fetchPayments(pagination.page)]);
    setRefreshing(false);
    toast.success("Données actualisées");
  };

  // Chargement initial
  useEffect(() => {
    if (!authLoading && session?.access_token) {
      fetchStatistics();
      fetchPayments(1);
    }
  }, [authLoading, session?.access_token]);

  // Appliquer les filtres
  useEffect(() => {
    if (session?.access_token && !loading) {
      fetchPayments(1);
    }
  }, [filters.statut]);

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "PAYE":
        return <Badge className="bg-green-500">Payé</Badge>;
      case "EN_ATTENTE":
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case "ANNULE":
        return <Badge className="bg-red-500">Annulé</Badge>;
      case "ECHOUE":
        return <Badge className="bg-red-600">Échoué</Badge>;
      default:
        return <Badge className="bg-gray-500">{statut}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Skeleton pour l'en-tête */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-10 w-96"></div>
            <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-5 w-80"></div>
          </div>
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-10 w-32"></div>
        </div>

        {/* Skeleton pour les statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-32"></div>
          ))}
        </div>

        {/* Skeleton pour les filtres */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-20"></div>

        {/* Skeleton pour le tableau des paiements */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-3">
            {/* En-tête du tableau */}
            <div className="grid grid-cols-9 gap-4 pb-3 border-b border-gray-300 dark:border-gray-700">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-300 dark:bg-gray-700 rounded h-5"
                ></div>
              ))}
            </div>
            {/* Lignes du tableau */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-9 gap-4 py-3">
                {[...Array(9)].map((_, j) => (
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
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Historique des Paiements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Consultez l'historique et les statistiques de vos paiements salariés
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      ) : statistics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Paiements"
            value={statistics.total_paiements.toString()}
            icon={Banknote}
            color="blue"
          />
          <StatCard
            title="Montant Total Salaires"
            value={gnfFormatter(statistics.montant_total_salaires)}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Avances Déduites"
            value={gnfFormatter(statistics.montant_total_avances_deduites)}
            icon={Calendar}
            color="yellow"
          />
          <StatCard
            title="Montant Remboursements"
            value={gnfFormatter(statistics.montant_total_remboursements)}
            icon={Banknote}
            color="purple"
          />
        </div>
      ) : null}

      {/* Filtres */}
      <Card className="p-4 bg-[var(--zalama-card)] border-[var(--zalama-border)]">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-[var(--zalama-text)]">
              Filtres:
            </span>
          </div>
          
          <Select
            value={filters.statut}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, statut: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="PAYE">Payé</SelectItem>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="ANNULE">Annulé</SelectItem>
              <SelectItem value="ECHOUE">Échoué</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tableau des paiements */}
      <Card className="bg-[var(--zalama-card)] border-[var(--zalama-border)]">
        <div className="p-4 border-b border-[var(--zalama-border)]">
          <h2 className="text-lg font-semibold text-[var(--zalama-text)]">Liste des Paiements</h2>
        </div>
        
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun paiement trouvé
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Salaire Net</TableHead>
                    <TableHead>Avances</TableHead>
                    <TableHead>Montant Payé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">
                        {payment.reference_paiement}
                      </TableCell>
                      <TableCell>
                        {payment.employe ? (
                          <div>
                            <p className="font-medium">
                              {payment.employe.nom} {payment.employe.prenom}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.employe.poste}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(payment.periode_debut)} <br />
                        <span className="text-gray-500">→ {formatDate(payment.periode_fin)}</span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {gnfFormatter(payment.salaire_net)}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {gnfFormatter(payment.avances_deduites)}
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {gnfFormatter(payment.salaire_disponible)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.statut)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(payment.date_paiement)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} paiements)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPayments(pagination.page - 1)}
                  disabled={!pagination.hasPrevious || loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPayments(pagination.page + 1)}
                  disabled={!pagination.hasNext || loading}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Graphique de l'évolution mensuelle */}
      {statistics && Object.keys(statistics.paiements_par_mois).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Évolution Mensuelle</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(statistics.paiements_par_mois).map(
                ([mois, data]) => ({
                  mois: new Date(mois + "-01").toLocaleDateString("fr-FR", {
                    month: "short",
                    year: "numeric",
                  }),
                  salaires: data.montant_salaires,
                  avances: data.montant_avances,
                  frais: data.montant_frais,
                })
              )}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip formatter={(value: number) => gnfFormatter(value)} />
              <Legend />
              <Bar dataKey="salaires" fill="#10b981" name="Salaires" />
              <Bar dataKey="avances" fill="#f59e0b" name="Avances déduites" />
              <Bar dataKey="frais" fill="#6366f1" name="Frais" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Modal de détails du paiement */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Détails du Paiement
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Référence: {selectedPayment.reference_paiement}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
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
                      {selectedPayment.employe?.nom} {selectedPayment.employe?.prenom}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Poste</p>
                    <p className="font-medium">{selectedPayment.employe?.poste || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-sm">{selectedPayment.employe?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedPayment.employe?.telephone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Informations du paiement */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Détails du Paiement
                </h3>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Référence</span>
                    <span className="font-mono font-medium">{selectedPayment.reference_paiement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Période</span>
                    <span className="font-medium">
                      {formatDate(selectedPayment.periode_debut)} → {formatDate(selectedPayment.periode_fin)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date de paiement</span>
                    <span className="font-medium">{formatDate(selectedPayment.date_paiement)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date limite</span>
                    <span className="font-medium">{formatDate(selectedPayment.date_limite)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Statut</span>
                    <span>{getStatusBadge(selectedPayment.statut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Méthode</span>
                    <span className="font-medium">
                      {selectedPayment.intervention_zalama ? "Intervention ZaLaMa" : selectedPayment.methode_paiement}
                    </span>
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
                    <span className="text-gray-600 dark:text-gray-400">Salaire net</span>
                    <span className="font-medium">{gnfFormatter(selectedPayment.salaire_net)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Avances déduites</span>
                    <span className="font-medium">- {gnfFormatter(selectedPayment.avances_deduites)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-green-600">
                    <span className="font-semibold">Salaire disponible</span>
                    <span className="font-bold text-lg">{gnfFormatter(selectedPayment.salaire_disponible)}</span>
                  </div>
                  {selectedPayment.intervention_zalama && (
                    <>
                      <div className="flex justify-between text-blue-600">
                        <span>Frais d'intervention (6%)</span>
                        <span className="font-medium">+ {gnfFormatter(selectedPayment.frais_intervention)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between text-purple-600">
                        <span className="font-semibold">Montant total remboursement</span>
                        <span className="font-bold text-lg">{gnfFormatter(selectedPayment.montant_total_remboursement)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Commentaire */}
              {selectedPayment.commentaire && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Commentaire
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedPayment.commentaire}
                    </p>
                  </div>
                </div>
              )}

            </div>
            
            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <Button 
                onClick={handleCloseModal} 
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

