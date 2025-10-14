"use client";

import { useState, useEffect } from "react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import {
  edgeFunctionService,
  PaymentEmployeesResponse,
} from "@/lib/edgeFunctionService";
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
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

  // États pour les filtres
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set()
  );

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
      edgeFunctionService.setAccessToken(session.access_token);

      console.log("🔄 Chargement des données de paiement...");

      const response = await edgeFunctionService.getPaymentEmployees({
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

  // Charger les données au montage du composant
  useEffect(() => {
    if (!loading && session?.access_token) {
      loadPaymentData();
    }
  }, [loading, session?.access_token]);

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

    try {
      console.log(
        "🔄 Exécution des paiements pour",
        selectedEmployees.size,
        "employés"
      );

      const response = await edgeFunctionService.executeSalaryPayments({
        employes_selectionnes: Array.from(selectedEmployees),
        mois: selectedMonth || undefined,
        annee: selectedYear || undefined,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Erreur lors de l'exécution des paiements"
        );
      }

      console.log("✅ Paiements exécutés avec succès:", response);

      toast.success(
        `Paiements exécutés avec succès pour ${
          response.data?.nombre_employes || 0
        } employés`
      );

      // Recharger les données pour mettre à jour les statuts
      await loadPaymentData(
        selectedMonth || undefined,
        selectedYear || undefined
      );
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

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSelectedMonth(null);
    setSelectedYear(null);
    loadPaymentData();
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
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          {/* Skeleton pour les filtres */}
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-32"></div>

          {/* Skeleton pour les statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 dark:bg-gray-800 rounded-lg h-24"
              ></div>
            ))}
          </div>

          {/* Skeleton pour le tableau */}
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  // Si pas de session
  if (!session?.partner) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => loadPaymentData()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  // Si pas de données
  if (!paymentData?.data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune donnée disponible
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Impossible de charger les données de paiement.
          </p>
        </div>
      </div>
    );
  }

  const { partenaire, periode, employes, statistiques } = paymentData.data;
  const selectionStats = getSelectionStats();

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">
            Paiements des Salaires
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les paiements de salaires pour {partenaire.nom}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() =>
              loadPaymentData(
                selectedMonth || undefined,
                selectedYear || undefined
              )
            }
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres de période
          </CardTitle>
          <CardDescription>
            Sélectionnez la période pour laquelle vous souhaitez gérer les
            paiements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="month">Mois</Label>
              <Select
                value={selectedMonth?.toString() || ""}
                onValueChange={(value) =>
                  setSelectedMonth(value ? parseInt(value) : null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mois en cours" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleDateString("fr-FR", {
                        month: "long",
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Année</Label>
              <Select
                value={selectedYear?.toString() || ""}
                onValueChange={(value) =>
                  setSelectedYear(value ? parseInt(value) : null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Année en cours" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 3 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} disabled={isLoading}>
                Appliquer
              </Button>
              <Button
                onClick={resetFilters}
                variant="outline"
                disabled={isLoading}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations de période */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Période de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-gray-500">Période</Label>
              <p className="font-medium">
                {formatDate(periode.debut)} - {formatDate(periode.fin)}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Jour de paiement</Label>
              <p className="font-medium">{partenaire.payment_day} du mois</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Mois/Année</Label>
              <p className="font-medium">
                {periode.mois}/{periode.annee}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Employés éligibles</p>
                <p className="text-2xl font-bold">
                  {statistiques.employes_eligibles}
                </p>
                <p className="text-xs text-gray-400">
                  / {statistiques.total_employes} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Montant total disponible
                </p>
                <p className="text-2xl font-bold">
                  {gnfFormatter(statistiques.montant_total_disponible)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avances à déduire</p>
                <p className="text-2xl font-bold">
                  {gnfFormatter(statistiques.montant_total_avances)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Déjà payés</p>
                <p className="text-2xl font-bold">
                  {statistiques.employes_deja_payes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions de sélection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Employés à payer</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={selectAllEligible}
                variant="outline"
                size="sm"
                disabled={isExecuting}
              >
                Tout sélectionner
              </Button>
              <Button
                onClick={deselectAll}
                variant="outline"
                size="sm"
                disabled={isExecuting}
              >
                Tout désélectionner
              </Button>
              {/* Bouton de test pour forcer la sélection */}
              <Button
                onClick={() => {
                  console.log(
                    "🧪 Test: Forcer la sélection de tous les employés"
                  );
                  if (paymentData?.data?.employes) {
                    const allIds = paymentData.data.employes.map(
                      (emp) => emp.id
                    );
                    setSelectedEmployees(new Set(allIds));
                    console.log("✅ Tous les employés sélectionnés:", allIds);
                  }
                }}
                variant="outline"
                size="sm"
                className="bg-purple-100 text-purple-800"
              >
                Forcer Tout
              </Button>
              {/* Bouton de test temporaire */}
              <Button
                onClick={() => {
                  const debugStats = getSelectionStats();
                  console.log("🔍 Debug Info:", {
                    selectedEmployees: Array.from(selectedEmployees),
                    selectedEmployeesSize: selectedEmployees.size,
                    selectionStats: debugStats,
                    paymentDataExists: !!paymentData?.data,
                    employesCount: paymentData?.data?.employes?.length || 0,
                    employesEligibles:
                      paymentData?.data?.employes?.filter(
                        (emp) => emp.eligible_paiement
                      )?.length || 0,
                    paymentData: paymentData?.data,
                  });
                  alert(
                    `Debug: ${selectedEmployees.size} employés sélectionnés, ${debugStats.count} dans les stats`
                  );
                }}
                variant="outline"
                size="sm"
                className="bg-yellow-100 text-yellow-800"
              >
                Debug
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Sélectionnez les employés que vous souhaitez payer pour cette
            période
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Affichage des statistiques de sélection */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {selectionStats.count} employé(s) sélectionné(s)
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Montant total: {gnfFormatter(selectionStats.total)}
                </p>
                <p className="text-xs text-gray-500">
                  IDs sélectionnés:{" "}
                  {Array.from(selectedEmployees).join(", ") || "Aucun"}
                </p>
              </div>

              {/* Bouton de paiement toujours visible pour debug */}
              <div className="flex items-center gap-2">
                <AlertDialog
                  open={showPaymentDialog}
                  onOpenChange={setShowPaymentDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={isExecuting || selectionStats.count === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isExecuting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Exécution...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Exécuter les paiements
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Confirmer l'exécution des paiements
                      </AlertDialogTitle>
                      <AlertDialogDescription>
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
                      >
                        Annuler
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={executePayments}>
                        Confirmer les paiements
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Bouton de test direct */}
                <Button
                  onClick={() => {
                    console.log("🧪 Test direct de paiement");
                    executePayments();
                  }}
                  disabled={isExecuting || selectionStats.count === 0}
                  variant="outline"
                  className="bg-orange-100 text-orange-800"
                >
                  Test Direct
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des employés */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des employés</CardTitle>
          <CardDescription>
            Consultez les détails de chaque employé et sélectionnez ceux à payer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Sélection</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead className="text-right">Salaire net</TableHead>
                  <TableHead className="text-right">Avances déduites</TableHead>
                  <TableHead className="text-right">
                    Salaire disponible
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employes.map((employee) => (
                  <TableRow key={employee.id}>
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
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {employee.prenom} {employee.nom}
                        </p>
                        <p className="text-sm text-gray-500">
                          {employee.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{employee.poste}</TableCell>
                    <TableCell className="text-right">
                      {gnfFormatter(employee.salaire_net)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm">
                        <div>
                          Total: {gnfFormatter(employee.avances_deduites)}
                        </div>
                        <div className="text-gray-500">
                          Mono: {gnfFormatter(employee.avances_mono_mois)}
                        </div>
                        <div className="text-gray-500">
                          Multi: {gnfFormatter(employee.avances_multi_mois)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          employee.salaire_disponible > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {gnfFormatter(employee.salaire_disponible)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {employee.deja_paye ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Déjà payé
                        </Badge>
                      ) : employee.eligible_paiement ? (
                        <Badge
                          variant="default"
                          className="bg-blue-100 text-blue-800"
                        >
                          Éligible
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="bg-red-100 text-red-800"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Non éligible
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Avances: {employee.nombre_avances}</div>
                        {employee.paiement_existant && (
                          <div className="text-gray-500">
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
