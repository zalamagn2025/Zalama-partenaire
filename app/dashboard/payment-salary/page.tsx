"use client";

import { useState, useEffect } from "react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
// TODO: Migrer vers le nouveau backend
// import { PaymentEmployeesResponse } from "@/lib/edgeFunctionService";
type PaymentEmployeesResponse = any; // Temporaire
import { useCustomToast } from "@/hooks/useCustomToast";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Filter,
  Loader2,
} from "lucide-react";

// Fonction pour formatter les montants en GNF
const gnfFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0 GNF";
  }
  return `${value.toLocaleString()} GNF`;
};

// Fonction pour formatter les dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function PaymentSalaryPage() {
  const { session, loading } = useEdgeAuthContext();
  const toast = useCustomToast();
  const router = useRouter();

  // États pour les données
  const [paymentData, setPaymentData] =
    useState<PaymentEmployeesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<any>(null);

  // États pour les filtres - Par défaut octobre 2025
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // Octobre = 10
  const currentYear = 2025;

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set()
  );

  // État pour le toggle des filtres
  const [showFilters, setShowFilters] = useState(false);

  // États pour l'AlertDialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      console.log("🔄 Pas de session, redirection vers /login");
      router.push("/login");
    }
  }, [loading, session, router]);

  // Charger les données des employés
  const loadPaymentData = async (month?: number, year?: number) => {
    if (!session?.access_token) return;

    setIsLoading(true);
    setError(null);

    try {
      // Configurer le token d'accès
      // TODO: Migrer vers le nouveau backend
      // edgeFunctionService.setAccessToken(session.access_token);

      console.log("🔄 Chargement des données de paiement...");

      const response = await // TODO: Migrer vers le nouveau backend
      // edgeFunctionService.getPaymentEmployees({
        mois: month,
        annee: year,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Erreur lors du chargement des données"
        );
      }

      setPaymentData(response);
      setSelectedEmployees(new Set()); // Réinitialiser la sélection

      console.log("✅ Données de paiement chargées:", response);

      toast.success("Données de paiement chargées avec succès");
    } catch (error) {
      console.error("❌ Erreur lors du chargement des données:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      setError(errorMessage);

      // Gérer les erreurs d'authentification
      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        toast.sessionError();
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données au montage du composant avec les filtres par défaut
  useEffect(() => {
    if (!loading && session?.access_token) {
      loadPaymentData(selectedMonth, selectedYear);
    }
  }, [loading, session?.access_token, selectedMonth, selectedYear]);

  // Gestion de la sélection des employés
  const handleEmployeeSelection = (employeeId: string, checked: boolean) => {
    const newSelection = new Set(selectedEmployees);
    if (checked) {
      newSelection.add(employeeId);
    } else {
      newSelection.delete(employeeId);
    }
    setSelectedEmployees(newSelection);

    // Debug: Afficher la sélection
    console.log("✅ Employee Selection:", {
      employeeId,
      checked,
      newSelection: Array.from(newSelection),
      totalSelected: newSelection.size,
    });
  };

  // Sélectionner tous les employés éligibles
  const selectAllEligible = () => {
    if (!paymentData?.data) return;

    const eligibleIds = paymentData.data.employes
      .filter((emp) => emp.eligible_paiement)
      .map((emp) => emp.id);

    setSelectedEmployees(new Set(eligibleIds));
  };

  // Désélectionner tous les employés
  const deselectAll = () => {
    setSelectedEmployees(new Set());
  };

  // Exécuter les paiements
  const executePayments = async () => {
    if (!session?.access_token || selectedEmployees.size === 0) {
      toast.error("Veuillez sélectionner au moins un employé");
      return;
    }

    setIsExecuting(true);
    setPaymentError(null);

    try {
      console.log(
        "🔄 Exécution des paiements pour",
        selectedEmployees.size,
        "employés"
      );

      const response = await // TODO: Migrer vers le nouveau backend
      // edgeFunctionService.executeSalaryPayments({
        employes_selectionnes: Array.from(selectedEmployees),
        mois: selectedMonth || undefined,
        annee: selectedYear || undefined,
      });

      console.log("📊 Réponse complète de l'edge function:", response);

      // Gérer les erreurs détaillées de l'edge function
      if (!response.success) {
        setPaymentError(response);

        // Afficher les erreurs spécifiques
        if (
          (response.data as any)?.erreurs &&
          (response.data as any).erreurs.length > 0
        ) {
          const errors = (response.data as any).erreurs;

          // Vérifier si c'est une erreur de paiement déjà existant
          const hasPaymentExistsError = errors.some(
            (err: any) => err.erreur && err.erreur.includes("PAYE")
          );

          if (hasPaymentExistsError) {
            // Afficher un message spécifique pour les paiements déjà existants
            const paymentExistsErrors = errors.filter(
              (err: any) => err.erreur && err.erreur.includes("PAYE")
            );

            const employeeNames = paymentExistsErrors
              .map((err: any) => err.employe)
              .join(", ");
            toast.error(`Paiement déjà existant pour: ${employeeNames}`, {
              duration: 8000,
            });
          } else {
            // Autres types d'erreurs
            const errorDetails = errors
              .map((err: any) => `${err.employe}: ${err.erreur}`)
              .join("\n");

            toast.error(
              `${response.message}\n\nErreurs détaillées:\n${errorDetails}`,
              { duration: 10000 }
            );
          }
        } else {
          toast.error(
            response.message || "Erreur lors de l'exécution des paiements"
          );
        }

        // Ne pas fermer le dialog en cas d'erreur pour que l'utilisateur puisse voir les détails
        return;
      }

      console.log("✅ Paiements exécutés avec succès:", response);

      // Afficher les statistiques de succès
      const stats = (response.data as any)?.statistiques;
      if (stats) {
        toast.success(
          `Paiements exécutés: ${stats.paiements_reussis}/${stats.total_employes} employés traités avec succès`
        );
      } else {
        toast.success(
          `Paiements exécutés avec succès pour ${
            response.data?.nombre_employes || 0
          } employés`
        );
      }

      // Recharger les données pour mettre à jour les statuts
      await loadPaymentData(selectedMonth, selectedYear);
      setSelectedEmployees(new Set());
      setShowPaymentDialog(false);
    } catch (error) {
      console.error("❌ Erreur lors de l'exécution des paiements:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  // Appliquer les filtres
  const applyFilters = () => {
    loadPaymentData(selectedMonth || undefined, selectedYear || undefined);
  };

  // Réinitialiser les filtres aux valeurs par défaut
  const resetFilters = () => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    loadPaymentData(currentMonth, currentYear);
  };

  // Calculer les statistiques de sélection
  const getSelectionStats = () => {
    if (!paymentData?.data) return { count: 0, total: 0 };

    const selected = Array.from(selectedEmployees);
    const selectedEmployeesData = paymentData.data.employes.filter((emp) =>
      selected.includes(emp.id)
    );

    const stats = {
      count: selectedEmployeesData.length,
      total: selectedEmployeesData.reduce(
        (sum, emp) => sum + emp.salaire_disponible,
        0
      ),
    };

    // Debug: Afficher les statistiques dans la console
    console.log("🔍 Selection Stats:", {
      selectedEmployees: selected,
      eligibleEmployees: paymentData.data.employes.filter(
        (emp) => emp.eligible_paiement
      ).length,
      totalEmployees: paymentData.data.employes.length,
      stats,
    });

    return stats;
  };

  // Si en cours de chargement initial
  if (loading || isLoading) {
    return (
      <div
        className="p-6 space-y-6"
        style={{
          background: "var(--zalama-bg-dark)",
          color: "var(--zalama-text)",
        }}
      >
        <div className="animate-pulse space-y-6">
          {/* Skeleton pour les filtres */}
          <div
            className="rounded-lg h-32"
            style={{ background: "var(--zalama-bg-light)" }}
          ></div>

          {/* Skeleton pour les statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg h-24"
                style={{ background: "var(--zalama-bg-light)" }}
              ></div>
            ))}
          </div>

          {/* Skeleton pour le tableau */}
          <div
            className="rounded-lg h-96"
            style={{ background: "var(--zalama-bg-light)" }}
          ></div>
        </div>
      </div>
    );
  }

  // Si pas de session
  if (!session?.partner) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "var(--zalama-bg-dark)" }}
      >
        <div className="text-center">
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--zalama-text)" }}
          >
            Accès non autorisé
          </h2>
          <p style={{ color: "var(--zalama-text-secondary)" }}>
            Vous n'avez pas les permissions nécessaires pour accéder à cette
            page.
          </p>
        </div>
      </div>
    );
  }

  // Si erreur
  if (error) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "var(--zalama-bg-dark)" }}
      >
        <div className="text-center">
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--zalama-danger)" }}
          >
            Erreur de chargement
          </h2>
          <p className="mb-4" style={{ color: "var(--zalama-text-secondary)" }}>
            {error}
          </p>
          <Button
            onClick={() => loadPaymentData(selectedMonth, selectedYear)}
            style={{
              background: "var(--zalama-blue)",
              color: "white",
            }}
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Si pas de données
  if (!paymentData?.data) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "var(--zalama-bg-dark)" }}
      >
        <div className="text-center">
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--zalama-text)" }}
          >
            Aucune donnée disponible
          </h2>
          <p style={{ color: "var(--zalama-text-secondary)" }}>
            Impossible de charger les données de paiement.
          </p>
        </div>
      </div>
    );
  }

  const { partenaire, periode, employes, statistiques } = paymentData.data;
  const selectionStats = getSelectionStats();

  return (
    <div
      className="p-6 space-y-6"
      style={{
        background: "var(--zalama-bg-dark)",
        color: "var(--zalama-text)",
      }}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--zalama-orange)" }}
          >
            Paiements des Salaires
          </h1>
          <p className="mt-2" style={{ color: "var(--zalama-text-secondary)" }}>
            Gérez les paiements de salaires pour {partenaire.nom}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => loadPaymentData(selectedMonth, selectedYear)}
            disabled={isLoading}
            variant="outline"
            size="sm"
            style={{
              background: "var(--zalama-bg-light)",
              borderColor: "var(--zalama-border)",
              color: "var(--zalama-text)",
            }}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
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
                onClick={() => loadPaymentData(selectedMonth, selectedYear)}
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
          {/* Filtre par mois */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mois
            </label>
            <select
              value={selectedMonth || ""}
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value ? parseInt(e.target.value) : currentMonth
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous les mois</option>
              {Array.from({ length: currentMonth }, (_, i) => {
                const month = i + 1;
                return (
                  <option key={month} value={month}>
                    {new Date(0, month - 1).toLocaleString("fr-FR", {
                      month: "long",
                    })}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filtre par année */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Année
            </label>
            <select
              value={selectedYear || ""}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value ? parseInt(e.target.value) : currentYear
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les années</option>
              {Array.from({ length: 3 }, (_, i) => {
                const year = 2025 - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        )}

        {/* Indicateur de filtres actifs supprimé */}
        {isLoading && (
          <div className="px-4 pb-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            Mise à jour des données...
          </div>
        )}
      </div>

      {/* Informations de période */}
      <Card
        style={{
          background: "var(--zalama-card)",
          borderColor: "var(--zalama-border)",
        }}
      >
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2"
            style={{ color: "var(--zalama-orange)" }}
          >
            <Calendar className="h-5 w-5" style={{ color: "var(--zalama-orange)" }} />
            Période de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label
                className="text-sm"
                style={{ color: "var(--zalama-text-secondary)" }}
              >
                Période
              </Label>
              <p
                className="font-medium"
                style={{ color: "var(--zalama-text)" }}
              >
                {formatDate(periode.debut)} - {formatDate(periode.fin)}
              </p>
            </div>
            <div>
              <Label
                className="text-sm"
                style={{ color: "var(--zalama-text-secondary)" }}
              >
                Jour de paiement
              </Label>
              <p
                className="font-medium"
                style={{ color: "var(--zalama-text)" }}
              >
                {partenaire.payment_day} du mois
              </p>
            </div>
            <div>
              <Label
                className="text-sm"
                style={{ color: "var(--zalama-text-secondary)" }}
              >
                Mois/Année
              </Label>
              <p
                className="font-medium"
                style={{ color: "var(--zalama-text)" }}
              >
                {periode.mois}/{periode.annee}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          style={{
            background: "var(--zalama-card)",
            borderColor: "var(--zalama-border)",
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-2 rounded-lg"
                style={{ background: "var(--zalama-bg-light)" }}
              >
                <Users
                  className="h-6 w-6"
                  style={{ color: "var(--zalama-blue)" }}
                />
              </div>
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--zalama-text-secondary)" }}
                >
                  Employés éligibles
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--zalama-text)" }}
                >
                  {statistiques.employes_eligibles}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--zalama-text-secondary)" }}
                >
                  / {statistiques.total_employes} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--zalama-card)",
            borderColor: "var(--zalama-border)",
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-2 rounded-lg"
                style={{ background: "var(--zalama-bg-light)" }}
              >
                <DollarSign
                  className="h-6 w-6"
                  style={{ color: "var(--zalama-success)" }}
                />
              </div>
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--zalama-text-secondary)" }}
                >
                  Montant total disponible
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--zalama-text)" }}
                >
                  {gnfFormatter(statistiques.montant_total_disponible)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--zalama-card)",
            borderColor: "var(--zalama-border)",
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-2 rounded-lg"
                style={{ background: "var(--zalama-bg-light)" }}
              >
                <AlertCircle
                  className="h-6 w-6"
                  style={{ color: "var(--zalama-warning)" }}
                />
              </div>
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--zalama-text-secondary)" }}
                >
                  Avances à déduire
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--zalama-text)" }}
                >
                  {gnfFormatter(statistiques.montant_total_avances)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          style={{
            background: "var(--zalama-card)",
            borderColor: "var(--zalama-border)",
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className="p-2 rounded-lg"
                style={{ background: "var(--zalama-bg-light)" }}
              >
                <CheckCircle
                  className="h-6 w-6"
                  style={{ color: "var(--zalama-blue)" }}
                />
              </div>
              <div>
                <p
                  className="text-sm"
                  style={{ color: "var(--zalama-text-secondary)" }}
                >
                  Déjà payés
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--zalama-text)" }}
                >
                  {statistiques.employes_deja_payes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions de sélection */}
      <Card
        style={{
          background: "var(--zalama-card)",
          borderColor: "var(--zalama-border)",
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span style={{ color: "var(--zalama-text)" }}>
              Employés à payer
            </span>
            <div className="flex items-center gap-2">
              <Button
                onClick={selectAllEligible}
                variant="outline"
                size="sm"
                disabled={isExecuting}
                style={{
                  background: "var(--zalama-bg-light)",
                  borderColor: "var(--zalama-border)",
                  color: "var(--zalama-text)",
                }}
              >
                Tout sélectionner
              </Button>
              <Button
                onClick={deselectAll}
                variant="outline"
                size="sm"
                disabled={isExecuting}
                style={{
                  background: "var(--zalama-bg-light)",
                  borderColor: "var(--zalama-border)",
                  color: "var(--zalama-text)",
                }}
              >
                Tout désélectionner
              </Button>
            </div>
          </CardTitle>
          <CardDescription style={{ color: "var(--zalama-text-secondary)" }}>
            Sélectionnez les employés que vous souhaitez payer pour cette
            période
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Affichage des statistiques de sélection */}
          <div
            className="mb-4 p-4 rounded-lg"
            style={{ background: "var(--zalama-bg-lighter)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="font-medium"
                  style={{ color: "var(--zalama-text)" }}
                >
                  {selectionStats.count} employé(s) sélectionné(s)
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--zalama-text-secondary)" }}
                >
                  Montant total: {gnfFormatter(selectionStats.total)}
                </p>
              </div>

              {/* Boutons de paiement */}
              <div className="flex items-center gap-2">
                {/* Bouton direct Payer */}
                <Button
                  onClick={() => {
                    console.log("🔄 Exécution directe des paiements");
                    executePayments();
                  }}
                  disabled={isExecuting || selectionStats.count === 0}
                  style={{
                    background: "var(--zalama-orange)",
                    color: "white",
                  }}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Paiement en cours...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" style={{ color: "var(--zalama-orange)" }} />
                      Payer
                    </>
                  )}
                </Button>

                {/* Bouton avec confirmation (optionnel) */}
                <AlertDialog
                  open={showPaymentDialog}
                  onOpenChange={setShowPaymentDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={isExecuting || selectionStats.count === 0}
                      variant="outline"
                      size="sm"
                      style={{
                        background: "var(--zalama-bg-light)",
                        borderColor: "var(--zalama-border)",
                        color: "var(--zalama-text)",
                      }}
                    >
                      Confirmer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[var(--zalama-card)] border-[var(--zalama-border)] text-[var(--zalama-text)]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-[var(--zalama-text)]">
                        Confirmer l'exécution des paiements
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-[var(--zalama-text-secondary)]">
                        Vous êtes sur le point d'exécuter les paiements pour{" "}
                        <strong>{selectionStats.count} employé(s)</strong> pour
                        un montant total de{" "}
                        <strong>{gnfFormatter(selectionStats.total)}</strong>.
                        <br />
                        <br />
                        Les frais d'intervention ZaLaMa (6%) seront
                        automatiquement ajoutés.
                        <br />
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setShowPaymentDialog(false)}
                        className="bg-[var(--zalama-bg-light)] border-[var(--zalama-border)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-lighter)]"
                      >
                        Annuler
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={executePayments}
                        className="bg-[var(--zalama-orange)] text-white hover:bg-[var(--zalama-orange)]/90"
                      >
                        Confirmer les paiements
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des employés */}
      <Card
        style={{
          background: "var(--zalama-card)",
          borderColor: "var(--zalama-border)",
        }}
      >
        <CardHeader>
          <CardTitle style={{ color: "var(--zalama-orange)" }}>
            Liste des employés
          </CardTitle>
          <CardDescription style={{ color: "var(--zalama-text-secondary)" }}>
            Consultez les détails de chaque employé et sélectionnez ceux à payer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ background: "var(--zalama-bg-light)" }}>
                  <TableHead
                    className="w-12"
                    style={{ color: "var(--zalama-text)" }}
                  >
                    Sélection
                  </TableHead>
                  <TableHead 
                    className="min-w-[200px] max-w-[250px]"
                    style={{ color: "var(--zalama-text)" }}
                  >
                    Employé
                  </TableHead>
                  <TableHead 
                    className="min-w-[150px] max-w-[200px]"
                    style={{ color: "var(--zalama-text)" }}
                  >
                    Poste
                  </TableHead>
                  <TableHead
                    className="text-right min-w-[120px]"
                    style={{ color: "var(--zalama-text)" }}
                  >
                    Salaire net
                  </TableHead>
                  <TableHead
                    className="text-right min-w-[150px]"
                    style={{ color: "var(--zalama-text)" }}
                  >
                    Avances déduites
                  </TableHead>
                  <TableHead
                    className="text-right min-w-[140px]"
                    style={{ color: "var(--zalama-text)" }}
                  >
                    Salaire disponible
                  </TableHead>
                  <TableHead 
                    className="min-w-[120px]"
                    style={{ color: "var(--zalama-text)" }}
                  >
                    Statut
                  </TableHead>
                  <TableHead 
                    className="min-w-[100px]"
                    style={{ color: "var(--zalama-text)" }}
                  >
                    Détails
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employes.map((employee) => (
                  <TableRow
                    key={employee.id}
                    style={{ borderColor: "var(--zalama-border)" }}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedEmployees.has(employee.id)}
                        onCheckedChange={(checked) =>
                          handleEmployeeSelection(
                            employee.id,
                            checked as boolean
                          )
                        }
                        disabled={!employee.eligible_paiement || isExecuting}
                      />
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <div className="overflow-hidden">
                        <p
                          className="font-medium truncate"
                          style={{ color: "var(--zalama-text)" }}
                          title={`${employee.prenom} ${employee.nom}`}
                        >
                          {employee.prenom} {employee.nom}
                        </p>
                        <p
                          className="text-sm truncate"
                          style={{ color: "var(--zalama-text-secondary)" }}
                          title={employee.email}
                        >
                          {employee.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell 
                      className="max-w-[200px]"
                      style={{ color: "var(--zalama-text)" }}
                    >
                      <div className="truncate" title={employee.poste}>
                        {employee.poste}
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      style={{ color: "var(--zalama-text)" }}
                    >
                      {gnfFormatter(employee.salaire_net)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm">
                        <div style={{ color: "var(--zalama-text)" }}>
                          Total: {gnfFormatter(employee.avances_deduites)}
                        </div>
                        <div style={{ color: "var(--zalama-text-secondary)" }}>
                          Mono: {gnfFormatter(employee.avances_mono_mois)}
                        </div>
                        <div style={{ color: "var(--zalama-text-secondary)" }}>
                          Multi: {gnfFormatter(employee.avances_multi_mois)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className="font-medium"
                        style={{
                          color:
                            employee.salaire_disponible > 0
                              ? "var(--zalama-success)"
                              : "var(--zalama-danger)",
                        }}
                      >
                        {gnfFormatter(employee.salaire_disponible)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {employee.deja_paye ? (
                        <Badge
                          variant="success"
                          style={{
                            background: "var(--zalama-success)",
                            color: "white",
                          }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Déjà payé
                        </Badge>
                      ) : employee.eligible_paiement ? (
                        <Badge
                          variant="default"
                          style={{
                            background: "var(--zalama-orange)",
                            color: "white",
                          }}
                        >
                          Éligible
                        </Badge>
                      ) : (
                        <Badge
                          variant="error"
                          style={{
                            background: "var(--zalama-danger)",
                            color: "white",
                          }}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Non éligible
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <div className="text-sm space-y-1 overflow-hidden">
                        <div style={{ color: "var(--zalama-text)" }}>
                          Avances: {employee.nombre_avances}
                        </div>
                        {employee.paiement_existant && (
                          <div
                            className="truncate"
                            style={{ color: "var(--zalama-text-secondary)" }}
                            title={`Ref: ${employee.paiement_existant.reference}`}
                          >
                            Ref: {employee.paiement_existant.reference}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
