"use client";

import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
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
} from "lucide-react";

interface EmployeeWithoutAccount {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
  poste: string;
  type_contrat: string;
  salaire_net: number | null;
  actif: boolean;
  date_embauche: string;
  date_expiration?: string;
  created_at: string;
}

export default function DemandesAdhesionPage() {
  const { session } = useEdgeAuthContext();
  const [employees, setEmployees] = useState<EmployeeWithoutAccount[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<
    EmployeeWithoutAccount[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingAccount, setCreatingAccount] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeWithoutAccount | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectingEmployee, setRejectingEmployee] = useState<string | null>(
    null
  );
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Charger les employés sans compte
  useEffect(() => {
    const loadEmployeesWithoutAccount = async () => {
      if (!session?.access_token) return;

      setIsLoading(true);
      try {
        const response = await edgeFunctionService.getEmployeesWithoutAccount(
          session.access_token
        );

        if (response.success && response.data) {
          setEmployees(response.data);
          setFilteredEmployees(response.data);
        } else {
          throw new Error(response.message || "Erreur lors du chargement");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des employés:", error);
        toast.error("Erreur lors du chargement des employés");
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployeesWithoutAccount();
  }, [session?.access_token]);

  // Filtrer les employés
  useEffect(() => {
    let filtered = employees;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          emp.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.poste.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (filterStatus === "active") {
      filtered = filtered.filter((emp) => emp.actif);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((emp) => !emp.actif);
    }

    setFilteredEmployees(filtered);
    // Réinitialiser la pagination quand les filtres changent
    setCurrentPage(1);
  }, [employees, searchTerm, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

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
      const response = await edgeFunctionService.createEmployeeAccount(
        session.access_token,
        { employee_id: employeeId }
      );

      if (response.success) {
        toast.success("Compte employé créé avec succès");
        // Retirer l'employé de la liste
        setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      } else {
        throw new Error(response.message || "Erreur lors de la création");
      }
    } catch (error: any) {
      console.error("Erreur lors de la création du compte:", error);
      toast.error(error.message || "Erreur lors de la création du compte");
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
      const response = await edgeFunctionService.rejectEmployeeRegistration(
        session.access_token,
        {
          employee_id: selectedEmployee.id,
          reason: rejectReason.trim() || undefined,
        }
      );

      if (response.success) {
        toast.success("Inscription d'employé rejetée avec succès");
        // Retirer l'employé de la liste
        setEmployees((prev) =>
          prev.filter((emp) => emp.id !== selectedEmployee.id)
        );
        setFilteredEmployees((prev) =>
          prev.filter((emp) => emp.id !== selectedEmployee.id)
        );
        setIsRejectModalOpen(false);
        setSelectedEmployee(null);
        setRejectReason("");
      } else {
        throw new Error(response.message || "Erreur lors du rejet");
      }
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
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-blue-600" />
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredEmployees.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              employés sans compte
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] rounded-lg shadow-sm p-4">
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
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] rounded-lg shadow overflow-hidden">
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
            <tbody className="bg-white dark:bg-[var(--zalama-card)] divide-y divide-[var(--zalama-border)]">
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
                            variant={employee.actif ? "default" : "secondary"}
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
                    <Badge variant="outline" className="text-xs">
                      {employee.type_contrat}
                    </Badge>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatSalary(employee.salaire_net)}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(employee);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Détails
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectEmployee(employee);
                        }}
                        disabled={rejectingEmployee === employee.id}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                      >
                        <LoadingButton
                          loading={rejectingEmployee === employee.id}
                        >
                          <X className="h-3 w-3" />
                        </LoadingButton>
                        Rejeter
                      </Button>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateAccount(employee.id);
                        }}
                        disabled={
                          creatingAccount === employee.id || !employee.email
                        }
                        className={`${
                          !employee.email
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        } flex items-center gap-1`}
                        title={
                          !employee.email
                            ? "Email requis pour créer un compte"
                            : ""
                        }
                      >
                        <LoadingButton
                          loading={creatingAccount === employee.id}
                        >
                          <UserPlus className="h-3 w-3" />
                        </LoadingButton>
                        Créer
                      </Button>
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
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-gray-50 to-orange-50/30 dark:from-gray-800 dark:to-orange-900/10">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Détails de l'employé
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Informations complètes de l'employé sans compte
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* En-tête avec photo et nom */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-xl">
                    {selectedEmployee.prenom.charAt(0)}
                    {selectedEmployee.nom.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedEmployee.prenom} {selectedEmployee.nom}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {selectedEmployee.poste}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={selectedEmployee.actif ? "default" : "secondary"}>
                      {selectedEmployee.actif ? "Actif" : "Inactif"}
                    </Badge>
                    <Badge variant="outline">
                      {selectedEmployee.type_contrat}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informations en grille */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedEmployee.email || "Non renseigné"}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type de contrat</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedEmployee.type_contrat}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date d'embauche</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedEmployee.date_embauche)}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Salaire net</p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {formatSalary(selectedEmployee.salaire_net)}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date d'ajout</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDate(selectedEmployee.created_at)}
                  </p>
                </div>
              </div>

              {selectedEmployee.date_expiration && (
                <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                      Contrat à durée déterminée
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      Expire le {formatDate(selectedEmployee.date_expiration)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  handleRejectEmployee(selectedEmployee);
                  setIsModalOpen(false);
                }}
                disabled={rejectingEmployee === selectedEmployee.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectingEmployee === selectedEmployee.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Rejeter l'inscription
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Fermer
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
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    !selectedEmployee.email
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                  title={
                    !selectedEmployee.email
                      ? "Email requis pour créer un compte"
                      : ""
                  }
                >
                  {creatingAccount === selectedEmployee.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Créer le compte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de rejet */}
      {isRejectModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-red-50 to-orange-50/30 dark:from-red-900/20 dark:to-orange-900/10">
              <div>
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Rejeter l'inscription
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Cette action enverra une notification à l'employé
                </p>
              </div>
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason("");
                  setSelectedEmployee(null);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <span className="text-red-600 dark:text-red-400 font-semibold text-xl">
                      {selectedEmployee.prenom.charAt(0)}
                      {selectedEmployee.nom.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-red-900 dark:text-red-100">
                      {selectedEmployee.prenom} {selectedEmployee.nom}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                      {selectedEmployee.poste}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Motif du rejet (optionnel)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Expliquez pourquoi cette inscription est rejetée..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800 dark:text-white resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ce motif sera envoyé à l'employé par email et SMS.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason("");
                  setSelectedEmployee(null);
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmRejectEmployee}
                disabled={rejectingEmployee === selectedEmployee.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectingEmployee === selectedEmployee.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
