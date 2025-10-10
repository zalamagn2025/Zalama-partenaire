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

  if (authLoading) {
    return <LoadingSpinner />;
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
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Liste des Paiements</h2>
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
                        <Button variant="ghost" size="sm">
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
    </div>
  );
}

