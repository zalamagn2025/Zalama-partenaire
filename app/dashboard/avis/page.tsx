"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { useEdgeAuthContext } from "@/contexts/EdgeAuthContext";
import StatCard from "@/components/dashboard/StatCard";
import { toast } from "sonner";
import { edgeFunctionService } from "@/lib/edgeFunctionService";

// Type pour les avis
type Avis = {
  id: string;
  note: number;
  commentaire?: string;
  date_avis: string;
  approuve: boolean;
  created_at: string;
  updated_at: string;
  employe_id: string;
  partner_id: string;
  employee?: {
    id: string;
    nom: string;
    prenom: string;
    poste?: string;
    email?: string;
  };
};

// Types d'avis disponibles
const avisCategories = [
  { id: "service", label: "Service" },
  { id: "application", label: "Application" },
  { id: "support", label: "Support" },
  { id: "general", label: "Général" },
];

// Données pour le graphique d'évolution des notes (calculées dynamiquement)
const getEvolutionNotesData = (avis: Avis[]) => {
  const monthlyData: { [key: string]: number[] } = {};

  avis.forEach((avis) => {
    const date = new Date(avis.date_avis || avis.created_at || "");
    const monthKey = date.toLocaleDateString("fr-FR", { month: "short" });

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(avis.note);
  });

  return Object.entries(monthlyData).map(([mois, notes]) => ({
    mois,
    note: notes.reduce((sum, note) => sum + note, 0) / notes.length,
  }));
};

// Formatter pour les notes
const noteFormatter = (value: number) => `${value.toFixed(1)}`;

