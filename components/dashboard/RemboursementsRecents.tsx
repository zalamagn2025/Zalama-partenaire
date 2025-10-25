"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEdgeAuth } from "@/hooks/useEdgeAuth";
import { Clock, User, CreditCard, Calendar, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Remboursement {
  employe_id: string;
  partenaire_id: string;
  categorie: string;
  employe: {
    id: string;
    nom: string;
    prenom: string;
    photo_url?: string;
  };
  montant_total_remboursement: number;
  nombre_remboursements: number;
  statut_global: string;
  statuts_detailes: string[];
  date_creation_premiere: string;
  date_creation_derniere: string;
  remboursements_detailes: Array<{
    id: string;
    montant_total_remboursement: number;
    statut: string;
    methode_remboursement: string;
    date_creation: string;
    date_limite_remboursement: string;
    date_remboursement_effectue: string | null;
  }>;
}

interface RemboursementsRecentsProps {
  compact?: boolean;
  remboursements?: Remboursement[];
  isLoading?: boolean;
}

export default function RemboursementsRecents({ 
  compact = false, 
  remboursements: propRemboursements, 
  isLoading: propIsLoading 
}: RemboursementsRecentsProps) {
  const router = useRouter();
  const { session } = useEdgeAuth();
  const [localRemboursements, setLocalRemboursements] = useState<Remboursement[]>([]);
  const [localIsLoading, setLocalIsLoading] = useState(false);

  // Utiliser les props si disponibles, sinon charger localement
  const remboursements = propRemboursements || localRemboursements;
  const isLoading = propIsLoading !== undefined ? propIsLoading : localIsLoading;

  const loadRemboursements = async () => {
    if (!session?.access_token) return;

    setLocalIsLoading(true);
    try {
      const response = await fetch('/api/proxy/dashboard-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        console.error("Erreur Edge Function:", data.message);
        return;
      }

      setLocalRemboursements(data.data?.remboursements || []);
    } catch (error) {
      console.error("Erreur lors du chargement des remboursements:", error);
      toast.error("Erreur lors du chargement des remboursements");
    } finally {
      setLocalIsLoading(false);
    }
  };

  useEffect(() => {
    // Ne charger que si les props ne sont pas fournies
    if (!propRemboursements && session?.access_token) {
      loadRemboursements();
    }
  }, [session?.access_token, propRemboursements]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "GNF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleViewAllRemboursements = () => {
    router.push("/dashboard/remboursements");
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "REMBOURSE":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "EN_RETARD":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return "warning";
      case "REMBOURSE":
        return "success";
      case "EN_RETARD":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (statut: string) => {
    switch (statut) {
      case "EN_ATTENTE":
        return "En attente";
      case "REMBOURSE":
        return "Remboursé";
      case "EN_RETARD":
        return "En retard";
      default:
        return statut;
    }
  };

  const displayedRemboursements = compact ? remboursements.slice(0, 5) : remboursements;

  if (isLoading) {
    return (
      <div className="bg-transparent border border-[var(--zalama-border)] backdrop-blur-sm rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent border border-[var(--zalama-border)] backdrop-blur-sm rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-600 dark:text-white text-base font-semibold">
          Remboursements récents
        </h3>
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
            {remboursements.length} total
          </span>
        </div>
      </div>

      {remboursements.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun remboursement récent</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {displayedRemboursements.map((remboursement, index) => (
            <div
              key={remboursement.employe_id}
              className="flex items-center justify-between py-3 px-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {remboursement.employe.photo_url ? (
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <img
                        src={remboursement.employe.photo_url}
                        alt={`${remboursement.employe.prenom} ${remboursement.employe.nom}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          // En cas d'erreur de chargement, afficher les initiales
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                                ${remboursement.employe.prenom.charAt(0)}${remboursement.employe.nom.charAt(0)}
                              </span>
                            `;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {remboursement.employe.prenom.charAt(0)}
                        {remboursement.employe.nom.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {remboursement.employe.prenom} {remboursement.employe.nom}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(remboursement.statut_global)}
                    <Badge variant={getStatusVariant(remboursement.statut_global) as any}>
                      {getStatusText(remboursement.statut_global)}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatAmount(remboursement.montant_total_remboursement)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(remboursement.date_creation_derniere)}
                </p>
              </div>
            </div>
          ))}

          {compact && remboursements.length > 5 && (
            <div className="text-center pt-2">
              <button 
                onClick={handleViewAllRemboursements}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200 cursor-pointer"
              >
                Voir tous les remboursements ({remboursements.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
