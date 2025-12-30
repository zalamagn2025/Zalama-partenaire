"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Users,
  Calendar,
  FileText,
  Save,
} from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { useCreateTreasuryAdvance } from "@/hooks/useTreasuryAdvances";
import { usePartnerEmployees } from "@/hooks/usePartnerEmployee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Fonction pour formatter les montants en GNF
const gnfFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0 GNF";
  }
  return `${value.toLocaleString()} GNF`;
};

export default function NouvelleDemandeTresoreriePage() {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();

  // États pour le formulaire
  const [formData, setFormData] = useState({
    employeIds: [] as string[],
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    reference: "",
    commentaire: "",
  });

  // État pour la recherche d'employés
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  // Hook pour créer une demande
  const createMutation = useCreateTreasuryAdvance();

  // Récupérer les employés pour la sélection
  const { data: employeesResponse, isLoading: isLoadingEmployees } = usePartnerEmployees({
    actif: true,
    limit: 1000, // Récupérer tous les employés actifs
  });

  const employees = (employeesResponse?.data || employeesResponse?.employees || []) as any[];

  // Filtrer les employés selon le terme de recherche
  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearchTerm) return true;
    const searchLower = employeeSearchTerm.toLowerCase();
    const fullName = `${emp.prenom || emp.firstName || ""} ${emp.nom || emp.lastName || ""}`.toLowerCase();
    const poste = (emp.poste || "").toLowerCase();
    const email = (emp.email || "").toLowerCase();
    return (
      fullName.includes(searchLower) ||
      poste.includes(searchLower) ||
      email.includes(searchLower)
    );
  });

  // Fonction pour créer la demande
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.partner?.id) {
      toast.error("Session invalide");
      return;
    }

    if (formData.employeIds.length === 0) {
      toast.error("Veuillez sélectionner au moins un employé");
      return;
    }

    if (!formData.mois || !formData.annee) {
      toast.error("Veuillez sélectionner un mois et une année");
      return;
    }

    // Validation de l'année (ne pas permettre les années futures trop éloignées)
    const currentYear = new Date().getFullYear();
    if (formData.annee > currentYear) {
      toast.error(`L'année ne peut pas être supérieure à ${currentYear}`);
      return;
    }

    if (formData.annee < 2020) {
      toast.error("L'année doit être supérieure ou égale à 2020");
      return;
    }

    // Vérifier que tous les employés sélectionnés ont un salaire valide
    const employesSansSalaire = formData.employeIds.filter((empId) => {
      const emp = employees.find((e) => e.id === empId);
      return !emp || !emp.salaireNet || emp.salaireNet <= 0;
    });

    if (employesSansSalaire.length > 0) {
      const nomsEmployesSansSalaire = employesSansSalaire
        .map((empId) => {
          const emp = employees.find((e) => e.id === empId);
          return emp ? `${emp.prenom || emp.firstName || ""} ${emp.nom || emp.lastName || ""}`.trim() : "Employé";
        })
        .join(", ");
      
      toast.error(
        `Les employés suivants n'ont pas de salaire valide : ${nomsEmployesSansSalaire}. Veuillez les retirer de la sélection.`,
        { duration: 6000 }
      );
      return;
    }

    try {
      await createMutation.mutateAsync({
        employeIds: formData.employeIds,
        mois: formData.mois,
        annee: formData.annee,
        partenaireId: session.partner.id,
        reference: formData.reference || undefined,
        commentaire: formData.commentaire || undefined,
      });

      toast.success("Demande d'avance de trésorerie créée avec succès");
      router.push("/dashboard/paiements-tresorerie");
    } catch (error: any) {
      console.error("Erreur lors de la création de la demande:", error);
      
      // Extraire le message d'erreur détaillé
      let errorMessage = "Erreur lors de la création de la demande";
      
      if (error?.data) {
        // Si l'API retourne un objet avec des détails
        if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.error) {
          errorMessage = error.data.error;
        } else if (Array.isArray(error.data)) {
          // Si c'est un tableau d'erreurs de validation
          errorMessage = error.data.map((err: any) => 
            err.message || err.msg || JSON.stringify(err)
          ).join(", ");
        } else if (typeof error.data === 'string') {
          errorMessage = error.data;
        } else {
          // Afficher les détails complets
          errorMessage = JSON.stringify(error.data, null, 2);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      });
    }
  };

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [loading, session, router]);

  // Si en cours de chargement initial
  if (loading || isLoadingEmployees) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <LoadingSpinner />
      </div>
    );
  }

  // Calculer le total des salaires des employés sélectionnés
  const totalSalaires = formData.employeIds.reduce((total, empId) => {
    const emp = employees.find((e) => e.id === empId);
    return total + (emp?.salaireNet || 0);
  }, 0);

  return (
    <div className="p-6 space-y-6 w-full">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/paiements-tresorerie")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" style={{ color: "var(--zalama-orange)" }}>
            Nouvelle demande d'avance de trésorerie
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Créez une demande d'avance de trésorerie pour payer les salaires des employés
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Carte : Sélection des employés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Employés concernés *
            </CardTitle>
            <CardDescription>
              Sélectionnez les employés pour lesquels vous souhaitez créer une demande d'avance de trésorerie
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Actions rapides */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.employeIds.length} employé(s) sélectionné(s)
                </span>
                {totalSalaires > 0 && (
                  <Badge variant="info" className="text-xs">
                    Total salaires: {gnfFormatter(totalSalaires)}
                  </Badge>
                )}
              </div>
              {employees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Sélectionner uniquement les employés avec un salaire valide
                      const employesAvecSalaire = filteredEmployees
                        .filter((emp) => emp.salaireNet && emp.salaireNet > 0)
                        .map((emp) => emp.id);
                      
                      if (employesAvecSalaire.length === 0) {
                        toast.error("Aucun employé avec salaire valide trouvé dans les résultats filtrés");
                        return;
                      }
                      
                      setFormData({
                        ...formData,
                        employeIds: employesAvecSalaire,
                      });
                    }}
                    className="h-8 text-xs"
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        employeIds: [],
                      });
                    }}
                    className="h-8 text-xs"
                  >
                    Tout désélectionner
                  </Button>
                </div>
              )}
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={employeeSearchTerm}
                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                placeholder="Rechercher un employé par nom, prénom, poste ou email..."
                className="pl-10"
              />
            </div>

            {/* Liste des employés avec checkboxes */}
            <div className="border border-[var(--zalama-border)] border-opacity-20 rounded-lg max-h-96 overflow-y-auto backdrop-blur-sm">
              {filteredEmployees.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {employeeSearchTerm ? "Aucun employé trouvé" : "Aucun employé disponible"}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredEmployees.map((emp) => {
                    const isSelected = formData.employeIds.includes(emp.id);
                    const empName = `${emp.prenom || emp.firstName || ""} ${emp.nom || emp.lastName || ""}`.trim();
                    const hasValidSalary = emp.salaireNet && emp.salaireNet > 0;
                    
                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center gap-3 p-4 transition-colors ${
                          hasValidSalary
                            ? "hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            : "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-900/50"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={!hasValidSalary}
                          onCheckedChange={(checked) => {
                            if (!hasValidSalary) {
                              toast.error(`${empName} n'a pas de salaire valide et ne peut pas être sélectionné`);
                              return;
                            }
                            if (checked) {
                              setFormData({
                                ...formData,
                                employeIds: [...formData.employeIds, emp.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                employeIds: formData.employeIds.filter((id) => id !== emp.id),
                              });
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium dark:text-white truncate">
                                {empName || "Nom non disponible"}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {emp.poste && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {emp.poste}
                                  </span>
                                )}
                                {emp.email && (
                                  <>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {emp.email}
                                    </span>
                                  </>
                                )}
                                {emp.telephone && (
                                  <>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {emp.telephone}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              {hasValidSalary ? (
                                <>
                                  <p className="text-sm font-semibold dark:text-white">
                                    {gnfFormatter(emp.salaireNet)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Salaire net</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                    Aucun salaire
                                  </p>
                                  <p className="text-xs text-red-500 dark:text-red-400">Non disponible</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Résumé des employés sélectionnés */}
            {formData.employeIds.length > 0 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                        {formData.employeIds.length} employé(s) sélectionné(s)
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Total des salaires: {gnfFormatter(totalSalaires)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {formData.employeIds.slice(0, 5).map((empId) => {
                      const emp = employees.find((e) => e.id === empId);
                      const empName = `${emp?.prenom || emp?.firstName || ""} ${emp?.nom || emp?.lastName || ""}`.trim();
                      return (
                        <Badge
                          key={empId}
                          variant="secondary"
                          className="text-xs"
                        >
                          {empName || "Employé"}
                        </Badge>
                      );
                    })}
                    {formData.employeIds.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{formData.employeIds.length - 5} autre(s)
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carte : Informations de la demande */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Informations de la demande
            </CardTitle>
            <CardDescription>
              Renseignez les informations relatives à la période et à la demande
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="mois">Mois *</Label>
                <Select
                  value={String(formData.mois)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, mois: parseInt(value) })
                  }
                >
                  <SelectTrigger id="mois">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={String(month)}>
                        {new Date(2000, month - 1).toLocaleDateString("fr-FR", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="annee">Année *</Label>
                <Input
                  id="annee"
                  type="number"
                  value={formData.annee}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      annee: parseInt(e.target.value) || new Date().getFullYear(),
                    })
                  }
                  min={2020}
                  max={new Date().getFullYear()}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Année maximum: {new Date().getFullYear()}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                placeholder="Référence optionnelle (ex: AV-TRES-2024-001)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Une référence sera générée automatiquement si non renseignée
              </p>
            </div>
            <div>
              <Label htmlFor="commentaire">Commentaire</Label>
              <Textarea
                id="commentaire"
                value={formData.commentaire}
                onChange={(e) =>
                  setFormData({ ...formData, commentaire: e.target.value })
                }
                placeholder="Commentaire optionnel (ex: Paiement des salaires du mois de novembre 2024)"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Résumé de la demande */}
        {formData.employeIds.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-200">
                <FileText className="w-5 h-5" />
                Résumé de la demande
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Nombre d'employés</p>
                  <p className="text-lg font-semibold dark:text-white">{formData.employeIds.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Période</p>
                  <p className="text-lg font-semibold dark:text-white">
                    {new Date(formData.annee, formData.mois - 1).toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total salaires</p>
                  <p className="text-lg font-semibold dark:text-white">{gnfFormatter(totalSalaires)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--zalama-border)]">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/paiements-tresorerie")}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || formData.employeIds.length === 0}
            className="flex items-center gap-2"
            style={{ background: "var(--zalama-orange)" }}
          >
            {createMutation.isPending ? (
              <>
                <LoadingSpinner />
                Création en cours...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Créer la demande
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

