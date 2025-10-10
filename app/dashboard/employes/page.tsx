"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { useEdgeAuth } from "@/hooks/useEdgeAuth";
import StatCard from "@/components/dashboard/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";
import type { Employee } from "@/lib/supabase";

export default function EmployesPage() {
  const { session, loading } = useEdgeAuth();
  const router = useRouter();

  // États pour les données
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContractType, setSelectedContractType] = useState<
    string | null
  >(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isContractDropdownOpen, setIsContractDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);

  // États pour les modales
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  // États pour les données Edge Functions (mois en cours)
  const [currentMonthData, setCurrentMonthData] = useState<any>(null);
  const [edgeFunctionLoading, setEdgeFunctionLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // Charger les employés au montage du composant
  useEffect(() => {
    if (!loading && session?.partner) {
      loadEmployees();
      loadStatistics();
    }
  }, [loading, session?.partner]);

  const loadEmployees = async (page: number = 1, filters: any = {}) => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      // Construire les paramètres de requête
      const queryParams = new URLSearchParams();
      queryParams.append("limit", employeesPerPage.toString());
      queryParams.append("offset", ((page - 1) * employeesPerPage).toString());

      // Ajouter les filtres
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.type_contrat)
        queryParams.append("type_contrat", filters.type_contrat);
      if (filters.actif !== null && filters.actif !== undefined)
        queryParams.append("actif", filters.actif.toString());

      const response = await fetch(
        `/api/proxy/employees?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const employeesData = await response.json();

      if (!employeesData.success) {
        console.error("Erreur Edge Function:", employeesData.message);
        toast.error("Erreur lors du chargement des employés");
        return;
      }

      const employeesList = employeesData.data?.employees || [];
      const pagination = employeesData.data?.pagination || {};

      setEmployees(employeesList);
      setFilteredEmployees(employeesList);
      setTotalPages(pagination.total_pages || 0);
      setTotalEmployees(pagination.total || 0);

      console.log("Employés chargés via proxy:", employeesList);
      console.log("Pagination:", pagination);
    } catch (error) {
      console.error("Erreur lors du chargement des employés:", error);
      toast.error("Erreur lors du chargement des employés");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les statistiques des employés
  const loadStatistics = async () => {
    if (!session?.access_token) return;

    setStatisticsLoading(true);
    try {
      const response = await fetch("/api/proxy/employees-statistics", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const statisticsData = await response.json();

      if (!statisticsData.success) {
        console.error(
          "Erreur Edge Function (statistics):",
          statisticsData.message
        );
        return;
      }

      setStatistics(statisticsData.data);
      console.log("Statistiques chargées:", statisticsData.data);
      console.log(
        "Structure des statistiques:",
        JSON.stringify(statisticsData.data, null, 2)
      );
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setStatisticsLoading(false);
    }
  };

  // Charger les données du mois en cours via Edge Functions
  const loadCurrentMonthData = async () => {
    if (!session?.access_token) return;

    setEdgeFunctionLoading(true);
    try {
      // Utiliser le proxy pour les données du dashboard
      const response = await fetch("/api/proxy/employees", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const employeesData = await response.json();

      if (!employeesData.success) {
        console.error("Erreur Edge Function:", employeesData.message);
        toast.error("Erreur lors du chargement des données du mois en cours");
        return;
      }

      const employeesList = employeesData.data || [];
      setCurrentMonthData({ employees: employeesList });

      // Mettre à jour les données locales avec les données du mois en cours
      setEmployees(employeesList);
      setFilteredEmployees(employeesList);

      console.log(
        "Données des employés du mois en cours chargées:",
        employeesData
      );
      toast.success(
        "Données des employés du mois en cours mises à jour avec succès"
      );
    } catch (error) {
      console.error(
        "Erreur lors du chargement des données Edge Functions:",
        error
      );
      toast.error("Erreur lors du chargement des données du mois en cours");
    } finally {
      setEdgeFunctionLoading(false);
    }
  };

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [loading, session, router]);

  // Appliquer les filtres et recharger les données
  useEffect(() => {
    const filters = {
      search: searchTerm || undefined,
      type_contrat: selectedContractType || undefined,
      actif:
        selectedStatus === "actif"
          ? true
          : selectedStatus === "inactif"
          ? false
          : undefined,
    };

    loadEmployees(1, filters);
    setCurrentPage(1);
  }, [searchTerm, selectedContractType, selectedStatus]);

  // Les statistiques sont globales et ne changent pas avec les filtres

  // Calculer les statistiques (utiliser les données de l'Edge Function pour les totaux globaux)
  const activeEmployees = statistics?.statistics?.active_employees || 0;
  const newThisMonth = statistics?.statistics?.new_this_month || 0;
  const retentionRate = statistics?.statistics?.activation_rate || 0;
  const totalEmployeesFromStats = statistics?.statistics?.total_employees || 0;

  // Pagination
  const currentEmployees = filteredEmployees; // Les données viennent déjà paginées de l'API

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const filters = {
      search: searchTerm || undefined,
      type_contrat: selectedContractType || undefined,
      actif:
        selectedStatus === "actif"
          ? true
          : selectedStatus === "inactif"
          ? false
          : undefined,
    };
    loadEmployees(page, filters);
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
      <LoadingSpinner
        fullScreen={true}
        message={
          loading
            ? "Chargement de la session..."
            : isLoading
            ? "Chargement des employés..."
            : "Chargement des statistiques..."
        }
      />
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion des Employés
            </h1>
          </div>
          <button
            onClick={loadCurrentMonthData}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="Actualiser les données du mois en cours"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-500 ${
                edgeFunctionLoading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {session?.partner?.company_name} -{" "}
          {statisticsLoading ? "..." : totalEmployeesFromStats} employés total
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total des employés"
          value={statisticsLoading ? "..." : totalEmployeesFromStats}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Employés actifs"
          value={statisticsLoading ? "..." : activeEmployees}
          total={totalEmployeesFromStats}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Employés inactifs"
          value={
            statisticsLoading
              ? "..."
              : statistics?.statistics?.inactive_employees || 0
          }
          total={totalEmployeesFromStats}
          icon={TrendingUp}
          color="yellow"
        />
        <StatCard
          title="Taux d'activation"
          value={statisticsLoading ? "..." : `${retentionRate}%`}
          icon={AlertTriangle}
          color="purple"
        />
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative bg-[var(--zalama-card)]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-hidden">
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
            <tbody className="bg-white dark:bg-[var(--zalama-card)] divide-y divide-gray-200 dark:divide-gray-700">
              {currentEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-2 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {employee.prenom.charAt(0)}
                            {employee.nom.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {employee.prenom} {employee.nom}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {employee.email}
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
                  <td className="px-2 py-4">
                    <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {employee.type_contrat}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="truncate">
                      {employee.salaire_net
                        ? formatSalary(employee.salaire_net)
                        : "Non défini"}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="truncate">
                      {employee.date_embauche
                        ? formatDate(employee.date_embauche)
                        : "Non définie"}
                    </div>
                  </td>
                  <td className="px-2 py-4">
                    <span
                      className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full ${
                        employee.actif
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {employee.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => openViewModal(employee)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-[var(--zalama-card)] px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[var(--zalama-card)] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[var(--zalama-card)] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Affichage de{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * employeesPerPage + 1}
                  </span>{" "}
                  à{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * employeesPerPage, totalEmployees)}
                  </span>{" "}
                  sur <span className="font-medium">{totalEmployees}</span>{" "}
                  employés
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-[var(--zalama-card)] border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de visualisation des détails */}
      {isViewModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Détails de l'employé
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {selectedEmployee.prenom} {selectedEmployee.nom}
                </p>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Prénom
                    </label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedEmployee.prenom}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Nom
                    </label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedEmployee.nom}
                    </p>
                  </div>
                </div>
                {/* Informations personnelles */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Informations Personnelles
                  </h3>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
                          {selectedEmployee.email || "Non défini"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Téléphone</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedEmployee.telephone || "Non défini"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Genre</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedEmployee.genre || "Non défini"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Statut</p>
                        <span
                          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            selectedEmployee.actif
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {selectedEmployee.actif ? "Actif" : "Inactif"}
                        </span>
                      </div>
                    </div>
                    {selectedEmployee.adresse && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Adresse</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedEmployee.adresse}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Informations professionnelles */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Informations Professionnelles
                  </h3>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Poste</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedEmployee.poste}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type de contrat</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedEmployee.type_contrat}
                        </p>
                      </div>
                    </div>
                    {selectedEmployee.role && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rôle</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {selectedEmployee.role}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date d'embauche</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedEmployee.date_embauche
                          ? formatDate(selectedEmployee.date_embauche)
                          : "Non définie"}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Informations financières */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Informations Financières
                  </h3>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Salaire net</p>
                        <p className="text-lg font-bold text-green-600">
                          {selectedEmployee.salaire_net
                            ? formatSalary(selectedEmployee.salaire_net)
                            : "Non défini"}
                        </p>
                      </div>
                      {selectedEmployee.salaire_restant !== undefined && selectedEmployee.salaire_restant !== null && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Salaire restant</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatSalary(selectedEmployee.salaire_restant)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Informations système */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Informations Système
                  </h3>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Date de création</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(selectedEmployee.created_at)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dernière modification</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(selectedEmployee.updated_at)}
                        </p>
                      </div>
                    </div>
                    {selectedEmployee.user_id && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Utilisateur</p>
                        <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                          {selectedEmployee.user_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={closeViewModal}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