export default function AvisPage() {
  const { session, loading } = useEdgeAuthContext();
  const router = useRouter();
  const [avis, setAvis] = useState<Avis[]>([]);
  const [filteredAvis, setFilteredAvis] = useState<Avis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // États pour les données Edge Functions
  const [currentMonthData, setCurrentMonthData] = useState<any>(null);
  const [edgeFunctionLoading, setEdgeFunctionLoading] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Charger les avis
  useEffect(() => {
    if (!loading && session?.partner) {
      loadAvisData();
    }
  }, [loading, session?.partner]);

  const loadAvisData = async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      // Utiliser le proxy au lieu de l'Edge Function directement
      const response = await fetch('/api/proxy/avis', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const avisData = await response.json();

      if (!avisData.success) {
        console.error("Erreur Edge Function:", avisData.message);
        toast.error("Erreur lors du chargement des avis");
        return;
      }

      const avisList = avisData.data || [];
      setAvis(avisList);
      setFilteredAvis(avisList);

      console.log("Avis chargés via proxy:", avisList);
      toast.success(`${avisList.length} avis chargés avec succès`);
    } catch (error) {
      console.error("Erreur lors du chargement des avis:", error);
      toast.error("Erreur lors du chargement des avis");
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données du mois en cours via Edge Functions
  const loadCurrentMonthData = async () => {
    if (!session?.access_token) return;

    setEdgeFunctionLoading(true);
    try {
      // Utiliser le proxy pour les données du dashboard
      const response = await fetch('/api/proxy/avis', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const avisData = await response.json();

      if (!avisData.success) {
        console.error("Erreur Edge Function:", avisData.message);
        toast.error("Erreur lors du chargement des données du mois en cours");
        return;
      }

      const avisList = avisData.data || [];
      setCurrentMonthData({ avis: avisList });
                
                // Mettre à jour les données locales avec les données du mois en cours
      setAvis(avisList);
      setFilteredAvis(avisList);

      console.log("Données des avis du mois en cours chargées:", avisData);
      toast.success("Données des avis du mois en cours mises à jour avec succès");
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

  // Gérer le clic en dehors du menu des filtres
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node)
      ) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filtrer les avis
  useEffect(() => {
    let filtered = avis;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter((avi) =>
        avi.commentaire?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par note
    if (ratingFilter) {
      filtered = filtered.filter((avi) => avi.note === ratingFilter);
    }

    setFilteredAvis(filtered);
    setCurrentPage(1);
  }, [avis, searchTerm, ratingFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAvis.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAvis.slice(indexOfFirstItem, indexOfLastItem);

  // Fonction pour changer de page
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Calculer les statistiques basées sur les avis filtrés
  const totalAvis = filteredAvis.length;
  const averageRating =
    filteredAvis.length > 0
      ? filteredAvis.reduce((sum, av) => sum + av.note, 0) / filteredAvis.length
      : 0;
  const satisfactionRate =
    filteredAvis.length > 0
      ? (filteredAvis.filter((av) => av.note >= 4).length /
          filteredAvis.length) *
        100
      : 0;
  const thisMonthAvis = filteredAvis.filter((av) => {
    const avisDate = new Date(av.date_avis);
    const now = new Date();
    return (
      avisDate.getMonth() === now.getMonth() &&
      avisDate.getFullYear() === now.getFullYear()
    );
  }).length;

  // Statistiques des avis
  const stats = [
    {
      title: "Total avis",
      value: totalAvis,
      icon: MessageSquare,
      color: "blue" as const,
    },
    {
      title: "Note moyenne",
      value: `${averageRating.toFixed(1)}/5`,
      icon: Star,
      color: "yellow" as const,
    },
    {
      title: "Taux de satisfaction",
      value: `${satisfactionRate.toFixed(0)}%`,
      icon: ThumbsUp,
      color: "green" as const,
    },
    {
      title: "Avis ce mois",
      value: thisMonthAvis,
      icon: BarChart2,
      color: "purple" as const,
    },
  ];

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          {edgeFunctionLoading ? "Chargement des données du mois en cours..." : "Chargement des avis..."}
        </p>
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
              Avis des Salariés
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
            Entreprise: {session?.partner?.company_name}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadAvisData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
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
                placeholder="Rechercher un avis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          </div>

          {/* Filtre par note */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center px-4 py-2 border rounded-lg ${
                ratingFilter
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              {ratingFilter ? `${ratingFilter} étoiles` : "Filtrer par note"}
            </button>

            {/* Menu des filtres */}
            {showFilterMenu && (
              <div
                ref={filterMenuRef}
                className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 overflow-hidden z-10"
              >
                <div className="p-3 border-b border-gray-300 dark:border-gray-600">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Filtrer par note
                  </h3>
                  <div className="mt-2 space-y-1">
                    <div
                      onClick={() => setRatingFilter(null)}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                        ratingFilter === null
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className="text-sm">Toutes les notes</span>
                    </div>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div
                        key={rating}
                        onClick={() => setRatingFilter(rating)}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                          ratingFilter === rating
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm">
                          {rating} étoile{rating > 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 flex justify-between">
                  <button
                    onClick={() => {
                      setRatingFilter(null);
                      setCurrentPage(1);
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                  <button
                    onClick={() => setShowFilterMenu(false)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liste des avis en cartes */}
        {filteredAvis.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Aucun avis trouvé
              </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || ratingFilter
              ? "Essayez de modifier vos critères de recherche."
              : "Aucun avis n'a encore été soumis."}
          </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentItems.map((avis) => (
            <div
              key={avis.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {avis.employee ? `${avis.employee.prenom} ${avis.employee.nom}` : "Utilisateur inconnu"}
                  </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {avis.employee?.poste || "Poste non spécifié"}
                  </p>
                </div>
                </div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                      className={`h-4 w-4 ${
                              i < avis.note
                                ? "text-amber-500 fill-amber-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                    </div>
                  </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                      "{avis.commentaire || "Aucun commentaire"}"
                  </div>

                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Date:</span>
                  <span>{new Date(avis.date_avis).toLocaleDateString("fr-FR")}</span>
                    </div>
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Statut:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      avis.approuve
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    }`}
                  >
                    {avis.approuve ? "Approuvé" : "En attente"}
                      </span>
                    </div>
                    </div>
                  </div>
          ))}
            </div>
        )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Précédent
            </button>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Affichage de{" "}
                <span className="font-medium">
                  {indexOfFirstItem + 1}
                </span>{" "}
                à{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredAvis.length)}
                </span>{" "}
                sur{" "}
                <span className="font-medium">
                  {filteredAvis.length}
                </span>{" "}
                avis
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-300"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
      </div>
        </div>
      )}
    </div>
  );
}