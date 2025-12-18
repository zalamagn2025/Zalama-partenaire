"use client";

import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import {
  usePartnerDemandeAdhesion,
  usePartnerDemandeAdhesionStats,
  useApproveDemandeAdhesion,
  useRejectDemandeAdhesion,
} from "@/hooks/usePartnerDemandeAdhesion";
import type { PartnerDemandeAdhesion } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingSpinner, { LoadingButton } from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  Search,
  Eye,
  FileText,
  Clock,
  X,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Hash,
} from "lucide-react";

// Utiliser le type depuis types/api.ts
type EmployeeWithoutAccount = PartnerDemandeAdhesion;

export default function DemandesAdhesionPage() {
  const { session } = useEdgeAuthContext();
  const [creatingAccount, setCreatingAccount] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "PENDING" | "APPROVED" | "REJECTED" | "IN_REVIEW"
  >("all");
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeWithoutAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectingEmployee, setRejectingEmployee] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Utiliser les hooks pour récupérer les données
  const { data: demandesResponse, isLoading, refetch } = usePartnerDemandeAdhesion({
    search: searchTerm || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    limit: itemsPerPage,
    page: currentPage,
  });

  const { data: statsResponse } = usePartnerDemandeAdhesionStats();
  const approveMutation = useApproveDemandeAdhesion();
  const rejectMutation = useRejectDemandeAdhesion();

  // Extraire les données
  const employees = (demandesResponse?.data || []) as EmployeeWithoutAccount[];
  const filteredEmployees = employees; // Les filtres sont gérés côté serveur
  const totalEmployees = demandesResponse?.total || 0;
  const totalPages = Math.ceil(totalEmployees / itemsPerPage);

  // Les filtres sont gérés côté serveur via les hooks
  // Réinitialiser la pagination quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Pagination côté serveur - les données sont déjà paginées
  const currentEmployees = filteredEmployees;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateAccount = async (employeeId: string) => {
    if (!session?.access_token) {
      toast.error("Session non valide");
      return;
    }

    // Trouver l'employé pour vérifier s'il a un email
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee) {
      toast.error("Employé non trouvé");
      return;
    }

    if (!employee.email) {
      toast.error(
        "Impossible de créer un compte : l'employé n'a pas d'email renseigné"
      );
      return;
    }

    setCreatingAccount(employeeId);
    try {
      // Approuver la demande d'adhésion (cela crée automatiquement l'employé)
      await approveMutation.mutateAsync({
        id: employeeId,
        data: {
          comment: "Demande approuvée et compte créé",
          salaireNet: employee.salaire_net || undefined,
          poste: employee.poste,
          matricule: employee.matricule || undefined,
          typeContrat: employee.type_contrat,
        },
      });

      toast.success("Demande approuvée et compte employé créé avec succès");
      await refetch(); // Recharger la liste
    } catch (error: any) {
      console.error("Erreur lors de l'approbation:", error);
      toast.error(error.message || "Erreur lors de l'approbation de la demande");
    } finally {
      setCreatingAccount(null);
    }
  };

  const handleViewDetails = (employee: EmployeeWithoutAccount) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleRejectEmployee = (employee: EmployeeWithoutAccount) => {
    setSelectedEmployee(employee);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const confirmRejectEmployee = async () => {
    if (!session?.access_token || !selectedEmployee) {
      toast.error("Session non valide");
      return;
    }

    setRejectingEmployee(selectedEmployee.id);
    try {
      // Rejeter la demande d'adhésion
      await rejectMutation.mutateAsync({
        id: selectedEmployee.id,
        data: {
          reason: rejectReason.trim() || undefined,
        },
      });

      toast.success("Demande d'adhésion rejetée avec succès");
      setIsRejectModalOpen(false);
      setSelectedEmployee(null);
      setRejectReason("");
      await refetch(); // Recharger la liste
    } catch (error: any) {
      console.error("Erreur lors du rejet de l'inscription:", error);
      toast.error(error.message || "Erreur lors du rejet de l'inscription");
    } finally {
      setRejectingEmployee(null);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return "Date non disponible";
    }
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  const formatSalary = (salary: number | null | undefined) => {
    if (salary === null || salary === undefined) {
      return "0 GNF";
    }
    return `${salary.toLocaleString()} GNF`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Skeleton pour l'en-tête */}
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-10 w-80"></div>
            <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-6 w-64"></div>
          </div>
          <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-16 w-32"></div>
        </div>

        {/* Skeleton pour les filtres */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-20"></div>

        {/* Skeleton pour la liste des employés */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-300 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-gray-400 dark:bg-gray-600 rounded-full h-10 w-10"></div>
                  <div className="space-y-2 flex-1">
                    <div className="bg-gray-400 dark:bg-gray-600 rounded h-5 w-48"></div>
                    <div className="bg-gray-400 dark:bg-gray-600 rounded h-4 w-32"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="bg-gray-400 dark:bg-gray-600 rounded h-9 w-28"></div>
                  <div className="bg-gray-400 dark:bg-gray-600 rounded h-9 w-20"></div>
                </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Demandes d'Adhésion
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les employés sans compte ZaLaMa
          </p>
        </div>
        <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-xl shadow-sm p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <UserPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {filteredEmployees.length}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Employés sans compte
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg shadow-sm p-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--zalama-text-secondary)]" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[var(--zalama-bg-light)] border-[var(--zalama-border)] text-[var(--zalama-text)] placeholder-[var(--zalama-text-secondary)] focus:border-[var(--zalama-blue)] focus:ring-[var(--zalama-blue)]"
            />
          </div>

          {/* Filtre par statut */}
          <div className="min-w-[200px]">
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--zalama-blue)] focus:border-[var(--zalama-blue)]"
            >
              <option value="all">Tous les employés</option>
              <option value="active">Employés actifs</option>
              <option value="inactive">Employés inactifs</option>
            </select>
          </div>

          {/* Statistiques */}
          <div className="text-sm text-[var(--zalama-text-secondary)] whitespace-nowrap">
            {filteredEmployees.length} sur {employees.length} employés
          </div>
        </div>
      </div>

      {/* Tableau des employés */}
      <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg shadow overflow-hidden backdrop-blur-sm">
        {filteredEmployees.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun employé sans compte
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tous vos employés ont déjà un compte ZaLaMa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[var(--zalama-card)] border-b border-[var(--zalama-border)] border-opacity-20">
              <tr className="border-b border-[var(--zalama-border)] border-opacity-20 p-4">
                <th className="w-1/4 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employé
                </th>
                <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="w-1/8 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Poste
                </th>
                <th className="w-1/8 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type de contrat
                </th>
                <th className="w-1/8 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Salaire net
                </th>
                <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[var(--zalama-border)]">
              {currentEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {employee.prenom.charAt(0)}
                          {employee.nom.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {employee.prenom} {employee.nom}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={employee.actif ? "success" : "error"}
                            className="text-xs"
                          >
                            {employee.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]" title={employee.email || ""}>
                      {employee.email || (
                        <span className="text-red-500 text-xs">Non renseigné</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {employee.poste}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <Badge variant="info" className="text-xs">
                      {employee.type_contrat}
                    </Badge>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatSalary(employee.salaire_net)}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-1">
                      {/* Bouton Détails */}
                      {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(employee);
                        }}
                        disabled={false}
                        className="group relative p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-8 h-8 flex items-center justify-center"
                        title="Voir les détails"
                      >
                        <Eye className="h-3 w-3" />
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          Voir
                        </div>
                      </button> */}

                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           handleViewDetails(employee);
                         }}
                         disabled={false}
                         className="group relative p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                         title="Voir les détails"
                       >
                         <Eye className="h-4 w-4" />
                         <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                           Voir
                         </div>
                       </button>

                      {/* Bouton Rejeter */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectEmployee(employee);
                        }}
                        disabled={rejectingEmployee === employee.id}
                        className="group relative p-2 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        title="Rejeter l'inscription"
                      >
                        {rejectingEmployee === employee.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          Rejeter
                        </div>
                      </button>

                      {/* Bouton Créer */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateAccount(employee.id);
                        }}
                        disabled={
                          creatingAccount === employee.id || !employee.email
                        }
                        className={`group relative p-2 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                          !employee.email
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                            : "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                        }`}
                        title={
                          !employee.email
                            ? "Email requis pour créer un compte"
                            : "Créer le compte"
                        }
                      >
                        {creatingAccount === employee.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          {!employee.email ? "Email requis" : "Créer"}
                        </div>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Pagination */}
      {filteredEmployees.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredEmployees.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal des détails */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-[var(--zalama-bg-darker)] border border-[var(--zalama-border)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--zalama-border)]/30 flex-shrink-0 bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--zalama-orange)] to-[var(--zalama-orange-accent)] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    Détails de l'employé
                  </h2>
                  <p className="text-sm text-[var(--zalama-text-secondary)] mt-1">
                    Informations complètes de l'employé sans compte
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-[var(--zalama-text-secondary)] hover:text-white transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* En-tête avec photo et nom */}
              <div className="flex items-center justify-between gap-6 pb-6 border-b border-[var(--zalama-border)]/30">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                      {selectedEmployee.prenom.charAt(0)}
                      {selectedEmployee.nom.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedEmployee.prenom} {selectedEmployee.nom}
                    </h3>
                    <p className="text-[var(--zalama-text-secondary)] text-lg mt-1">
                      {selectedEmployee.poste}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={selectedEmployee.actif ? "success" : "error"}>
                    {selectedEmployee.actif ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>

              {/* Informations en grille */}
              <div className="space-y-4">
                {/* Email - prend toute la largeur */}
                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Email</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedEmployee.email || "Non renseigné"}
                  </p>
                </div>

                {/* Autres informations en grille */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Téléphone</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedEmployee.telephone || "Non renseigné"}
                    </p>
                  </div>

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                        <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Adresse</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedEmployee.adresse || "Non renseignée"}
                    </p>
                  </div>

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Type de contrat</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedEmployee.type_contrat}
                    </p>
                  </div>

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                        <Hash className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Matricule</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedEmployee.matricule || "Non renseigné"}
                    </p>
                  </div>

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                        <User className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Genre</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedEmployee.genre || "Non renseigné"}
                    </p>
                  </div>

                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Date d'embauche</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedEmployee.date_embauche)}
                  </p>
                </div>

                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                      <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Salaire net</span>
                  </div>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {formatSalary(selectedEmployee.salaire_net)}
                  </p>
                </div>

                <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">Date d'ajout</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedEmployee.created_at)}
                  </p>
                </div>
                </div>
              </div>

              {selectedEmployee.date_expiration && (
                <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl backdrop-blur-sm">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-orange-300">
                      Contrat à durée déterminée
                    </div>
                    <div className="text-sm text-orange-400">
                      Expire le {formatDate(selectedEmployee.date_expiration)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center p-6 border-t border-[var(--zalama-border)]/30 flex-shrink-0 bg-[var(--zalama-bg-light)]/30">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    handleRejectEmployee(selectedEmployee);
                    setIsModalOpen(false);
                  }}
                  disabled={rejectingEmployee === selectedEmployee.id}
                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-red-400 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-lg hover:from-red-500/20 hover:to-red-600/20 hover:text-red-300 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {rejectingEmployee === selectedEmployee.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent" />
                  ) : (
                    <X className="h-4 w-4 group-hover:scale-110 transition-all duration-300" />
                  )}
                  <span className="group-hover:scale-105 transition-all duration-300">
                    {rejectingEmployee === selectedEmployee.id ? "Rejet en cours..." : "Rejeter l'inscription"}
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    handleCreateAccount(selectedEmployee.id);
                    setIsModalOpen(false);
                  }}
                  disabled={
                    creatingAccount === selectedEmployee.id ||
                    !selectedEmployee.email
                  }
                  className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 group ${
                    !selectedEmployee.email
                      ? "bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/30"
                      : "bg-gradient-to-r from-[var(--zalama-blue)]/20 to-[var(--zalama-blue-accent)]/20 text-[var(--zalama-blue)] border border-[var(--zalama-blue)]/30 hover:from-[var(--zalama-blue)]/30 hover:to-[var(--zalama-blue-accent)]/30 hover:text-white hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm"
                  }`}
                  title={
                    !selectedEmployee.email
                      ? "Email requis pour créer un compte"
                      : ""
                  }
                >
                  {creatingAccount === selectedEmployee.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--zalama-blue)] border-t-transparent" />
                  ) : (
                    <UserPlus className="h-4 w-4 group-hover:scale-110 transition-all duration-300" />
                  )}
                  <span className="group-hover:scale-105 transition-all duration-300">
                    {creatingAccount === selectedEmployee.id ? "Création en cours..." : "Créer le compte"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de rejet */}
      {isRejectModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-[var(--zalama-bg-darker)] border border-[var(--zalama-border)] rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--zalama-border)]/30 flex-shrink-0 bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    Rejeter l'inscription
                  </h2>
                  <p className="text-sm text-[var(--zalama-text-secondary)] mt-1">
                    Cette action enverra une notification à l'employé
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason("");
                  setSelectedEmployee(null);
                }}
                className="p-2 rounded-full hover:bg-white/10 text-[var(--zalama-text-secondary)] hover:text-white transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">
                    {selectedEmployee.prenom.charAt(0)}
                    {selectedEmployee.nom.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedEmployee.prenom} {selectedEmployee.nom}
                  </h3>
                  <p className="text-[var(--zalama-text-secondary)] text-lg mt-1">
                    {selectedEmployee.poste}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-[var(--zalama-text-secondary)]">
                  Motif du rejet (optionnel)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Expliquez pourquoi cette inscription est rejetée..."
                  className="w-full px-4 py-3 border border-[var(--zalama-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-transparent text-white resize-none backdrop-blur-sm"
                  rows={4}
                />
                <p className="text-xs text-[var(--zalama-text-secondary)]">
                  Ce motif sera envoyé à l'employé par email et SMS.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center p-6 border-t border-[var(--zalama-border)]/30 flex-shrink-0 bg-[var(--zalama-bg-light)]/30">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectReason("");
                    setSelectedEmployee(null);
                  }}
                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-[var(--zalama-text-secondary)] bg-transparent border border-[var(--zalama-border)]/50 rounded-lg hover:bg-white/10 hover:text-white hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm transition-all duration-300 group"
                >
                  <span className="group-hover:scale-105 transition-all duration-300">
                    Annuler
                  </span>
                </button>
                
                <button
                  onClick={confirmRejectEmployee}
                  disabled={rejectingEmployee === selectedEmployee.id}
                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-red-400 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-lg hover:from-red-500/20 hover:to-red-600/20 hover:text-red-300 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {rejectingEmployee === selectedEmployee.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent" />
                  ) : (
                    <X className="h-4 w-4 group-hover:scale-110 transition-all duration-300" />
                  )}
                  <span className="group-hover:scale-105 transition-all duration-300">
                    {rejectingEmployee === selectedEmployee.id ? "Rejet en cours..." : "Confirmer le rejet"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
