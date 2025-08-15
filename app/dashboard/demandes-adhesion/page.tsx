"use client";

import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { edgeFunctionService } from "@/lib/edgeFunctionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  Loader2,
  Search,
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
  }, [employees, searchTerm, filterStatus]);

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
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Chargement des employés...</span>
        </div>
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
      <Card className="dark:bg-[var(--zalama-card)]">
        <CardContent className="p-6 ">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre par statut */}
            <div>
              {/* <Label
                htmlFor="status-filter"
                className="text-sm font-medium text-gray-400"
              >
                Statut
              </Label> */}
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 bg-[var(--zalama-card)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les employés</option>
                <option value="active">Employés actifs</option>
                <option value="inactive">Employés inactifs</option>
              </select>
            </div>

            {/* Statistiques */}
            <div className="flex items-center justify-end">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {filteredEmployees.length} sur {employees.length} employés
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des employés */}
      {filteredEmployees.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun employé sans compte
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tous vos employés ont déjà un compte ZaLaMa.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="hover:shadow-lg transition-shadow dark:bg-[var(--zalama-card)]"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                        {employee.prenom.charAt(0)}
                        {employee.nom.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {employee.prenom} {employee.nom}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={employee.actif ? "default" : "secondary"}
                        >
                          {employee.actif ? "Actif" : "Inactif"}
                        </Badge>
                        <Badge variant="outline">{employee.type_contrat}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCreateAccount(employee.id)}
                    disabled={
                      creatingAccount === employee.id || !employee.email
                    }
                    className={`${
                      !employee.email
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                    title={
                      !employee.email ? "Email requis pour créer un compte" : ""
                    }
                  >
                    {creatingAccount === employee.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Créer le compte
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Informations de contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {employee.email || "Non renseigné"}
                      </div>
                      <div className="text-xs text-gray-500">Email</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {employee.poste}
                      </div>
                      <div className="text-xs text-gray-500">Poste</div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Informations professionnelles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(employee.date_embauche)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Date d'embauche
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatSalary(employee.salaire_net)}
                      </div>
                      <div className="text-xs text-gray-500">Salaire net</div>
                    </div>
                  </div>
                </div>

                {employee.date_expiration && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-400" />
                      <div>
                        <div className="text-sm font-medium text-orange-600">
                          Expire le {formatDate(employee.date_expiration)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Contrat à durée déterminée
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Date d'ajout */}
                <div className="text-xs text-gray-500">
                  Ajouté le {formatDate(employee.created_at)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
