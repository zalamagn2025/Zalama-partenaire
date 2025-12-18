"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  Eye,
  RefreshCw,
  Calendar,
  TrendingUp,
  AlertTriangle,
  X,
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  MapPin,
  Hash,
  UserCheck,
} from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/ui/Pagination";
import { toast } from "sonner";
import { usePartnerEmployees, usePartnerEmployeeStats } from "@/hooks/usePartnerEmployee";
import type { PartnerEmployee } from "@/types/api";

// Type pour les employés (compatibilité avec l'interface existante)
type Employee = PartnerEmployee & {
  type_contrat?: string;
  salaire_net?: number;
  date_embauche?: string;
  photo_url?: string | null;
};

export default function EmployesPage() {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContractType, setSelectedContractType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isContractDropdownOpen, setIsContractDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 10;

  // États pour les modales
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Utiliser les hooks pour récupérer les données
  const { data: employeesResponse, isLoading, refetch: refetchEmployees } = usePartnerEmployees({
    search: searchTerm || undefined,
    typeContrat: selectedContractType || undefined,
    actif: selectedStatus === 'actif' ? true : selectedStatus === 'inactif' ? false : undefined,
    limit: employeesPerPage,
    page: currentPage,
  });

  const { data: statsResponse, isLoading: statisticsLoading } = usePartnerEmployeeStats();

  // Extraire les données des réponses
  const employees = (employeesResponse?.data || employeesResponse?.employees || []) as Employee[];
  const filteredEmployees = employees; // Les filtres sont gérés côté serveur
  const totalEmployees = employeesResponse?.total || 0;
  const totalPages = Math.ceil(totalEmployees / employeesPerPage);
  const statistics = statsResponse?.data || null;

  // Fonction pour recharger les données du mois en cours
  const loadCurrentMonthData = async () => {
    try {
      await refetchEmployees();
      toast.success("Données des employés du mois en cours mises à jour avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toast.error("Erreur lors du chargement des données du mois en cours");
    }
  };

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [loading, session, router]);

  // Les filtres sont gérés côté serveur via les hooks, mais on peut aussi faire un filtrage client supplémentaire si nécessaire
  // Pour l'instant, on utilise directement les données du serveur

  // Les statistiques sont globales et ne changent pas avec les filtres

  // Calculer les statistiques depuis la réponse API
  const activeEmployees = statistics?.actifs || 0;
  const newThisMonth = 0; // À implémenter si disponible dans l'API
  const retentionRate = 0; // À implémenter si disponible dans l'API
  const totalEmployeesFromStats = statistics?.total || totalEmployees;

  // Pagination côté serveur - les données sont déjà paginées
  const currentEmployees = filteredEmployees;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Fonctions utilitaires
  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "GNF",
      minimumFractionDigits: 0,
    }).format(salary);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Non définie";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Date invalide";
    }
  };

  // Gestion des modales
  const openViewModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedEmployee(null);
    setIsViewModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = [
      [
        "Nom",
        "Prénom",
        "Email",
        "Poste",
        "Type de contrat",
        "Salaire net",
        "Statut",
      ],
      ...filteredEmployees.map((emp) => [
        emp.nom,
        emp.prenom,
        emp.email || "",
        emp.poste || "",
        emp.type_contrat || "",
        emp.salaire_net?.toString() || "",
        emp.actif ? "Actif" : "Inactif",
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `employes_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || isLoading || statisticsLoading) {
    return (
      <div className="p-6 space-y-6 max-w-full overflow-hidden animate-pulse">
        {/* Skeleton pour les statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 dark:bg-gray-800 rounded-lg h-28"
            ></div>
          ))}
        </div>

        {/* Skeleton pour les filtres */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-24"></div>

        {/* Skeleton pour le tableau */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-3">
            {/* En-tête du tableau */}
            <div className="grid grid-cols-6 gap-4 pb-3 border-b border-gray-300 dark:border-gray-700">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-300 dark:bg-gray-700 rounded h-5"
                ></div>
              ))}
            </div>
            {/* Lignes du tableau */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 py-3">
                {[...Array(6)].map((_, j) => (
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

  if (!session) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-full overflow-hidden">
      

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employés */}
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-5 border border-orange-200 dark:border-orange-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <Badge className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">Total</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {statisticsLoading ? "..." : totalEmployeesFromStats}
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              Total des employés
            </p>
          </div>
        </div>

        {/* Employés Actifs */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-5 border border-green-200 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="success" className="text-xs">Actifs</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {statisticsLoading ? "..." : activeEmployees}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Employés actifs
              {totalEmployeesFromStats > 0 && (
                <span className="ml-1 text-xs">
                  ({Math.round((activeEmployees / totalEmployeesFromStats) * 100)}%)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Employés Inactifs */}
        <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-5 border border-red-200 dark:border-red-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <Badge variant="error" className="text-xs">Inactifs</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
              {statisticsLoading ? "..." : (statistics?.statistics?.inactive_employees || 0)}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Employés inactifs
              {totalEmployeesFromStats > 0 && (
                <span className="ml-1 text-xs">
                  ({Math.round(((statistics?.statistics?.inactive_employees || 0) / totalEmployeesFromStats) * 100)}%)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Taux d'activation */}
        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-5 border border-purple-200 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <Badge className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">Taux</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {statisticsLoading ? "..." : `${retentionRate}%`}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
              Taux d'activation
            </p>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--zalama-text-secondary)]" />
              <Input
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[var(--zalama-bg-light)] border-[var(--zalama-border)] text-[var(--zalama-text)] placeholder-[var(--zalama-text-secondary)] focus:border-[var(--zalama-blue)] focus:ring-[var(--zalama-blue)]"
              />
            </div>
          </div>

          {/* Filtre par type de contrat */}
          <div className="relative">
            <button
              onClick={() => setIsContractDropdownOpen(!isContractDropdownOpen)}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              {selectedContractType || "Type de contrat"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {isContractDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[var(--zalama-card)] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setSelectedContractType(null);
                    setIsContractDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[var(--zalama-card)] dark:text-white"
                >
                  Tous les contrats
                </button>
                <button
                  onClick={() => {
                    setSelectedContractType("CDI");
                    setIsContractDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[var(--zalama-card)] dark:text-white"
                >
                  CDI
                </button>
                <button
                  onClick={() => {
                    setSelectedContractType("CDD");
                    setIsContractDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[var(--zalama-card)] dark:text-white"
                >
                  CDD
                </button>
                <button
                  onClick={() => {
                    setSelectedContractType("Consultant");
                    setIsContractDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[var(--zalama-card)] dark:text-white"
                >
                  Consultant
                </button>
                <button
                  onClick={() => {
                    setSelectedContractType("Stage");
                    setIsContractDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Stage
                </button>
              </div>
            )}
          </div>

          {/* Filtre par statut */}
          <div className="relative">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              {selectedStatus === "actif"
                ? "Actifs"
                : selectedStatus === "inactif"
                ? "Inactifs"
                : "Statut"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[var(--zalama-card)] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setSelectedStatus(null);
                    setIsStatusDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Tous les statuts
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus("actif");
                    setIsStatusDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Actifs
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus("inactif");
                    setIsStatusDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Inactifs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tableau des employés */}
      <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg shadow overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[var(--zalama-card)] border-b border-[var(--zalama-border)] border-opacity-20">
              <tr className="border-b border-[var(--zalama-border)] border-opacity-20 p-4">
                <th className="w-1/4 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employé
                </th>
                <th className="w-1/6 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Poste
                </th>
                <th className="w-1/8 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type de contrat
                </th>
                <th className="w-1/8 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Salaire net
                </th>
                <th className="w-1/8 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date d'embauche
                </th>
                <th className="w-1/12 px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="w-1/12 px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[var(--zalama-border)]">
              {currentEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {(employee as any).photo_url ? (
                          <Image
                            src={(employee as any).photo_url}
                            alt={`${employee.prenom} ${employee.nom}`}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                            {employee.prenom.charAt(0)}
                            {employee.nom.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {employee.prenom} {employee.nom}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {employee.genre || "Non renseigné"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <div className="text-sm text-gray-900 dark:text-white truncate">
                      {employee.poste}
                    </div>
                    {employee.role && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {employee.role}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <Badge variant="info" className="text-xs">
                      {employee.type_contrat}
                    </Badge>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      {employee.salaire_net
                        ? formatSalary(employee.salaire_net)
                        : "Non défini"}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="truncate">
                      {employee.date_embauche
                        ? formatDate(employee.date_embauche)
                        : "Non définie"}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <Badge
                      variant={employee.actif ? "success" : "error"}
                      className="text-xs"
                    >
                      {employee.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="px-2 py-4 text-center text-sm font-medium">
                    <button
                      onClick={() => openViewModal(employee)}
                      className="group relative p-2 rounded-full bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        Voir
                      </div>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredEmployees.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPagesClient}
            totalItems={filteredEmployees.length}
            itemsPerPage={employeesPerPage}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* Modal de visualisation des détails */}
      {isViewModalOpen && selectedEmployee && (
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
                    Informations complètes de l'employé
                  </p>
                </div>
              </div>
              <button
                onClick={closeViewModal}
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
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                    {(selectedEmployee as any).photo_url ? (
                      <Image
                        src={(selectedEmployee as any).photo_url}
                        alt={`${selectedEmployee.prenom} ${selectedEmployee.nom}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                        {selectedEmployee.prenom.charAt(0)}
                        {selectedEmployee.nom.charAt(0)}
                      </span>
                    )}
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
                  <Badge
                    variant={selectedEmployee.actif ? "success" : "error"}
                    className="text-xs"
                  >
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
                      {selectedEmployee.telephone ? `+224${selectedEmployee.telephone}` : "Non renseigné"}
                    </p>
                  </div>

                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                        <UserCheck className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Genre</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {(selectedEmployee as any).genre || "Non renseigné"}
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
                      {(selectedEmployee as any).adresse || "Non renseignée"}
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
                      {(selectedEmployee as any).matricule || "Non renseigné"}
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
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                        <DollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Salaire net</span>
                    </div>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      {selectedEmployee.salaire_net
                        ? formatSalary(selectedEmployee.salaire_net)
                        : "Non défini"}
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
                      {selectedEmployee.date_embauche
                        ? formatDate(selectedEmployee.date_embauche)
                        : "Non définie"}
                    </p>
                  </div>

                  {(selectedEmployee as any).date_expiration && (
                    <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                          <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Date d'expiration</span>
                      </div>
                      <p className="font-medium text-orange-600 dark:text-orange-400">
                        {formatDate((selectedEmployee as any).date_expiration)}
                      </p>
                    </div>
                  )}

                  {(selectedEmployee as any).last_sign_in_at && (
                    <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                          <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Dernière connexion</span>
                      </div>
                      <p className="font-medium text-teal-600 dark:text-teal-400">
                        {formatDate((selectedEmployee as any).last_sign_in_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Informations système */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Informations Système</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                          <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">Date de création</span>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(selectedEmployee.created_at)}
                      </p>
                    </div>



                    {(selectedEmployee as any).status && (
                      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-slate-100 dark:bg-slate-900/20 rounded-lg">
                            <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </div>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">Statut général</span>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {(selectedEmployee as any).status}
                        </p>
                      </div>
                    )}

                    {selectedEmployee.user_id && (
                      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm md:col-span-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">ID Utilisateur</span>
                        </div>
                        <p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">
                          {selectedEmployee.user_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
