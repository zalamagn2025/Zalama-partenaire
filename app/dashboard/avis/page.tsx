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
} from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import { usePartnerEmployeeAvis } from "@/hooks/usePartnerEmployee";
import { usePartnerEmployees } from "@/hooks/usePartnerEmployee";
import type { PartnerEmployeeAvis } from "@/types/api";
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

// Utiliser les types depuis types/api.ts
type Avis = PartnerEmployeeAvis;
type Employee = {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  nom_complet: string;
  photo_url?: string;
};

// Type étendu pour inclure les données de l'utilisateur
interface AvisWithUser extends Avis {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    photoUrl?: string | null;
  };
  employee?: Employee; // Pour compatibilité
}

export default function AvisPage() {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedAvis, setSelectedAvis] = useState<AvisWithUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Utiliser les hooks pour récupérer les données
  const { data: avisResponse, isLoading: loadingAvis } = usePartnerEmployeeAvis({
    userId: selectedEmployee !== 'all' ? selectedEmployee : undefined,
    typeRetour: selectedCategory !== 'all' ? selectedCategory : undefined,
    limit: itemsPerPage,
    page: currentPage,
      });

  const { data: employeesResponse } = usePartnerEmployees({
    limit: 1000, // Récupérer tous les employés pour le filtre
  });

  // Extraire les données
  const avis = (avisResponse?.data || []) as AvisWithUser[];
  const employees = (employeesResponse?.data || employeesResponse?.employees || []) as Employee[];
  const loadingData = loadingAvis;
  const totalAvisCount = avisResponse?.total || 0;
  const totalPages = Math.ceil(totalAvisCount / itemsPerPage);

  // Filtrer les avis
  const filteredAvis = (avis || []).filter((avis) => {
    const user = (avis as any).user || avis.employee;
    const matchesSearch = 
      user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      avis.commentaire?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || avis.typeRetour === selectedCategory || avis.type_retour === selectedCategory;
    const matchesEmployee = selectedEmployee === "all" || (avis as any).user?.id === selectedEmployee || avis.employee_id === selectedEmployee;

    return matchesSearch && matchesCategory && matchesEmployee;
  });

  // Pagination côté serveur - les données sont déjà paginées
  const currentAvis = filteredAvis;

  // Statistiques
  const totalAvis = totalAvisCount || avis.length;
  const averageNote = avis.length > 0 ? avis.reduce((sum, a) => sum + a.note, 0) / avis.length : 0;
  const approvedAvis = avis.filter(a => a.approuve).length;
  const pendingAvis = avis.filter(a => !a.approuve).length;

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
          <div className="space-y-3">
            {/* En-tête du tableau */}
            <div className="grid grid-cols-7 gap-4 pb-3 border-b border-gray-300 dark:border-gray-700">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-300 dark:bg-gray-700 rounded h-5"
                ></div>
              ))}
            </div>
            {/* Lignes du tableau */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-4 py-3">
                {[...Array(7)].map((_, j) => (
                  <div
                    key={j}
                    className="bg-gray-300 dark:bg-gray-700 rounded h-6"
                  ></div>
                ))}
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

      {/* Recherche */}
      <div className="bg-transparent border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 mb-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par employé ou commentaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                  // Les données sont rechargées automatiquement via les hooks
                  console.log("🔄 Rechargement des données...");
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
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employé
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
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
        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="space-y-3">
            {/* En-tête du tableau */}
            <div className="grid grid-cols-7 gap-4 pb-3 border-b border-gray-300 dark:border-gray-700">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-300 dark:bg-gray-700 rounded h-5"
                ></div>
              ))}
            </div>
            {/* Lignes du tableau */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-4 py-3">
                {[...Array(7)].map((_, j) => (
                  <div
                    key={j}
                    className="bg-gray-300 dark:bg-gray-700 rounded h-6"
                  ></div>
                ))}
              </div>
            ))}
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
                        <div className="w-10 h-10 bg-orange-50/30 dark:bg-orange-900/40 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {(() => {
                            const user = (avis as any).user || avis.employee;
                            const photoUrl = user?.photoUrl || (user as any)?.photo_url;
                            const firstName = user?.firstName || user?.prenom || '';
                            const lastName = user?.lastName || user?.nom || '';
                            
                            if (photoUrl) {
                              return (
                                <Image
                                  src={photoUrl}
                                  alt={`${firstName} ${lastName}`}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              );
                            }
                            return (
                              <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            );
                          })()}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">
                            {(() => {
                              const user = (avis as any).user || avis.employee;
                              const firstName = user?.firstName || user?.prenom || '';
                              const lastName = user?.lastName || user?.nom || '';
                              return `${firstName} ${lastName}`.trim() || 'N/A';
                            })()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {(() => {
                              const user = (avis as any).user || avis.employee;
                              return user?.email || "N/A";
                            })()}
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
                    <td className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {formatDate((avis as any).createdAt || avis.date_avis || avis.created_at)}
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
                  <div className="w-20 h-20 bg-orange-50/30 dark:bg-orange-900/40 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                    {(() => {
                      const user = (selectedAvis as any).user || selectedAvis.employee;
                      const photoUrl = user?.photoUrl || (user as any)?.photo_url;
                      const firstName = user?.firstName || user?.prenom || '';
                      const lastName = user?.lastName || user?.nom || '';
                      
                      if (photoUrl) {
                        return (
                          <Image
                            src={photoUrl}
                            alt={`${firstName} ${lastName}`}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover rounded-full"
                          />
                        );
                      }
                      return (
                        <User className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                      );
                    })()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {(() => {
                        const user = (selectedAvis as any).user || selectedAvis.employee;
                        const firstName = user?.firstName || user?.prenom || '';
                        const lastName = user?.lastName || user?.nom || '';
                        return `${firstName} ${lastName}`.trim() || 'N/A';
                      })()}
                  </h3>
                    <p className="text-[var(--zalama-text-secondary)] text-lg mt-1">
                      {(() => {
                        const user = (selectedAvis as any).user || selectedAvis.employee;
                        return user?.email || "N/A";
                      })()}
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
                    {(() => {
                      const user = (selectedAvis as any).user || selectedAvis.employee;
                      return user?.email || "Non renseigné";
                    })()}
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
                      {(() => {
                        const user = (selectedAvis as any).user || selectedAvis.employee;
                        const phone = user?.phone || (user as any)?.telephone;
                        if (phone) {
                          // Si le numéro commence déjà par +224, on le garde tel quel, sinon on l'ajoute
                          return phone.startsWith('+') ? phone : `+224${phone}`;
                        }
                        return "Non renseigné";
                      })()}
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
                      {formatDate((selectedAvis as any).createdAt || selectedAvis.date_avis || selectedAvis.created_at)}
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