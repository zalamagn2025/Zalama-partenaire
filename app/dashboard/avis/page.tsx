"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Star,
  Search,
  Filter,
  Download,
  Calendar,
  ThumbsUp,
  MessageSquare,
  BarChart2,
  RefreshCw,
  Eye,
  User,
  Mail,
  Phone,
  Hash,
  MapPin,
  UserCheck,
  X,
  ChevronDown,
  Clock,
  Trash2,
} from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { 
  useAvis, 
  useAvisStatistics,
  useApproveAvis,
  useRejectAvis,
  useDeleteAvis,
  type Avis as AvisType
} from "@/hooks/useAvis";
import { usePartnerEmployees } from "@/hooks/usePartnerEmployee";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Types d'avis disponibles
const avisCategories = [
  { id: "positif", label: "Positif" },
  { id: "negatif", label: "Négatif" },
];

type Employee = {
  id: string;
  nom: string;
  prenom: string;
  poste?: string;
  nom_complet?: string;
  photo_url?: string;
  photoUrl?: string;
  email?: string;
  telephone?: string;
};

// Type étendu pour inclure les données des employés (si disponibles)
type AvisWithEmployee = AvisType & {
  employee?: Employee;
  employee_id?: string;
};

export default function AvisPage() {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedAvis, setSelectedAvis] = useState<AvisWithEmployee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Hooks pour les mutations
  const approveAvisMutation = useApproveAvis();
  const rejectAvisMutation = useRejectAvis();
  const deleteAvisMutation = useDeleteAvis();

  // Utiliser les hooks pour récupérer les données
  const { data: avisResponse, isLoading: loadingAvis, refetch: refetchAvis } = useAvis({
    userId: selectedEmployee !== 'all' ? selectedEmployee : undefined,
    typeRetour: selectedCategory !== 'all' ? (selectedCategory as 'positif' | 'negatif') : undefined,
    limit: itemsPerPage,
    page: currentPage,
      });

  const { data: statisticsResponse } = useAvisStatistics();
  const { data: employeesResponse } = usePartnerEmployees({
    limit: 1000, // Récupérer tous les employés pour le filtre
  });

  // Extraire les données
  const avisRaw = (avisResponse?.data || []) as AvisWithEmployee[];
  const employees = (employeesResponse?.data || employeesResponse?.employees || []) as Employee[];
  
  // Enrichir les avis avec les données des employés en utilisant userId
  const avis = avisRaw.map(avisItem => {
    // Chercher l'employé par userId ou employee_id
    const userId = (avisItem as any).userId || (avisItem as any).employee_id;
    if (userId) {
      const employee = employees.find(emp => emp.id === userId);
      if (employee) {
        return {
          ...avisItem,
          employee: {
            ...employee,
            photo_url: employee.photo_url || employee.photoUrl,
          }
        };
      }
    }
    return avisItem;
  }) as AvisWithEmployee[];
  
  const loadingData = loadingAvis;
  const totalAvisCount = avisResponse?.total || 0;
  const totalPages = avisResponse?.totalPages || Math.ceil(totalAvisCount / itemsPerPage);

  // Filtrer les avis côté client (recherche uniquement, les autres filtres sont gérés par l'API)
  const filteredAvis = (avis || []).filter((avis) => {
    const matchesSearch = 
      avis.employee?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avis.employee?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avis.commentaire?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination côté serveur - les données sont déjà paginées
  const currentAvis = filteredAvis;

  // Fonctions pour gérer les actions
  const handleApprove = async (id: string) => {
    try {
      await approveAvisMutation.mutateAsync(id);
      toast.success("Avis approuvé avec succès");
      refetchAvis();
    } catch (error) {
      toast.error("Erreur lors de l'approbation de l'avis");
      console.error(error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectAvisMutation.mutateAsync(id);
      toast.success("Avis rejeté avec succès");
      refetchAvis();
    } catch (error) {
      toast.error("Erreur lors du rejet de l'avis");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) {
      return;
    }
    try {
      await deleteAvisMutation.mutateAsync(id);
      toast.success("Avis supprimé avec succès");
      refetchAvis();
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'avis");
      console.error(error);
    }
  };

  // Statistiques - utiliser les statistiques de l'API si disponibles, sinon calculer localement
  const statistics = statisticsResponse;
  const totalAvis = statistics?.total || totalAvisCount || avis.length;
  const averageNote = statistics?.moyenneNote || (avis.length > 0 ? avis.reduce((sum, a) => sum + a.note, 0) / avis.length : 0);
  const approvedAvis = statistics?.avisApprouves || avis.filter(a => a.approuve).length;
  const pendingAvis = statistics?.avisEnAttente || avis.filter(a => !a.approuve).length;

  // Fonction pour obtenir la couleur du badge selon la note
  const getNoteBadgeVariant = (note: number) => {
    if (note >= 4) return "success";
    if (note >= 3) return "warning";
    return "error";
  };

  // Fonction pour obtenir la couleur du badge d'approbation
  const getApprovalBadgeVariant = (approuve: boolean) => {
    return approuve ? "success" : "warning";
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fonction pour afficher les étoiles
  const renderStars = (note: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < note ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };


  if (loading || loadingData) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Skeleton pour les statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-32"></div>
          ))}
        </div>

        {/* Skeleton pour les filtres */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-20"></div>

        {/* Skeleton pour le tableau des avis */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
            </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Avis */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-5 border border-blue-200 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <Badge variant="info" className="text-xs">Total</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {totalAvis}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Total Avis
            </p>
          </div>
        </div>

        {/* Note Moyenne */}
        <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-5 border border-yellow-200 dark:border-yellow-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <Badge variant="warning" className="text-xs">Moyenne</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {averageNote.toFixed(1)}
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              Note Moyenne
            </p>
          </div>
        </div>

        {/* Avis Approuvés */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-5 border border-green-200 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <ThumbsUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <Badge variant="success" className="text-xs">Approuvés</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {approvedAvis}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Avis Approuvés
            </p>
          </div>
        </div>

        {/* En Attente */}
        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-lg p-5 border border-orange-200 dark:border-orange-800/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <Badge className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">En attente</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {pendingAvis}
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              En Attente
            </p>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 mb-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher par employé ou commentaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow overflow-hidden backdrop-blur-sm mb-6">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Filtres avancés
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 border border-orange-300 dark:border-orange-600 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                {showFilters ? "Masquer" : "Afficher"}
              </button>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedEmployee("all");
                  setSearchTerm("");
                }}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => {
                  refetchAvis();
                  toast.success("Données actualisées");
                }}
                disabled={loadingData}
                className="px-3 py-1 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                {loadingData ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : null}
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {/* Filtre par catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1); // Réinitialiser la pagination
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">Tous les types</option>
                {avisCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par employé */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employé
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  setCurrentPage(1); // Réinitialiser la pagination
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">Tous les employés</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.prenom} {employee.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tableau des avis */}
      {loadingData ? (
        <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg p-8 backdrop-blur-sm">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      ) : filteredAvis.length === 0 ? (
        <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg p-8 text-center backdrop-blur-sm">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun avis trouvé
              </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Aucun avis ne correspond aux critères de recherche.
          </p>
        </div>
      ) : (
        <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg shadow overflow-hidden backdrop-blur-sm w-full">
          <div className="overflow-x-auto w-full" style={{ maxWidth: '100%' }}>
            <table className="w-full dark:divide-gray-700" style={{ minWidth: '800px' }}>
              <thead className="bg-gray-50 dark:bg-[var(--zalama-card)] border-b border-[var(--zalama-border)] border-opacity-20">
                <tr>
                  <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[180px]">
                    Employé
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                    Note
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px]">
                    Commentaire
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                    Catégorie
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-24">
                    Statut
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-28 whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[var(--zalama-border)]">
                {currentAvis.map((avis) => (
                  <tr
                    key={avis.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {avis.employee?.photo_url || avis.employee?.photoUrl ? (
                            <Image
                              src={avis.employee.photo_url || avis.employee.photoUrl || ''}
                              alt={`${avis.employee?.prenom} ${avis.employee?.nom}`}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                              {avis.employee?.prenom?.charAt(0) || '?'}
                              {avis.employee?.nom?.charAt(0) || ''}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {avis.employee?.prenom} {avis.employee?.nom}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {avis.employee?.poste || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {renderStars(avis.note)}
                      </div>
                      {/* <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {avis.note}/5
                      </div> */}
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {avis.commentaire || "Aucun commentaire"}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Badge 
                        variant={avis.typeRetour === 'positif' || avis.note >= 3 ? "success" : "error"} 
                        className="text-xs"
                      >
                        {avis.typeRetour === 'positif' ? "Positif" : avis.typeRetour === 'negatif' ? "Négatif" : (avis.note >= 3 ? "Positif" : "Négatif")}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Badge variant={getApprovalBadgeVariant(avis.approuve)} className="text-xs">
                        {avis.approuve ? "Approuvé" : "En attente"}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate((avis as any).dateAvis || (avis as any).date_avis || (avis as any).created_at || '')}
                    </td>
                    <td className="px-3 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
              <button
                onClick={() => {
                          setSelectedAvis(avis);
                          setShowDetailModal(true);
                }}
                        className="group relative p-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        title="Voir les détails"
              >
                        <Eye className="h-3.5 w-3.5" />
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          Voir
                        </div>
              </button>
                        {!avis.approuve && (
                          <button
                            onClick={() => handleApprove(avis.id)}
                            disabled={approveAvisMutation.isPending}
                            className="p-1.5 rounded-full bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approuver"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {avis.approuve && (
                          <button
                            onClick={() => handleReject(avis.id)}
                            disabled={rejectAvisMutation.isPending}
                            className="p-1.5 rounded-full bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Rejeter"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(avis.id)}
                          disabled={deleteAvisMutation.isPending}
                          className="p-1.5 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200 hover:scale-110 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

          {/* Pagination */}
          {filteredAvis.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAvis.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
          </div>
      )}

      {/* Modal de détails */}
      {showDetailModal && selectedAvis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
          <div className="bg-[var(--zalama-bg-darker)] border border-[var(--zalama-border)] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--zalama-border)]/30 flex-shrink-0 bg-gradient-to-r from-[var(--zalama-bg-lighter)] to-[var(--zalama-bg-light)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--zalama-orange)] to-[var(--zalama-orange-accent)] rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    Détails de l'Avis
                  </h2>
                  <p className="text-sm text-[var(--zalama-text-secondary)] mt-1">
                    ID: {selectedAvis.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
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
                    {selectedAvis.employee?.photo_url || selectedAvis.employee?.photoUrl ? (
                      <Image
                        src={selectedAvis.employee.photo_url || selectedAvis.employee.photoUrl || ''}
                        alt={`${selectedAvis.employee?.prenom} ${selectedAvis.employee?.nom}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                        {selectedAvis.employee?.prenom?.charAt(0) || ''}
                        {selectedAvis.employee?.nom?.charAt(0) || ''}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedAvis.employee?.prenom} {selectedAvis.employee?.nom}
                  </h3>
                    <p className="text-[var(--zalama-text-secondary)] text-lg mt-1">
                      {selectedAvis.employee?.poste || "N/A"}
                  </p>
                </div>
                      </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getApprovalBadgeVariant(selectedAvis.approuve)} className="text-sm">
                    {selectedAvis.approuve ? "Approuvé" : "En attente"}
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
                    {selectedAvis.employee?.email || "Non renseigné"}
                    </p>
                  </div>

                {/* Autres informations en grille */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Téléphone */}
                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Téléphone</span>
                      </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedAvis.employee?.telephone ? `+224${selectedAvis.employee.telephone}` : "Non renseigné"}
                    </p>
                    </div>

                  {/* Note */}
                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                        <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Note</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {renderStars(selectedAvis.note)}
                    </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedAvis.note}/5
                      </span>
                  </div>
                </div>

                  {/* Catégorie */}
                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <BarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Catégorie</span>
            </div>
                    <Badge 
                      variant={selectedAvis.typeRetour === 'positif' || selectedAvis.note >= 3 ? "success" : "error"} 
                      className="text-xs"
                    >
                      {selectedAvis.typeRetour === 'positif' ? "Positif" : selectedAvis.typeRetour === 'negatif' ? "Négatif" : (selectedAvis.note >= 3 ? "Positif" : "Négatif")}
                    </Badge>
      </div>

                  {/* Date */}
                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                        <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Date</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate((selectedAvis as any).dateAvis || (selectedAvis as any).date_avis || (selectedAvis as any).created_at || '')}
                    </p>
                  </div>
                </div>

                {/* Commentaire */}
                {selectedAvis.commentaire && (
                  <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg">
                        <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">Commentaire</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedAvis.commentaire}
                    </p>
          </div>
        )}
      </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}