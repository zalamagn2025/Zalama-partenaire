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
  X,
  User,
} from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { useCreateTreasuryAdvance } from "@/hooks/useTreasuryAdvances";
import { usePartnerPaymentsEmployees } from "@/hooks/usePartnerPayments";
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
import Image from "next/image";

// Fonction pour formatter les montants en GNF
const gnfFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0 GNF";
  }
  return `${value.toLocaleString()} GNF`;
};

// Fonction pour générer une référence unique
const generateUniqueReference = (mois: number, annee: number): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const moisStr = mois.toString().padStart(2, '0');
  return `AV-TRES-${annee}-${moisStr}-${timestamp.toString().slice(-6)}-${randomSuffix}`;
};

export default function NouvelleDemandeTresoreriePage() {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();

  // États pour le formulaire
  const [formData, setFormData] = useState({
    employeIds: [] as string[],
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    reference: generateUniqueReference(new Date().getMonth() + 1, new Date().getFullYear()),
    commentaire: "",
  });

  // État pour la recherche d'employés
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  // Hook pour créer une demande
  const createMutation = useCreateTreasuryAdvance();

  // Récupérer les employés avec informations de paiement pour la période sélectionnée
  const { data: employeesResponse, isLoading: isLoadingEmployees } = usePartnerPaymentsEmployees({
    mois: formData.mois,
    annee: formData.annee,
  });

  // L'API peut retourner directement un tableau ou un objet avec une propriété data
  const employeesListRaw = (employeesResponse && typeof employeesResponse === 'object' && 'data' in employeesResponse) 
    ? (employeesResponse as any).data 
    : (Array.isArray(employeesResponse) ? employeesResponse : []);
  const employees = (Array.isArray(employeesListRaw) ? employeesListRaw : []) as any[];

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

    // Vérifier que tous les employés sélectionnés ont un salaire valide et ne sont pas déjà payés
    const employesInvalides = formData.employeIds.filter((empId) => {
      const emp = employees.find((e) => e.id === empId);
      if (!emp) return true;
      // Vérifier le salaire
      if (!emp.salaireNet || emp.salaireNet <= 0) return true;
      // Vérifier si déjà payé
      if (emp.dejaPaye === true) return true;
      return false;
    });

    if (employesInvalides.length > 0) {
      const employesSansSalaire = employesInvalides.filter((empId) => {
        const emp = employees.find((e) => e.id === empId);
        return !emp || !emp.salaireNet || emp.salaireNet <= 0;
      });
      
      const employesDejaPayes = employesInvalides.filter((empId) => {
        const emp = employees.find((e) => e.id === empId);
        return emp && emp.dejaPaye === true;
      });

      const messages = [];
      if (employesSansSalaire.length > 0) {
        const noms = employesSansSalaire
          .map((empId) => {
            const emp = employees.find((e) => e.id === empId);
            return emp ? `${emp.prenom || emp.firstName || ""} ${emp.nom || emp.lastName || ""}`.trim() : "Employé";
          })
          .join(", ");
        messages.push(`Les employés suivants n'ont pas de salaire valide : ${noms}`);
      }
      
      if (employesDejaPayes.length > 0) {
        const noms = employesDejaPayes
          .map((empId) => {
            const emp = employees.find((e) => e.id === empId);
            return emp ? `${emp.prenom || emp.firstName || ""} ${emp.nom || emp.lastName || ""}`.trim() : "Employé";
          })
          .join(", ");
        messages.push(`Les employés suivants sont déjà payés pour cette période : ${noms}`);
      }
      
      toast.error(messages.join(". "), { duration: 8000 });
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

  // Régénérer la référence quand le mois ou l'année change
  useEffect(() => {
    if (formData.mois && formData.annee) {
      setFormData(prev => ({
        ...prev,
        reference: generateUniqueReference(formData.mois, formData.annee),
      }));
    }
  }, [formData.mois, formData.annee]);

  // Si en cours de chargement initial
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <LoadingSpinner />
      </div>
    );
  }

  // Afficher un message si le mois et l'année ne sont pas sélectionnés
  if (!formData.mois || !formData.annee) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/paiements-tresorerie")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Nouvelle demande d'avance de trésorerie
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Créez une demande d'avance de trésorerie pour payer les salaires des employés
            </p>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Veuillez sélectionner un mois et une année pour voir les employés disponibles.
          </p>
        </div>
      </div>
    );
  }

  // Calculer le total des salaires des employés sélectionnés
  const totalSalaires = formData.employeIds.reduce((total, empId) => {
    const emp = employees.find((e) => e.id === empId);
    return total + (emp?.salaireNet || 0);
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/paiements-tresorerie")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Nouvelle demande d'avance de trésorerie
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Créez une demande d'avance de trésorerie pour payer les salaires des employés
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Carte : Sélection des employés */}
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-6 shadow-sm backdrop-blur-sm">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Employés concernés *
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Sélectionnez les employés pour lesquels vous souhaitez créer une demande d'avance de trésorerie
          </p>
          <div className="space-y-4">
            {/* Recherche et filtres */}
            <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher un employé..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[var(--zalama-border)] rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                  <button 
                    onClick={() => {
                      // Sélectionner uniquement les employés avec un salaire valide et non déjà payés
                      const employesSelectionnables = filteredEmployees
                        .filter((emp) => {
                          const hasValidSalary = emp.salaireNet && emp.salaireNet > 0;
                          const notAlreadyPaid = emp.dejaPaye !== true;
                          return hasValidSalary && notAlreadyPaid;
                        })
                        .map((emp) => emp.id);
                      
                      if (employesSelectionnables.length === 0) {
                        toast.error("Aucun employé sélectionnable trouvé (tous sont déjà payés ou n'ont pas de salaire valide)");
                        return;
                      }
                      
                      setFormData({
                        ...formData,
                        employeIds: employesSelectionnables,
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                <button 
                  onClick={() => {
                    setFormData({
                      ...formData,
                      employeIds: [],
                    });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Sélectionnés:</span>
                <Badge variant="info" className="text-xs">{formData.employeIds.length} employé(s)</Badge>
                {totalSalaires > 0 && (
                  <>
                    <span>•</span>
                    <Badge variant="info" className="text-xs">
                      Total: {gnfFormatter(totalSalaires)}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Liste des employés */}
            <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow-sm backdrop-blur-sm">
              <div className="p-4 border-b border-[var(--zalama-border)]/30">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Employés disponibles ({filteredEmployees.length})
                </h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      {employeeSearchTerm ? "Aucun employé trouvé" : "Aucun employé disponible"}
                    </p>
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = formData.employeIds.includes(emp.id);
                    const empName = `${emp.prenom || emp.firstName || ""} ${emp.nom || emp.lastName || ""}`.trim();
                    const hasValidSalary = emp.salaireNet && emp.salaireNet > 0;
                    const dejaPaye = emp.dejaPaye === true;
                    const canBeSelected = hasValidSalary && !dejaPaye;
                    
                    return (
                      <div 
                        key={emp.id} 
                        className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-[var(--zalama-border)]/20 last:border-b-0 ${
                          !canBeSelected ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isSelected ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                        }`}
                        onClick={() => {
                          if (!canBeSelected) {
                            if (dejaPaye) {
                              toast.error(`${empName} est déjà payé pour cette période et ne peut pas être sélectionné`);
                            } else {
                              toast.error(`${empName} n'a pas de salaire valide et ne peut pas être sélectionné`);
                            }
                            return;
                          }
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              employeIds: formData.employeIds.filter((id) => id !== emp.id),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              employeIds: [...formData.employeIds, emp.id],
                            });
                          }
                        }}
                      >
                        <div className="relative w-10 h-10 bg-orange-50/30 dark:bg-orange-900/40 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {emp.photo_url || emp.photoUrl ? (
                            <Image
                              src={emp.photo_url || emp.photoUrl}
                              alt={empName || "Employé"}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                          )}
                        </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {empName || "Nom non disponible"}
                              </p>
                              {dejaPaye && (
                                <Badge variant="success" className="text-xs">
                                  Déjà payé
                                </Badge>
                              )}
                              {emp.paiementEnAttente && !dejaPaye && (
                                <Badge variant="warning" className="text-xs">
                                  En attente
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {emp.poste || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                              {emp.email || ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {hasValidSalary ? gnfFormatter(emp.salaireNet) : 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Salaire net
                              </p>
                              {emp.salaireRestant !== undefined && emp.salaireRestant !== null && (
                                <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                                  Restant: {gnfFormatter(emp.salaireRestant)}
                                </p>
                              )}
                              {emp.avancesActives && emp.avancesActives.montantTotal > 0 && (
                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                  Avances: {gnfFormatter(emp.avancesActives.montantTotal)}
                                </p>
                              )}
                            </div>
                          {!canBeSelected ? (
                            <div className="w-5 h-5 border-2 rounded border-gray-300 dark:border-gray-600 opacity-50" title={dejaPaye ? "Déjà payé pour cette période" : "Pas de salaire valide"}>
                              <X className="w-3 h-3 text-gray-400 m-0.5" />
                            </div>
                          ) : (
                            <div className={`w-5 h-5 border-2 rounded cursor-pointer transition-colors ${
                              isSelected 
                                ? 'border-orange-500 bg-orange-500' 
                                : 'border-gray-300 dark:border-gray-600 hover:border-orange-500'
                            }`}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
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
                          variant="info"
                          className="text-xs"
                        >
                          {empName || "Employé"}
                        </Badge>
                      );
                    })}
                    {formData.employeIds.length > 5 && (
                      <Badge variant="info" className="text-xs">
                        +{formData.employeIds.length - 5} autre(s)
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carte : Informations de la demande */}
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-6 shadow-sm backdrop-blur-sm">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            Informations de la demande
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Renseignez les informations relatives à la période et à la demande
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="mois" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mois *
                </Label>
                <Select
                  value={String(formData.mois)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, mois: parseInt(value) })
                  }
                >
                  <SelectTrigger id="mois" className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
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
                <Label htmlFor="annee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Année *
                </Label>
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
                  className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Année maximum: {new Date().getFullYear()}
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Référence
              </Label>
              <Input
                id="reference"
                value={formData.reference}
                readOnly
                className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Référence générée automatiquement
              </p>
            </div>
            <div>
              <Label htmlFor="commentaire" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Commentaire
              </Label>
              <Textarea
                id="commentaire"
                value={formData.commentaire}
                onChange={(e) =>
                  setFormData({ ...formData, commentaire: e.target.value })
                }
                placeholder="Commentaire optionnel (ex: Paiement des salaires du mois de novembre 2024)"
                rows={4}
                className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-lg bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Résumé de la demande */}
        {formData.employeIds.length > 0 && (
          <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-6 shadow-sm backdrop-blur-sm">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Résumé de la demande
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Nombre d'employés</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{formData.employeIds.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Période</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(formData.annee, formData.mois - 1).toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total salaires</p>
                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">{gnfFormatter(totalSalaires)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/paiements-tresorerie")}
              className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || formData.employeIds.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

