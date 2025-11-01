"use client";

import React, { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import { useEdgeAuth } from "@/hooks/useEdgeAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Types d'avis disponibles
const avisCategories = [
  { id: "service", label: "Service" },
  { id: "application", label: "Application" },
  { id: "support", label: "Support" },
  { id: "general", label: "Général" },
];

// Types pour les données
type Avis = {
  id: string;
  note: number;
  commentaire?: string;
  date_avis: string;
  approuve: boolean;
  created_at: string;
  updated_at: string;
  employee_id: string;
  partner_id: string;
  type_retour?: string;
  employee?: {
    id: string;
    nom: string;
    prenom: string;
    poste?: string;
    email?: string;
    telephone?: string;
    photo_url?: string;
  };
};

type Employee = {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  nom_complet: string;
  photo_url?: string;
};

// Type étendu pour inclure les données des employés
interface AvisWithEmployee extends Avis {
  employees?: Employee;
}

export default function AvisPage() {
  const { session, loading } = useEdgeAuth();
  const router = useRouter();
  const [avis, setAvis] = useState<AvisWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedAvis, setSelectedAvis] = useState<AvisWithEmployee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Charger les données
  useEffect(() => {
    if (session?.access_token) {
      loadAllData();
    }
  }, [session?.access_token]);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([loadAvis(), loadEmployees()]);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadAvis = async () => {
    try {
      console.log('🔄 Chargement des avis...');
      const response = await fetch("/api/proxy/avis", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des avis");
      }

      const data = await response.json();
      console.log('📊 Données reçues:', data);
      if (data.success) {
        // L'API retourne les avis dans data.data.avis
        const avisData = data.data?.avis || data.data || [];
        setAvis(Array.isArray(avisData) ? avisData : []);
        console.log('✅ Avis chargés:', avisData.length, 'avis');
      } else {
        throw new Error(data.message || "Erreur lors du chargement des avis");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des avis:", error);
      toast.error("Erreur lors du chargement des avis");
      setAvis([]); // S'assurer que avis reste un tableau vide en cas d'erreur
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch("/api/proxy/employees", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des employés");
      }

      const data = await response.json();
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des employés:", error);
    }
  };

  // Filtrer les avis
  const filteredAvis = (avis || []).filter((avis) => {
    const matchesSearch = 
      avis.employee?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avis.employee?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avis.commentaire?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || avis.type_retour === selectedCategory;
    const matchesEmployee = selectedEmployee === "all" || avis.employee_id === selectedEmployee;

    return matchesSearch && matchesCategory && matchesEmployee;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAvis.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAvis = filteredAvis.slice(startIndex, startIndex + itemsPerPage);

  // Statistiques
  const totalAvis = (avis || []).length;
  const averageNote = (avis || []).length > 0 ? (avis || []).reduce((sum, avis) => sum + avis.note, 0) / (avis || []).length : 0;
  const approvedAvis = (avis || []).filter(avis => avis.approuve).length;
  const pendingAvis = (avis || []).filter(avis => !avis.approuve).length;

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

  // Gérer le clic en dehors du menu des filtres
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    <div className="p-6 space-y-6">
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

      {/* Filtres et recherche */}
      <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg p-6 mb-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par employé ou commentaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--zalama-border)] rounded-lg bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
            />
          </div>

          {/* Boutons de filtres */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={filterMenuRef}>
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--zalama-border)] rounded-lg bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors backdrop-blur-sm"
              >
                <Filter className="w-4 h-4" />
                Filtres
                <ChevronDown className="w-4 h-4" />
            </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--zalama-bg-darker)] border border-[var(--zalama-border)] rounded-lg shadow-lg z-10 backdrop-blur-sm">
                  <div className="p-4 space-y-4">
                    {/* Filtre par catégorie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Catégorie
                      </label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                      >
                        <option value="all">Toutes les catégories</option>
                        {avisCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                        </option>
                      ))}
                    </select>
                </div>

                    {/* Filtre par employé */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Employé
                      </label>
                  <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--zalama-border)] rounded-md bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm"
                      >
                        <option value="all">Tous les employés</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                            {employee.prenom} {employee.nom}
                      </option>
                    ))}
                  </select>
                </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-2 pt-2">
                  <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setSelectedEmployee("all");
                          setSearchTerm("");
                        }}
                        className="flex-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Réinitialiser
                  </button>
                  <button
                        onClick={() => setShowFilters(false)}
                        className="flex-1 px-3 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                  >
                    Appliquer
                  </button>
                    </div>
                </div>
              </div>
            )}
          </div>

          <button
              onClick={loadAllData}
              disabled={loadingData}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingData ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Actualiser
          </button>
          </div>
        </div>
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
        <div className="bg-transparent border border-[var(--zalama-border)] rounded-lg shadow overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-[var(--zalama-card)] border-b border-[var(--zalama-border)] border-opacity-20">
                <tr>
                  <th className="w-1/4 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Employé
                  </th>
                  <th className="w-1/6 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="w-1/4 px-3 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Commentaire
                  </th>
                  <th className="w-1/8 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="w-1/8 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="w-1/8 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="w-1/12 px-3 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
                          {(avis.employee as any)?.photo_url ? (
                            <Image
                              src={(avis.employee as any).photo_url}
                              alt={`${avis.employee?.prenom} ${avis.employee?.nom}`}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                              {avis.employee?.prenom?.charAt(0)}
                              {avis.employee?.nom?.charAt(0)}
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
                        variant={avis.note >= 3 ? "success" : "error"} 
                        className="text-xs"
                      >
                        {avis.note >= 3 ? "Positif" : "Négatif"}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <Badge variant={getApprovalBadgeVariant(avis.approuve)} className="text-xs">
                        {avis.approuve ? "Approuvé" : "En attente"}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(avis.date_avis || avis.created_at)}
                    </td>
                    <td className="px-3 py-4 text-center">
              <button
                onClick={() => {
                          setSelectedAvis(avis);
                          setShowDetailModal(true);
                }}
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
                    {(selectedAvis.employee as any)?.photo_url ? (
                      <Image
                        src={(selectedAvis.employee as any).photo_url}
                        alt={`${selectedAvis.employee?.prenom} ${selectedAvis.employee?.nom}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                        {selectedAvis.employee?.prenom?.charAt(0)}
                        {selectedAvis.employee?.nom?.charAt(0)}
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
                      variant={selectedAvis.note >= 3 ? "success" : "error"} 
                      className="text-xs"
                    >
                      {selectedAvis.note >= 3 ? "Positif" : "Négatif"}
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
                      {formatDate(selectedAvis.date_avis || selectedAvis.created_at)}
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