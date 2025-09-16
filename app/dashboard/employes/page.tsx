"use client";

import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import StatCard from "@/components/dashboard/StatCard";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
import type { Employee } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  FileDown,
  Search,
  Filter,
  ChevronDown,
  Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Type étendu pour inclure le salaire restant
type EmployeeWithRemainingSalary = Employee & {
  salaire_restant?: number;
  user_id?: string;
};

// Fonction pour formatter les dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Fonction pour formatter les montants
const formatSalary = (salary: number) => {
  return `${salary.toLocaleString()} GNF`;
};

export default function EmployesPage() {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();

  // États pour la gestion des employés
  const [employees, setEmployees] = useState<EmployeeWithRemainingSalary[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<
    EmployeeWithRemainingSalary[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedContractType, setSelectedContractType] = useState<
    string | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeWithRemainingSalary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isContractDropdownOpen, setIsContractDropdownOpen] = useState(false);
  
  // États pour les données Edge Functions (mois en cours)
  const [currentMonthData, setCurrentMonthData] = useState<any>(null);
  const [edgeFunctionLoading, setEdgeFunctionLoading] = useState(false);

  // Charger les données des employés
  useEffect(() => {
    if (!loading && session?.partner) {
      loadEmployees();
      loadCurrentMonthData();
    }
  }, [loading, session?.partner]);

  const loadEmployees = async () => {
    if (!session?.partner) return;

    setIsLoading(true);
    try {
      // Récupérer TOUS les employés pour les statistiques
      const { data: allEmployeesData, error: allError } = await supabase
        .from("employees")
        .select("*")
        .eq("partner_id", session.partner.id)
        .order("created_at", { ascending: false });

      if (allError) {
        console.error(
          "Erreur lors du chargement de tous les employés:",
          allError
        );
        toast.error("Erreur lors du chargement des employés");
        return;
      }

      // Récupérer seulement les employés avec user_id non vide pour la liste
      const { data: employeesWithUserId, error: userError } = await supabase
        .from("employees")
        .select("*")
        .eq("partner_id", session.partner.id)
        .not("user_id", "is", null)
        .order("created_at", { ascending: false });

      if (userError) {
        console.error(
          "Erreur lors du chargement des employés avec user_id:",
          userError
        );
        toast.error("Erreur lors du chargement des employés");
        return;
      }

      // Traiter TOUS les employés pour les statistiques
      const allEmployeesWithRemainingSalary = await Promise.all(
        (allEmployeesData || []).map(async (employee) => {
          try {
            // Récupérer tous les remboursements (payés et en attente) de cet employé
            const { data: remboursements, error: rembError } = await supabase
              .from("remboursements")
              .select("montant_total_remboursement")
              .eq("employe_id", employee.id)
              .in("statut", ["PAYE", "EN_ATTENTE"]);

            if (rembError) {
              console.error("Erreur récupération remboursements:", rembError);
              return {
                ...employee,
                salaire_restant: employee.salaire_net || 0,
              };
            }

            // Calculer le salaire restant
            const totalRemboursements = (remboursements || []).reduce(
              (sum, remb) => {
                return sum + Number(remb.montant_total_remboursement || 0);
              },
              0
            );

            const salaireRestant = Math.max(
              0,
              (employee.salaire_net || 0) - totalRemboursements
            );

            return {
              ...employee,
              salaire_restant: salaireRestant,
            };
          } catch (error) {
            console.error("Erreur calcul salaire restant:", error);
            return {
              ...employee,
              salaire_restant: employee.salaire_net || 0,
            };
          }
        })
      );

      // Traiter seulement les employés avec user_id pour la liste
      const employeesWithUserIdAndSalary = await Promise.all(
        (employeesWithUserId || []).map(async (employee) => {
          try {
            // Récupérer tous les remboursements (payés et en attente) de cet employé
            const { data: remboursements, error: rembError } = await supabase
              .from("remboursements")
              .select("montant_total_remboursement")
              .eq("employe_id", employee.id)
              .in("statut", ["PAYE", "EN_ATTENTE"]);

            if (rembError) {
              console.error("Erreur récupération remboursements:", rembError);
              return {
                ...employee,
                salaire_restant: employee.salaire_net || 0,
              };
            }

            // Calculer le salaire restant
            const totalRemboursements = (remboursements || []).reduce(
              (sum, remb) => {
                return sum + Number(remb.montant_total_remboursement || 0);
              },
              0
            );

            const salaireRestant = Math.max(
              0,
              (employee.salaire_net || 0) - totalRemboursements
            );

            return {
              ...employee,
              salaire_restant: salaireRestant,
            };
          } catch (error) {
            console.error("Erreur calcul salaire restant:", error);
            return {
              ...employee,
              salaire_restant: employee.salaire_net || 0,
            };
          }
        })
      );

      // Stocker tous les employés pour les statistiques
      setEmployees(allEmployeesWithRemainingSalary);
      // Stocker seulement les employés avec user_id pour la liste
      setFilteredEmployees(employeesWithUserIdAndSalary);
    } catch (error) {
      console.error("Erreur lors du chargement des employés:", error);
      toast.error("Erreur lors du chargement des employés");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données du mois en cours via Edge Functions
  const loadCurrentMonthData = async () => {
    if (!session?.access_token) return;

    setEdgeFunctionLoading(true);
    try {
      edgeFunctionService.setAccessToken(session.access_token);
      const dashboardData = await edgeFunctionService.getDashboardData();

      if (dashboardData.error) {
        console.error("Erreur Edge Function:", dashboardData.error);
        toast.error("Erreur lors du chargement des données du mois en cours");
        return;
      }

                // Les données sont dans dashboardData.data selon la réponse Edge Function
                const data = dashboardData.data || dashboardData;
                setCurrentMonthData(data);
                
                // Mettre à jour les données locales avec les données du mois en cours
                if (data.employees) {
                    setEmployees(data.employees);
                    setFilteredEmployees(data.employees.filter((emp: any) => emp.user_id));
                }

      console.log("Données des employés du mois en cours chargées:", dashboardData);
      toast.success("Données des employés du mois en cours mises à jour avec succès");
    } catch (error) {
      console.error("Erreur lors du chargement des données Edge Functions:", error);
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

  // Filtrer les employés en fonction des critères de recherche
  useEffect(() => {
    // Commencer avec les employés qui ont un user_id (déjà filtrés dans loadEmployees)
    let filtered = employees.filter((employee) => employee.user_id);

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (employee) =>
          employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.poste.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par genre
    if (selectedGender) {
      filtered = filtered.filter(
        (employee) => employee.genre === selectedGender
      );
    }

    // Filtre par type de contrat
    if (selectedContractType) {
      filtered = filtered.filter(
        (employee) => employee.type_contrat === selectedContractType
      );
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [employees, searchTerm, selectedGender, selectedContractType]);

  // Pagination
  const employeesPerPage = 8;
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );

  // Calculer les statistiques - utiliser les données Edge Function en priorité
  const totalEmployees = currentMonthData?.statistics?.total_employees || 
    currentMonthData?.partner_info?.employees_count || 
    employees.length;
  
  const activeEmployees = currentMonthData?.statistics?.active_employees || 
    currentMonthData?.partner_info?.active_employees_count || 
    employees.filter((emp) => emp.actif).length;
  
  const newThisMonth = employees.filter((emp) => {
    const createdDate = new Date(emp.created_at || "");
    const now = new Date();
    return (
      emp.user_id && // Vérifier que l'employé a un user_id
      createdDate.getMonth() === now.getMonth() &&
      createdDate.getFullYear() === now.getFullYear()
    );
  }).length;
  
  const retentionRate =
    totalEmployees > 0
      ? ((activeEmployees / totalEmployees) * 100).toFixed(1)
      : "0";

  // Ouvrir le modal de visualisation des détails
  const openViewModal = (employee: EmployeeWithRemainingSalary) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };

  // Fermer le modal de visualisation
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedEmployee(null);
  };

  // Exporter les données au format CSV
  const handleExportCSV = () => {
    if (!session?.partner) return;

    // Fonction pour nettoyer les données
    const cleanData = (data: any) => {
      if (data === null || data === undefined) return "";
      return String(data).replace(/"/g, '""').trim();
    };

    // Fonction pour formater les montants
    const formatAmount = (amount: number | null | undefined) => {
      if (!amount) return "0";
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    // Fonction pour formater les dates
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "";
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR");
      } catch {
        return "";
      }
    };

    // En-têtes
    const headers = [
      "ID Employe",
      "Nom",
      "Prenom",
      "Genre",
      "Email",
      "Telephone",
      "Poste",
      "Role",
      "Type de contrat",
      "Salaire net (GNF)",
      "Salaire restant (GNF)",
      "Date embauche",
      "Statut",
      "Adresse",
      "Date creation",
    ];

    // Données
    const rows = employees.map((employee) => [
      cleanData(employee.id),
      cleanData(employee.nom),
      cleanData(employee.prenom),
      cleanData(employee.genre),
      cleanData(employee.email),
      cleanData(employee.telephone),
      cleanData(employee.poste),
      cleanData(employee.role),
      cleanData(employee.type_contrat),
      formatAmount(employee.salaire_net),
      formatAmount(employee.salaire_restant),
      formatDate(employee.date_embauche),
      employee.actif ? "Actif" : "Inactif",
      cleanData(employee.adresse),
      formatDate(employee.created_at),
    ]);

    // Créer le contenu CSV
    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");

    // Créer le blob avec l'encodage UTF-8 BOM pour Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8",
    });

    // Télécharger le fichier
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `employes_${session.partner.company_name}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Export CSV réussi - ${employees.length} employés exportés`);
  };

  // Gérer le changement de page
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Si en cours de chargement, afficher un état de chargement
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {edgeFunctionLoading ? "Chargement des données du mois en cours..." : "Chargement des employés..."}
          </p>
        </div>
      </div>
    );
  }

  // Si pas de partenaire, afficher un message d'erreur
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

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des employés
            </h1>
            {currentMonthData && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
                Données du mois en cours
              </span>
            )}
            <button
              onClick={loadCurrentMonthData}
              disabled={edgeFunctionLoading}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Actualiser les données du mois en cours"
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${edgeFunctionLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {session?.partner?.company_name} - {totalEmployees} employés total (
            {filteredEmployees.length} avec compte)
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadEmployees}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total des employés"
          value={totalEmployees}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Employés actifs"
          value={activeEmployees}
          total={totalEmployees}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Nouveaux ce mois"
          value={newThisMonth}
          icon={TrendingUp}
          color="yellow"
        />
        <StatCard
          title="Taux de rétention"
          value={`${retentionRate}%`}
          icon={AlertTriangle}
          color="purple"
        />
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20  rounded-lg shadow p-6">
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
                className="w-full pl-10 pr-4 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent  dark:text-white"
              />
            </div>
          </div>

          {/* Filtre par genre */}
          <div className="relative">
            <button
              onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              {selectedGender || "Genre"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {isGenderDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[var(--zalama-card)] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setSelectedGender(null);
                    setIsGenderDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Tous les genres
                </button>
                <button
                  onClick={() => {
                    setSelectedGender("Homme");
                    setIsGenderDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Homme
                </button>
                <button
                  onClick={() => {
                    setSelectedGender("Femme");
                    setIsGenderDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Femme
                </button>
                {/* <button
                  onClick={() => {
                    setSelectedGender("Autre");
                    setIsGenderDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Autre
                </button> */}
              </div>
            )}
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
                  Salaire restant
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
                  <td className="px-2 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <div className="truncate">
                      {employee.salaire_restant
                        ? formatSalary(employee.salaire_restant)
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
                    {indexOfFirstEmployee + 1}
                  </span>{" "}
                  à{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastEmployee, filteredEmployees.length)}
                  </span>{" "}
                  sur{" "}
                  <span className="font-medium">
                    {filteredEmployees.length}
                  </span>{" "}
                  employés avec compte
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Détails de l'employé
                </h3>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom complet
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.prenom} {selectedEmployee.nom}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Genre
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.genre}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.email || "Non défini"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Téléphone
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.telephone || "Non défini"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Poste
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.poste}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type de contrat
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.type_contrat}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Salaire net
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.salaire_net
                      ? formatSalary(selectedEmployee.salaire_net)
                      : "Non défini"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Salaire restant
                  </label>
                  <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedEmployee.salaire_restant
                      ? formatSalary(selectedEmployee.salaire_restant)
                      : "Non défini"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date d'embauche
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.date_embauche
                      ? formatDate(selectedEmployee.date_embauche)
                      : "Non définie"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Statut
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedEmployee.actif
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {selectedEmployee.actif ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
