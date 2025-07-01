"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Filter, Mail, Phone, Eye, Download, ChevronDown, Building2, Calendar, Clock, Plus, Edit, Trash2 } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { employeeService } from '@/lib/services';
import type { Employee } from '@/lib/supabase';

// Fonction pour formatter les dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Fonction pour formatter les montants
const formatSalary = (salary: number) => {
  return `${salary.toLocaleString()} GNF`;
};

export default function EmployesPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  
  // États pour la gestion des employés
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedContractType, setSelectedContractType] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isContractDropdownOpen, setIsContractDropdownOpen] = useState(false);

  // Charger les données des employés
  useEffect(() => {
    if (!loading && session?.partner) {
      loadEmployees();
    }
  }, [loading, session?.partner]);

  const loadEmployees = async () => {
    if (!session?.partner) return;
    
    setIsLoading(true);
    try {
      // Utiliser des données de test réalistes directement
      const mockEmployees = [
        {
          id: '1',
          partner_id: session.partner.id,
          nom: 'Diallo',
          prenom: 'Mamadou',
          email: 'mamadou.diallo@' + session.partner.nom.toLowerCase().replace(/\s+/g, '') + '.com',
          telephone: '+224 622 12 34 56',
          poste: 'Développeur',
          salaire_net: 2500000,
          genre: 'Homme',
          type_contrat: 'CDI',
          date_embauche: '2023-01-15',
          actif: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          partner_id: session.partner.id,
          nom: 'Bah',
          prenom: 'Aissatou',
          email: 'aissatou.bah@' + session.partner.nom.toLowerCase().replace(/\s+/g, '') + '.com',
          telephone: '+224 622 34 56 78',
          poste: 'Designer',
          salaire_net: 2000000,
          genre: 'Femme',
          type_contrat: 'CDI',
          date_embauche: '2023-03-20',
          actif: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          partner_id: session.partner.id,
          nom: 'Sow',
          prenom: 'Ousmane',
          email: 'ousmane.sow@' + session.partner.nom.toLowerCase().replace(/\s+/g, '') + '.com',
          telephone: '+224 622 56 78 90',
          poste: 'Formateur',
          salaire_net: 1800000,
          genre: 'Homme',
          type_contrat: 'CDD',
          date_embauche: '2023-06-10',
          actif: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          partner_id: session.partner.id,
          nom: 'Camara',
          prenom: 'Fatoumata',
          email: 'fatoumata.camara@' + session.partner.nom.toLowerCase().replace(/\s+/g, '') + '.com',
          telephone: '+224 622 78 90 12',
          poste: 'Comptable',
          salaire_net: 2200000,
          genre: 'Femme',
          type_contrat: 'CDI',
          date_embauche: '2022-11-05',
          actif: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          partner_id: session.partner.id,
          nom: 'Barry',
          prenom: 'Ibrahima',
          email: 'ibrahima.barry@' + session.partner.nom.toLowerCase().replace(/\s+/g, '') + '.com',
          telephone: '+224 622 90 12 34',
          poste: 'Commercial',
          salaire_net: 1900000,
          genre: 'Homme',
          type_contrat: 'CDI',
          date_embauche: '2023-02-01',
          actif: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ] as any[];

      setEmployees(mockEmployees);
      setFilteredEmployees(mockEmployees);

    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
      toast.error('Erreur lors du chargement des employés');
    } finally {
      setIsLoading(false);
    }
  };

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [loading, session, router]);

  // Filtrer les employés en fonction des critères de recherche
  useEffect(() => {
    let filtered = employees;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(employee => 
        employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.poste.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par genre
    if (selectedGender) {
      filtered = filtered.filter(employee => employee.genre === selectedGender);
    }

    // Filtre par type de contrat
    if (selectedContractType) {
      filtered = filtered.filter(employee => employee.type_contrat === selectedContractType);
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [employees, searchTerm, selectedGender, selectedContractType]);

  // Pagination
  const employeesPerPage = 8;
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  // Calculer les statistiques
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.actif).length;
  const newThisMonth = employees.filter(emp => {
    const hireDate = new Date(emp.date_embauche || '');
    const now = new Date();
    return hireDate.getMonth() === now.getMonth() && hireDate.getFullYear() === now.getFullYear();
  }).length;
  const retentionRate = totalEmployees > 0 ? ((activeEmployees / totalEmployees) * 100).toFixed(1) : '0';

  // Ouvrir le modal de visualisation des détails
  const openViewModal = (employee: Employee) => {
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
    
    const headers = ["ID", "Nom", "Prénom", "Genre", "Email", "Téléphone", "Poste", "Type de contrat", "Salaire net", "Date d'embauche", "Statut"];
    const csvData = [
      headers.join(","),
      ...employees.map(employee => [
        employee.id,
        employee.nom,
        employee.prenom,
        employee.genre,
        employee.email || '',
        employee.telephone || '',
        employee.poste,
        employee.type_contrat,
        employee.salaire_net || 0,
        employee.date_embauche || '',
        employee.actif ? 'Actif' : 'Inactif'
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `employes_${session.partner.nom}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export CSV réussi');
  };

  // Si en cours de chargement, afficher un état de chargement
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des employés
          </h1>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
              {session?.partner?.nom} - {totalEmployees} employés
            </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadEmployees}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Taux de rétention"
          value={`${retentionRate}%`}
          icon={Building2}
          color="purple"
        />
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
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
                    setSelectedGender('Homme');
                    setIsGenderDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Homme
                </button>
                <button
                  onClick={() => {
                    setSelectedGender('Femme');
                    setIsGenderDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Femme
                </button>
                <button
                  onClick={() => {
                    setSelectedGender('Autre');
                    setIsGenderDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Autre
                </button>
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
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setSelectedContractType(null);
                    setIsContractDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Tous les contrats
                </button>
                <button
                  onClick={() => {
                    setSelectedContractType('CDI');
                    setIsContractDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  CDI
                </button>
                <button
                  onClick={() => {
                    setSelectedContractType('CDD');
                    setIsContractDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  CDD
                </button>
                <button
                  onClick={() => {
                    setSelectedContractType('Consultant');
                    setIsContractDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  Consultant
                </button>
                <button
                  onClick={() => {
                    setSelectedContractType('Stage');
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Poste
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type de contrat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Salaire net
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date d'embauche
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {employee.prenom.charAt(0)}{employee.nom.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.prenom} {employee.nom}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{employee.poste}</div>
                    {employee.role && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{employee.role}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {employee.type_contrat}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {employee.salaire_net ? formatSalary(employee.salaire_net) : 'Non défini'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {employee.date_embauche ? formatDate(employee.date_embauche) : 'Non définie'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.actif 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {employee.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openViewModal(employee)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
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
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Affichage de <span className="font-medium">{indexOfFirstEmployee + 1}</span> à{' '}
                  <span className="font-medium">{Math.min(indexOfLastEmployee, filteredEmployees.length)}</span> sur{' '}
                  <span className="font-medium">{filteredEmployees.length}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom complet</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.prenom} {selectedEmployee.nom}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Genre</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedEmployee.genre}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedEmployee.email || 'Non défini'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedEmployee.telephone || 'Non défini'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Poste</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedEmployee.poste}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type de contrat</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedEmployee.type_contrat}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Salaire net</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.salaire_net ? formatSalary(selectedEmployee.salaire_net) : 'Non défini'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date d'embauche</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedEmployee.date_embauche ? formatDate(selectedEmployee.date_embauche) : 'Non définie'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedEmployee.actif 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {selectedEmployee.actif ? 'Actif' : 'Inactif'}
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
