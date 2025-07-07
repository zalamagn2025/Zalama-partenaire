"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle, Clock, AlertCircle, Search, Filter, Calendar, Download, Plus, MoreHorizontal, User, Tag, MessageSquare, PlusSquare, MailWarning, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import { toast } from 'sonner';
import { demandeAvanceService, PartnerDataService } from '@/lib/services';
import type { SalaryAdvanceRequest, Employee } from '@/lib/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Type étendu pour inclure les données des employés
interface SalaryAdvanceRequestWithEmployee extends SalaryAdvanceRequest {
  employees?: Employee;
}

// Types de services disponibles
const serviceTypes = [
  { id: "avance-salaire", label: "Avance sur Salaire", icon: PlusSquare },
  { id: "conseil-financier", label: "Gestion et Conseil Financier", icon: MailWarning },
  { id: "paiement-salaire", label: "Paiement de Salaire", icon: DollarSign },
];

export default function DemandesPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [demandesAvance, setDemandesAvance] = useState<SalaryAdvanceRequestWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Charger les demandes
  useEffect(() => {
    const loadDemandes = async () => {
      if (!session?.partner) return;
      
      setLoading(true);
      try {
        // Utiliser le service pour récupérer les vraies données
        const partnerService = new PartnerDataService(session.partner.id);
        const demandes = await partnerService.getSalaryAdvanceRequests();

        setDemandesAvance(demandes);

      } catch (error) {
        console.error('Erreur lors du chargement des demandes:', error);
        toast.error('Erreur lors du chargement des demandes');
      } finally {
        setLoading(false);
      }
    };

    loadDemandes();
  }, [session?.partner]);

  // Formater les demandes
  const allDemandes = demandesAvance.map(d => ({
    ...d,
    type_demande: 'Avance sur Salaire',
    demandeur: d.employees ? `${d.employees.prenom} ${d.employees.nom}` : `Employé ${d.employe_id}`,
    date: new Date(d.date_creation).toLocaleDateString('fr-FR'),
    montant: d.montant_demande,
    commentaires: 0,
    poste: d.employees?.poste || 'Non spécifié'
  }));

  // Filtrer les demandes
  const filteredDemandes = allDemandes.filter(demande => {
    const matchesSearch = !searchTerm || 
      demande.type_demande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.demandeur?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = !selectedService || demande.type_demande === selectedService;
    const matchesStatus = !statusFilter || demande.statut === statusFilter;
    
    return matchesSearch && matchesService && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDemandes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredDemandes.slice(startIndex, startIndex + itemsPerPage);

  // Calculer les statistiques
  const totalDemandes = allDemandes.length;
  const approvedDemandes = allDemandes.filter(d => d.statut === 'Validé').length;
  const pendingDemandes = allDemandes.filter(d => d.statut === 'En attente').length;
  const rejectedDemandes = allDemandes.filter(d => d.statut === 'Rejeté').length;

  const stats = [
    { title: "Total demandes", value: totalDemandes, icon: FileText, color: "blue" as const },
    { title: "Approuvées", value: approvedDemandes, icon: CheckCircle, color: "green" as const },
    { title: "En attente", value: pendingDemandes, icon: Clock, color: "yellow" as const },
    { title: "Refusées", value: rejectedDemandes, icon: AlertCircle, color: "red" as const },
  ];

  // Gérer le clic en dehors du menu des filtres
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--zalama-text)]">Demandes de Services</h1>
          <p className="text-[var(--zalama-text)]/60 mt-1">
            Gérez les demandes d'avance sur salaire et de prêts P2P de vos employés
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              // TODO: Implémenter l'export CSV
              toast.info('Export CSV à implémenter');
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--zalama-text)] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => {
              // TODO: Implémenter la création de demande
              toast.info('Création de demande à implémenter');
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--zalama-primary)] rounded-lg hover:bg-[var(--zalama-primary-hover)]"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Demande
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Répartition par motifs de demande */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par motifs de demande
          </h3>
          {(() => {
            // Calculer la répartition par motifs à partir des vraies données
            const motifCounts = allDemandes.reduce((acc, demande) => {
              const motif = demande.type_motif || 'Non spécifié';
              acc[motif] = (acc[motif] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const repartitionMotifsData = Object.entries(motifCounts).map(([motif, count], index) => {
              const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FF8042'];
              return {
                motif,
                valeur: count,
                color: colors[index % colors.length]
              };
            });

            const hasMotifsData = repartitionMotifsData.length > 0;

            return hasMotifsData ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartitionMotifsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ motif, percent }) => `${motif} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="valeur"
                  >
                    {repartitionMotifsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune donnée disponible</p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Répartition par statut */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par statut
          </h3>
          {(() => {
            const statutCounts = allDemandes.reduce((acc, demande) => {
              const statut = demande.statut || 'Non défini';
              acc[statut] = (acc[statut] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const repartitionStatutData = Object.entries(statutCounts).map(([statut, count], index) => {
              const colors = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];
              return {
                statut,
                valeur: count,
                color: colors[index % colors.length]
              };
            });

            const hasStatutData = repartitionStatutData.length > 0;

            return hasStatutData ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartitionStatutData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ statut, percent }) => `${statut} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="valeur"
                  >
                    {repartitionStatutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune donnée disponible</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une demande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[var(--zalama-text)] placeholder-gray-500 focus:ring-2 focus:ring-[var(--zalama-primary)] focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-3">
            {/* Filtre par service */}
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--zalama-text)] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Filter className="h-4 w-4" />
                {selectedService || 'Tous les services'}
              </button>
              
              {showFilterMenu && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedService('');
                        setShowFilterMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--zalama-text)] hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Tous les services
                    </button>
                    {serviceTypes.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service.label);
                          setShowFilterMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[var(--zalama-text)] hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                      >
                        <service.icon className="h-4 w-4" />
                        {service.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filtre par statut */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 text-sm font-medium text-[var(--zalama-text)] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <option value="">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="En cours">En cours</option>
              <option value="Approuvée">Approuvée</option>
              <option value="Refusée">Refusée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {currentItems.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--zalama-text)] mb-2">
              Aucune demande trouvée
            </h3>
            <p className="text-[var(--zalama-text)]/60">
              {searchTerm || selectedService || statusFilter 
                ? 'Aucune demande ne correspond aux critères sélectionnés.'
                : 'Aucune demande n\'a encore été créée.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {currentItems.map((demande) => (
              <div key={demande.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[var(--zalama-text)]">
                        {demande.type_demande}
                      </h3>
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                        demande.statut === 'En attente' 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                          : demande.statut === 'Approuvée' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : demande.statut === 'Refusée'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {demande.statut}
                      </span>
                    </div>
                    <p className="text-[var(--zalama-text)]/80 mb-3">
                      {demande.motif}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--zalama-text)]/60">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>{demande.demandeur}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{demande.date}</span>
                      </div>
                      <div className="flex items-center">
                        {(() => {
                          const IconComponent = serviceTypes.find(s => s.label === demande.type_demande)?.icon;
                          return IconComponent ? <IconComponent className="h-3 w-3 mr-1" /> : null;
                        })()}
                        <span>{demande.type_demande}</span>
                      </div>
                      {demande.montant !== null && (
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          <span>{demande.montant.toLocaleString()} GNF</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        <span>{demande.commentaires} commentaires</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button className="p-1 rounded-full hover:bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]/70 hover:text-[var(--zalama-text)]">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-[var(--zalama-text)] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${
                  currentPage === index + 1
                    ? 'bg-[var(--zalama-primary)] text-white'
                    : 'text-[var(--zalama-text)] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-[var(--zalama-text)] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
