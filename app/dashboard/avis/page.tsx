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
} from "lucide-react";
import { useEdgeAuth } from "@/hooks/useEdgeAuth";
import StatCard from "@/components/dashboard/StatCard";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  };
};

type Employee = {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  nom_complet: string;
};

// Données pour le graphique d'évolution des notes (calculées dynamiquement)
const getEvolutionNotesData = (avis: AvisWithEmployee[]) => {
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

// Type étendu pour inclure les données des employés
interface AvisWithEmployee extends Avis {
  employees?: Employee;
}

export default function AvisPage() {
  const { session, loading } = useEdgeAuth();
  const router = useRouter();
  const [avis, setAvis] = useState<AvisWithEmployee[]>([]);
  const [filteredAvis, setFilteredAvis] = useState<AvisWithEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // États pour les filtres avancés
  const [filters, setFilters] = useState({
    mois: null as number | null,
    annee: null as number | null,
    note: null as number | null,
    type_retour: null as string | null,
    approuve: null as boolean | null,
    employee_id: null as string | null,
    date_debut: null as string | null,
    date_fin: null as string | null,
    limit: 50,
    offset: 0
  });

  // États pour les données supplémentaires
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activityPeriods, setActivityPeriods] = useState<{
    months: { value: number; label: string }[];
    years: { value: number; label: string }[];
  } | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });

  // Créer la référence en dehors des hooks
  const hasFinishedLoading = React.useRef(false);

  // Charger les données initiales
  useEffect(() => {
    if (!loading && session?.access_token) {
      loadInitialData();
    }
  }, [loading, session?.access_token]);

  // Charger les avis quand les filtres changent
  useEffect(() => {
    if (session?.access_token) {
      loadAvisData();
    }
  }, [filters, session?.access_token]);

  const loadInitialData = async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      // Charger les employés et périodes d'activité en parallèle
      const [employeesResponse, periodsResponse] = await Promise.all([
        fetch('/api/proxy/avis/employees-list', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch('/api/proxy/avis/activity-periods', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ]);

      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        if (employeesData.success) {
          setEmployees(employeesData.data.employees || []);
        }
      }

      if (periodsResponse.ok) {
        const periodsData = await periodsResponse.json();
        if (periodsData.success) {
          setActivityPeriods(periodsData.data);
        }
      }

      // Charger les avis et statistiques
      await Promise.all([loadAvisData(), loadStatistics()]);
    } catch (error) {
      console.error("Erreur lors du chargement des données initiales:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvisData = async () => {
    if (!session?.access_token) return;

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const url = queryParams.toString() 
        ? `/api/proxy/avis?${queryParams.toString()}`
        : '/api/proxy/avis';

      const response = await fetch(url, {
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

      const avisList = avisData.data?.avis || [];
      setAvis(avisList);
      setFilteredAvis(avisList);
      setPagination(avisData.data?.pagination || { limit: 50, offset: 0, total: 0 });

      console.log("Avis chargés via proxy:", avisList);
    } catch (error) {
      console.error("Erreur lors du chargement des avis:", error);
      toast.error("Erreur lors du chargement des avis");
    }
  };

  const loadStatistics = async () => {
    if (!session?.access_token) return;

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'limit' && key !== 'offset') {
          queryParams.append(key, value.toString());
        }
      });

      const url = queryParams.toString() 
        ? `/api/proxy/avis/statistics?${queryParams.toString()}`
        : '/api/proxy/avis/statistics';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const statsData = await response.json();

      if (statsData.success) {
        setStatistics(statsData.data.statistics);
        console.log("Statistiques chargées:", statsData.data.statistics);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0 // Reset pagination when filters change
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      mois: null,
      annee: null,
      note: null,
      type_retour: null,
      approuve: null,
      employee_id: null,
      date_debut: null,
      date_fin: null,
      limit: 50,
      offset: 0
    });
    setCurrentPage(1);
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
  const totalPages = Math.ceil(pagination.total / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAvis.slice(indexOfFirstItem, indexOfLastItem);

  // Fonction pour changer de page
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      const newOffset = (pageNumber - 1) * itemsPerPage;
      updateFilter('offset', newOffset);
      // Scroll vers le haut de la page
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Utiliser les statistiques de l'edge fonction si disponibles, sinon calculer localement
  const stats = statistics ? [
    {
      title: "Total avis",
      value: statistics.total_avis || 0,
      icon: MessageSquare,
      color: "blue" as const,
    },
    {
      title: "Note moyenne",
      value: `${(statistics.note_moyenne || 0).toFixed(1)}/5`,
      icon: Star,
      color: "yellow" as const,
    },
    {
      title: "Taux de satisfaction",
      value: `${(statistics.taux_satisfaction || 0).toFixed(0)}%`,
      icon: ThumbsUp,
      color: "green" as const,
    },
    {
      title: "Taux d'approbation",
      value: `${(statistics.taux_approbation || 0).toFixed(0)}%`,
      icon: BarChart2,
      color: "purple" as const,
    },
  ] : [
    {
      title: "Total avis",
      value: filteredAvis.length,
      icon: MessageSquare,
      color: "blue" as const,
    },
    {
      title: "Note moyenne",
      value: filteredAvis.length > 0 
        ? `${(filteredAvis.reduce((sum, av) => sum + av.note, 0) / filteredAvis.length).toFixed(1)}/5`
        : "0.0/5",
      icon: Star,
      color: "yellow" as const,
    },
    {
      title: "Taux de satisfaction",
      value: filteredAvis.length > 0
        ? `${((filteredAvis.filter((av) => av.note >= 4).length / filteredAvis.length) * 100).toFixed(0)}%`
        : "0%",
      icon: ThumbsUp,
      color: "green" as const,
    },
    {
      title: "Avis ce mois",
      value: filteredAvis.filter((av) => {
        const avisDate = new Date(av.date_avis);
        const now = new Date();
        return (
          avisDate.getMonth() === now.getMonth() &&
          avisDate.getFullYear() === now.getFullYear()
        );
      }).length,
      icon: BarChart2,
      color: "purple" as const,
    },
  ];

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          Chargement des avis...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-[var(--zalama-text)]">
        Avis des Salariés
      </h1>
      <p className="text-[var(--zalama-text)]/70">
        Entreprise: {session?.partner?.company_name}
      </p>

      {/* Statistiques */}
      <h2 className="text-xl font-bold text-[var(--zalama-text)] mt-2">
        Statistiques des avis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4">
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

      {/* Graphiques */}
      <div className="mt-6">
        <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6 w-full">
          <h2 className="text-lg font-semibold text-[var(--zalama-text)] mb-4">
            Évolution des notes
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={getEvolutionNotesData(avis)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--zalama-border)"
                />
                <XAxis dataKey="mois" stroke="var(--zalama-text)" />
                <YAxis
                  stroke="var(--zalama-text)"
                  domain={[0, 5]}
                  tickFormatter={noteFormatter}
                />
                <Tooltip
                  formatter={(value) => [`${value} étoiles`, ""]}
                  contentStyle={{
                    backgroundColor: "var(--zalama-card)",
                    borderColor: "var(--zalama-border)",
                  }}
                  labelStyle={{ color: "var(--zalama-text)" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="note"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name="Note moyenne"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un avis..."
              className="pl-10 pr-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] w-full sm:w-64"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                Object.values(filters).some(v => v !== null && v !== undefined && v !== 50 && v !== 0)
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>
                Filtres {Object.values(filters).some(v => v !== null && v !== undefined && v !== 50 && v !== 0) && "(actifs)"}
              </span>
            </button>

            {/* Menu des filtres avancés */}
            {showFilterMenu && (
              <div
                ref={filterMenuRef}
                className="absolute top-full left-0 mt-2 w-96 bg-[var(--zalama-card)] rounded-lg shadow-lg border border-[var(--zalama-border)] overflow-hidden z-10 max-h-96 overflow-y-auto"
              >
                {/* Filtres par mois et année */}
                <div className="p-3 border-b border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]/30">
                  <h3 className="text-sm font-medium text-[var(--zalama-text)] mb-2">
                    Période
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={filters.mois || ''}
                      onChange={(e) => updateFilter('mois', e.target.value ? parseInt(e.target.value) : null)}
                      className="px-2 py-1 text-sm rounded border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                    >
                      <option value="">Tous les mois</option>
                      {activityPeriods?.months.map((month: any) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filters.annee || ''}
                      onChange={(e) => updateFilter('annee', e.target.value ? parseInt(e.target.value) : null)}
                      className="px-2 py-1 text-sm rounded border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                    >
                      <option value="">Toutes les années</option>
                      {activityPeriods?.years.map((year: any) => (
                        <option key={year.value} value={year.value}>
                          {year.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filtres par note */}
                <div className="p-3 border-b border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]/30">
                  <h3 className="text-sm font-medium text-[var(--zalama-text)] mb-2">
                    Note
                  </h3>
                  <select
                    value={filters.note || ''}
                    onChange={(e) => updateFilter('note', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-2 py-1 text-sm rounded border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  >
                    <option value="">Toutes les notes</option>
                    <option value="5">5 étoiles</option>
                    <option value="4">4 étoiles</option>
                    <option value="3">3 étoiles</option>
                    <option value="2">2 étoiles</option>
                    <option value="1">1 étoile</option>
                  </select>
                </div>

                {/* Filtres par type de retour */}
                <div className="p-3 border-b border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]/30">
                  <h3 className="text-sm font-medium text-[var(--zalama-text)] mb-2">
                    Type de retour
                  </h3>
                  <select
                    value={filters.type_retour || ''}
                    onChange={(e) => updateFilter('type_retour', e.target.value || null)}
                    className="w-full px-2 py-1 text-sm rounded border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  >
                    <option value="">Tous les types</option>
                    <option value="positif">Positif</option>
                    <option value="negatif">Négatif</option>
                  </select>
                </div>

                {/* Filtres par statut d'approbation */}
                <div className="p-3 border-b border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]/30">
                  <h3 className="text-sm font-medium text-[var(--zalama-text)] mb-2">
                    Statut d'approbation
                  </h3>
                  <select
                    value={filters.approuve === null ? '' : filters.approuve.toString()}
                    onChange={(e) => updateFilter('approuve', e.target.value === '' ? null : e.target.value === 'true')}
                    className="w-full px-2 py-1 text-sm rounded border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="true">Approuvé</option>
                    <option value="false">En attente</option>
                  </select>
                </div>

                {/* Filtres par employé */}
                <div className="p-3 border-b border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]/30">
                  <h3 className="text-sm font-medium text-[var(--zalama-text)] mb-2">
                    Employé
                  </h3>
                  <select
                    value={filters.employee_id || ''}
                    onChange={(e) => updateFilter('employee_id', e.target.value || null)}
                    className="w-full px-2 py-1 text-sm rounded border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                  >
                    <option value="">Tous les employés</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.nom_complet} - {employee.poste}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtres par période personnalisée */}
                <div className="p-3 border-b border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]/30">
                  <h3 className="text-sm font-medium text-[var(--zalama-text)] mb-2">
                    Période personnalisée
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.date_debut || ''}
                      onChange={(e) => updateFilter('date_debut', e.target.value || null)}
                      className="w-full px-2 py-1 text-sm rounded border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                      placeholder="Date de début"
                    />
                    <input
                      type="date"
                      value={filters.date_fin || ''}
                      onChange={(e) => updateFilter('date_fin', e.target.value || null)}
                      className="w-full px-2 py-1 text-sm rounded border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]"
                      placeholder="Date de fin"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 flex justify-between">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[var(--zalama-text)]/70 hover:text-[var(--zalama-text)] transition-colors"
                  >
                    Réinitialiser
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
        <div className="flex gap-2">
          <button 
            onClick={loadInitialData}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-light)]/80 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]">
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {/* Affichage des filtres actifs */}
      {Object.values(filters).some(v => v !== null && v !== undefined && v !== 50 && v !== 0) && (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-sm text-[var(--zalama-text)]/70">Filtres actifs:</span>
          {filters.mois && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Mois: {activityPeriods?.months.find(m => m.value === filters.mois)?.label}
              <button onClick={() => updateFilter('mois', null)} className="ml-1 hover:text-blue-600">×</button>
            </span>
          )}
          {filters.annee && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Année: {filters.annee}
              <button onClick={() => updateFilter('annee', null)} className="ml-1 hover:text-blue-600">×</button>
            </span>
          )}
          {filters.note && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Note: {filters.note} étoiles
              <button onClick={() => updateFilter('note', null)} className="ml-1 hover:text-blue-600">×</button>
            </span>
          )}
          {filters.type_retour && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Type: {filters.type_retour}
              <button onClick={() => updateFilter('type_retour', null)} className="ml-1 hover:text-blue-600">×</button>
            </span>
          )}
          {filters.approuve !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Statut: {filters.approuve ? 'Approuvé' : 'En attente'}
              <button onClick={() => updateFilter('approuve', null)} className="ml-1 hover:text-blue-600">×</button>
            </span>
          )}
          {filters.employee_id && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Employé: {employees.find(e => e.id === filters.employee_id)?.nom_complet}
              <button onClick={() => updateFilter('employee_id', null)} className="ml-1 hover:text-blue-600">×</button>
            </span>
          )}
          {filters.date_debut && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Depuis: {new Date(filters.date_debut).toLocaleDateString('fr-FR')}
              <button onClick={() => updateFilter('date_debut', null)} className="ml-1 hover:text-blue-600">×</button>
            </span>
          )}
          {filters.date_fin && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              Jusqu'à: {new Date(filters.date_fin).toLocaleDateString('fr-FR')}
              <button onClick={() => updateFilter('date_fin', null)} className="ml-1 hover:text-blue-600">×</button>
            </span>
          )}
        </div>
      )}

      {/* Liste des avis */}
      <div className="space-y-4 mt-2">
        {filteredAvis.length === 0 ? (
          <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <Search className="h-12 w-12 text-[var(--zalama-text)]/30 mb-4" />
              <h3 className="text-lg font-medium text-[var(--zalama-text)]">
                Aucun avis trouvé
              </h3>
              <p className="mt-1 text-sm text-[var(--zalama-text)]/70">
                Aucun avis ne correspond à vos critères de recherche ou de
                filtrage.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory(null);
                  setRatingFilter(null);
                  setCurrentPage(1);
                }}
                className="mt-4 px-4 py-2 bg-[var(--zalama-blue)] text-white rounded-md"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        ) : (
          currentItems.map((avis) => (
            <div
              key={avis.id}
              className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image de profil */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--zalama-border)] shadow-md mb-2">
                    <div className="w-full h-full flex items-center justify-center bg-[var(--zalama-blue)] text-white font-bold text-xl">
                      {avis.employee
                        ? `${avis.employee.prenom?.[0] || ""}${
                            avis.employee.nom?.[0] || ""
                          }`
                        : "U"}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--zalama-text)] text-center">
                    {avis.employee
                      ? `${avis.employee.prenom} ${avis.employee.nom}`
                      : "Utilisateur inconnu"}
                  </h3>
                  <p className="text-xs text-[var(--zalama-text)]/60 text-center">
                    {avis.employee?.poste || "Poste non spécifié"}
                  </p>
                </div>

                {/* Contenu de l'avis */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[var(--zalama-text)]">
                      Avis sur les services
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < avis.note
                                ? "text-amber-500 fill-amber-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-[var(--zalama-text)]/70 ml-2">
                        {avis.note}/5
                      </span>
                    </div>
                  </div>

                  {/* Citation */}
                  <div className="relative pl-4 border-l-4 border-blue-500 italic mb-4">
                    <p className="text-[var(--zalama-text)]/80">
                      "{avis.commentaire || "Aucun commentaire"}"
                    </p>
                  </div>

                  {/* Métadonnées */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--zalama-text)]/60">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {new Date(avis.date_avis).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-1">
                        <ThumbsUp className="h-3 w-3 text-green-500" />
                      </div>
                      <span>{avis.approuve ? "Approuvé" : "En attente"}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span>Note: {avis.note} étoiles</span>
                    </div>
                    <div className="flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      <span>
                        Poste: {avis.employee?.poste || "Non spécifié"}
                      </span>
                    </div>
                    <div className="ml-auto text-xs text-[var(--zalama-text)]/40">
                      {avis.id}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-[var(--zalama-text)]/70">
          {pagination.total === 0
            ? "Aucun avis trouvé"
            : pagination.total === 1
            ? "1 avis trouvé"
            : `Affichage de ${indexOfFirstItem + 1} à ${Math.min(
                indexOfLastItem,
                pagination.total
              )} sur ${pagination.total} avis`}
        </div>
        {pagination.total > 0 && (
          <div className="flex gap-1">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded border ${
                currentPage === 1
                  ? "border-[var(--zalama-border)]/30 bg-[var(--zalama-bg-light)]/50 text-[var(--zalama-text)]/30 cursor-not-allowed"
                  : "border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-light)]/80"
              }`}
            >
              Précédent
            </button>

            {/* Affichage des boutons de pagination */}
            {[...Array(totalPages)].map((_, index) => {
              // Afficher au maximum 5 boutons de pagination
              if (
                totalPages <= 5 ||
                // Toujours afficher la première page
                index === 0 ||
                // Toujours afficher la dernière page
                index === totalPages - 1 ||
                // Afficher les pages autour de la page courante
                (index >= currentPage - 2 && index <= currentPage + 0)
              ) {
                return (
                  <button
                    key={index}
                    onClick={() => paginate(index + 1)}
                    className={`px-3 py-1 rounded border ${
                      currentPage === index + 1
                        ? "border-[var(--zalama-border)] bg-[var(--zalama-blue)] text-white"
                        : "border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-light)]/80"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              } else if (
                (index === 1 && currentPage > 3) ||
                (index === totalPages - 2 && currentPage < totalPages - 2)
              ) {
                // Afficher des points de suspension pour indiquer des pages non affichées
                return (
                  <span
                    key={index}
                    className="px-3 py-1 text-[var(--zalama-text)]/70"
                  >
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-3 py-1 rounded border ${
                currentPage === totalPages || totalPages === 0
                  ? "border-[var(--zalama-border)]/30 bg-[var(--zalama-bg-light)]/50 text-[var(--zalama-text)]/30 cursor-not-allowed"
                  : "border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-light)]/80"
              }`}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}