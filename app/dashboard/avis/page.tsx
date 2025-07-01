"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Search, Filter, Download, Calendar, User, ThumbsUp, ThumbsDown, MessageSquare, BarChart2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import { toast } from 'sonner';
import { avisServiceFixed as avisService } from '@/lib/services_fixed';
import type { Avis, Employee } from '@/lib/supabase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Types d'avis disponibles
const avisCategories = [
  { id: "service", label: "Service" },
  { id: "application", label: "Application" },
  { id: "support", label: "Support" },
  { id: "general", label: "Général" },
];

// Données fictives pour les avis
const avisData = [
  { 
    id: "AVIS-2025-001", 
    titre: "Expérience positive avec l'avance sur salaire", 
    description: "J'ai pu obtenir une avance sur salaire rapidement quand j'en avais besoin. Le processus était simple et efficace.", 
    date: "15/05/2025", 
    categorie: "service",
    note: 5,
    employe: "Jean Dupont",
    departement: "Marketing",
    likes: 8,
    dislikes: 0,
    commentaires: 2
  },
  { 
    id: "AVIS-2025-002", 
    titre: "Interface utilisateur intuitive", 
    description: "L'application est très facile à utiliser, même pour quelqu'un qui n'est pas à l'aise avec la technologie.", 
    date: "12/05/2025", 
    categorie: "application",
    note: 4,
    employe: "Sophie Martin",
    departement: "Ressources Humaines",
    likes: 5,
    dislikes: 1,
    commentaires: 3
  },
  { 
    id: "AVIS-2025-003", 
    titre: "Support réactif", 
    description: "J'ai eu un problème avec ma demande et l'équipe de support a répondu très rapidement. Problème résolu en moins d'une heure.", 
    date: "10/05/2025", 
    categorie: "support",
    note: 5,
    employe: "Thomas Petit",
    departement: "Comptabilité",
    likes: 12,
    dislikes: 0,
    commentaires: 1
  },
  { 
    id: "AVIS-2025-004", 
    titre: "Suggestion d'amélioration pour les notifications", 
    description: "Il serait utile d'avoir des notifications plus détaillées concernant le statut des demandes. Parfois, je ne sais pas exactement où en est ma demande.", 
    date: "05/05/2025", 
    categorie: "application",
    note: 3,
    employe: "Emma Leroy",
    departement: "Développement",
    likes: 15,
    dislikes: 2,
    commentaires: 4
  },
  { 
    id: "AVIS-2025-005", 
    titre: "Excellente initiative", 
    description: "Je trouve que ce service est une excellente initiative de la part de l'entreprise. Cela montre qu'elle se soucie du bien-être financier de ses employés.", 
    date: "01/05/2025", 
    categorie: "general",
    note: 5,
    employe: "Lucas Moreau",
    departement: "Ventes",
    likes: 20,
    dislikes: 0,
    commentaires: 5
  },
  { 
    id: "AVIS-2025-006", 
    titre: "Délai de traitement parfois long", 
    description: "J'ai remarqué que certaines demandes prennent plus de temps que prévu à être traitées. Ce serait bien d'avoir une estimation plus précise du temps de traitement.", 
    date: "28/04/2025", 
    categorie: "service",
    note: 3,
    employe: "Chloé Dubois",
    departement: "Marketing",
    likes: 7,
    dislikes: 3,
    commentaires: 2
  },
  { 
    id: "AVIS-2025-007", 
    titre: "Fonctionnalité de prêt P2P très utile", 
    description: "La fonctionnalité de prêt P2P est très utile pour les projets personnels. J'ai pu financer ma formation professionnelle grâce à cela.", 
    date: "25/04/2025", 
    categorie: "service",
    note: 5,
    employe: "Antoine Bernard",
    departement: "Ressources Humaines",
    likes: 18,
    dislikes: 1,
    commentaires: 3
  },
  { 
    id: "AVIS-2025-008", 
    titre: "Application parfois lente", 
    description: "J'ai remarqué que l'application est parfois lente à charger, surtout aux heures de pointe. Ce serait bien d'améliorer les performances.", 
    date: "20/04/2025", 
    categorie: "application",
    note: 3,
    employe: "Julie Robert",
    departement: "Développement",
    likes: 9,
    dislikes: 4,
    commentaires: 2
  }
];

// Données pour le graphique d'évolution des notes
const evolutionNotesData = [
  { mois: 'Jan', note: 4.2 },
  { mois: 'Fév', note: 4.3 },
  { mois: 'Mar', note: 4.1 },
  { mois: 'Avr', note: 4.4 },
  { mois: 'Mai', note: 4.5 },
  { mois: 'Juin', note: 4.3 },
  { mois: 'Juil', note: 4.2 },
  { mois: 'Août', note: 4.0 },
  { mois: 'Sep', note: 4.1 },
  { mois: 'Oct', note: 4.3 },
  { mois: 'Nov', note: 4.4 },
  { mois: 'Déc', note: 4.6 },
];



// Formatter pour les notes
const noteFormatter = (value: number) => `${value.toFixed(1)}`;

// Type étendu pour inclure les données des employés
interface AvisWithEmployee extends Avis {
  employees?: Employee;
}

export default function AvisPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [avis, setAvis] = useState<AvisWithEmployee[]>([]);
  const [filteredAvis, setFilteredAvis] = useState<AvisWithEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const filterMenuRef = useRef<HTMLDivElement>(null);
  
  // Créer la référence en dehors des hooks
  const hasFinishedLoading = React.useRef(false);
  
  // Charger les avis
  useEffect(() => {
    if (!loading && session?.partner) {
      loadAvisData();
    }
  }, [loading, session?.partner]);

  const loadAvisData = async () => {
    if (!session?.partner) return;
    
    setIsLoading(true);
    try {
      // Utiliser des données de test réalistes directement
      const mockAvis = [
        { 
          id: '1', 
          employee_id: '1', 
          partner_id: session.partner.id, 
          note: 5, 
          commentaire: 'Service excellent, traitement rapide des demandes d\'avance', 
          type_retour: 'positif', 
          date_avis: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
          approuve: true, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString(),
          employees: { nom: 'Diallo', prenom: 'Mamadou', poste: 'Développeur' }
        },
        { 
          id: '2', 
          employee_id: '2', 
          partner_id: session.partner.id, 
          note: 4, 
          commentaire: 'Très satisfait du service client et de la rapidité', 
          type_retour: 'positif', 
          date_avis: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
          approuve: true, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString(),
          employees: { nom: 'Bah', prenom: 'Aissatou', poste: 'Designer' }
        },
        { 
          id: '3', 
          employee_id: '3', 
          partner_id: session.partner.id, 
          note: 5, 
          commentaire: 'Interface utilisateur intuitive et processus simplifié', 
          type_retour: 'positif', 
          date_avis: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), 
          approuve: true, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString(),
          employees: { nom: 'Sow', prenom: 'Ousmane', poste: 'Formateur' }
        },
        { 
          id: '4', 
          employee_id: '1', 
          partner_id: session.partner.id, 
          note: 4, 
          commentaire: 'Bon service, quelques améliorations possibles sur les délais', 
          type_retour: 'constructif', 
          date_avis: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), 
          approuve: true, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString(),
          employees: { nom: 'Diallo', prenom: 'Mamadou', poste: 'Développeur' }
        },
        { 
          id: '5', 
          employee_id: '2', 
          partner_id: session.partner.id, 
          note: 5, 
          commentaire: 'Système fiable et équipe support réactive', 
          type_retour: 'positif', 
          date_avis: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), 
          approuve: true, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString(),
          employees: { nom: 'Bah', prenom: 'Aissatou', poste: 'Designer' }
        }
      ] as any[];

      setAvis(mockAvis);
      setFilteredAvis(mockAvis);

    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
      toast.error('Erreur lors du chargement des avis');
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

  // Filtrer les avis
  useEffect(() => {
    let filtered = avis;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(avi => 
        avi.commentaire?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par note
    if (ratingFilter) {
      filtered = filtered.filter(avi => avi.note === ratingFilter);
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
      // Scroll vers le haut de la page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Calculer les statistiques basées sur les avis filtrés
  const totalAvis = filteredAvis.length;
  const averageRating = filteredAvis.length > 0 ? filteredAvis.reduce((sum, av) => sum + av.note, 0) / filteredAvis.length : 0;
  const satisfactionRate = filteredAvis.length > 0 ? (filteredAvis.filter(av => av.note >= 4).length / filteredAvis.length) * 100 : 0;
  const thisMonthAvis = filteredAvis.filter(av => {
    const avisDate = new Date(av.date_avis);
    const now = new Date();
    return avisDate.getMonth() === now.getMonth() && avisDate.getFullYear() === now.getFullYear();
  }).length;

  // Statistiques des avis - déplacé ici après le calcul des variables
  const stats = [
    { title: "Total avis", value: totalAvis, icon: MessageSquare, color: "blue" as const },
    { title: "Note moyenne", value: `${averageRating.toFixed(1)}/5`, icon: Star, color: "yellow" as const },
    { title: "Taux de satisfaction", value: `${satisfactionRate.toFixed(0)}%`, icon: ThumbsUp, color: "green" as const },
    { title: "Avis ce mois", value: thisMonthAvis, icon: BarChart2, color: "purple" as const },
  ];

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Chargement des avis...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-[var(--zalama-text)]">Avis des Salariés</h1>
      <p className="text-[var(--zalama-text)]/70">Entreprise: {session?.partner?.nom}</p>
      
      {/* Statistiques */}
      <h2 className="text-xl font-bold text-[var(--zalama-text)] mt-2">Statistiques des avis</h2>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Évolution des notes */}
        <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--zalama-text)] mb-4">Évolution des notes</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={evolutionNotesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--zalama-border)" />
                <XAxis dataKey="mois" stroke="var(--zalama-text)" />
                <YAxis stroke="var(--zalama-text)" domain={[0, 5]} tickFormatter={noteFormatter} />
                <Tooltip 
                  formatter={(value) => [`${value} étoiles`, '']}
                  contentStyle={{ 
                    backgroundColor: 'var(--zalama-card)', 
                    borderColor: 'var(--zalama-border)' 
                  }}
                  labelStyle={{ color: 'var(--zalama-text)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="note" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 8 }} name="Note moyenne" />
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${selectedCategory || ratingFilter ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]'}`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtres {(selectedCategory || ratingFilter) && '(actifs)'}</span>
            </button>
            
            {/* Menu des filtres */}
            {showFilterMenu && (
              <div 
                ref={filterMenuRef}
                className="absolute top-full left-0 mt-2 w-72 bg-[var(--zalama-card)] rounded-lg shadow-lg border border-[var(--zalama-border)] overflow-hidden z-10"
              >
                <div className="p-3 border-b border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]/30">
                  <h3 className="text-sm font-medium text-[var(--zalama-text)]">Filtrer par catégorie</h3>
                  <div className="mt-2 space-y-1">
                    <div 
                      onClick={() => setSelectedCategory(null)}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${selectedCategory === null ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-[var(--zalama-bg-light)]/50'}`}
                    >
                      <div className="w-4 h-4 flex-shrink-0"></div>
                      <span className="text-sm">Toutes les catégories</span>
                    </div>
                    {avisCategories.map((category) => (
                      <div 
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${selectedCategory === category.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-[var(--zalama-bg-light)]/50'}`}
                      >
                        <div className="w-4 h-4 flex-shrink-0"></div>
                        <span className="text-sm">{category.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 border-b border-[var(--zalama-border)] bg-[var(--zalama-bg-light)]/30">
                  <h3 className="text-sm font-medium text-[var(--zalama-text)]">Filtrer par note</h3>
                  <div className="mt-2 space-y-1">
                    <div 
                      onClick={() => setRatingFilter(null)}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${ratingFilter === null ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-[var(--zalama-bg-light)]/50'}`}
                    >
                      <span className="text-sm">Toutes les notes</span>
                    </div>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div 
                        key={rating}
                        onClick={() => setRatingFilter(rating)}
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${ratingFilter === rating ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-[var(--zalama-bg-light)]/50'}`}
                      >
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm">{rating} étoile{rating > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 flex justify-between">
                  <button 
                    onClick={() => {
                      setSelectedCategory(null);
                      setRatingFilter(null);
                      setCurrentPage(1);
                    }}
                    className="text-sm text-[var(--zalama-text)]/70 hover:text-[var(--zalama-text)] transition-colors"
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
        <div className="flex gap-2">
          <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]">
            <Calendar className="h-4 w-4" />
            <span>Historique</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)]">
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </button>
        </div>
      </div>
      
      {/* Liste des avis */}
      <div className="space-y-4 mt-2">
        {filteredAvis.length === 0 ? (
          <div className="bg-[var(--zalama-card)] rounded-lg border border-[var(--zalama-border)] p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <Search className="h-12 w-12 text-[var(--zalama-text)]/30 mb-4" />
              <h3 className="text-lg font-medium text-[var(--zalama-text)]">Aucun avis trouvé</h3>
              <p className="mt-1 text-sm text-[var(--zalama-text)]/70">
                Aucun avis ne correspond à vos critères de recherche ou de filtrage.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('');
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-xl">
                      {avis.employees ? `${avis.employees.prenom?.[0] || ''}${avis.employees.nom?.[0] || ''}` : 'U'}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--zalama-text)] text-center">
                    {avis.employees ? `${avis.employees.prenom} ${avis.employees.nom}` : 'Utilisateur inconnu'}
                  </h3>
                                      <p className="text-xs text-[var(--zalama-text)]/60 text-center">
                      {avis.employees?.poste || 'Poste non spécifié'}
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
                            className={`h-5 w-5 ${i < avis.note ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
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
                      "{avis.commentaire || 'Aucun commentaire'}"
                    </p>
                  </div>
                  
                  {/* Métadonnées */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--zalama-text)]/60">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{new Date(avis.date_avis).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-1">
                        <ThumbsUp className="h-3 w-3 text-green-500" />
                      </div>
                      <span>{avis.approuve ? 'Approuvé' : 'En attente'}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span>Note: {avis.note} étoiles</span>
                    </div>
                                          <div className="flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        <span>Poste: {avis.employees?.poste || 'Non spécifié'}</span>
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
          {filteredAvis.length === 0 
            ? "Aucun avis trouvé" 
            : filteredAvis.length === 1 
              ? "1 avis trouvé" 
              : `Affichage de ${indexOfFirstItem + 1} à ${Math.min(indexOfLastItem, filteredAvis.length)} sur ${filteredAvis.length} avis`
          }
        </div>
        {filteredAvis.length > 0 && (
          <div className="flex gap-1">
            <button 
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded border ${currentPage === 1 ? 'border-[var(--zalama-border)]/30 bg-[var(--zalama-bg-light)]/50 text-[var(--zalama-text)]/30 cursor-not-allowed' : 'border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-light)]/80'}`}
            >
              Précédent
            </button>
            
            {/* Affichage des boutons de pagination */}
            {[...Array(totalPages)].map((_, index) => {
              // Afficher au maximum 5 boutons de pagination
              if (totalPages <= 5 || 
                  // Toujours afficher la première page
                  index === 0 || 
                  // Toujours afficher la dernière page
                  index === totalPages - 1 ||
                  // Afficher les pages autour de la page courante
                  (index >= currentPage - 2 && index <= currentPage + 0)) {
                return (
                  <button 
                    key={index}
                    onClick={() => paginate(index + 1)}
                    className={`px-3 py-1 rounded border ${currentPage === index + 1 ? 'border-[var(--zalama-border)] bg-[var(--zalama-blue)] text-white' : 'border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-light)]/80'}`}
                  >
                    {index + 1}
                  </button>
                );
              } else if ((index === 1 && currentPage > 3) || (index === totalPages - 2 && currentPage < totalPages - 2)) {
                // Afficher des points de suspension pour indiquer des pages non affichées
                return (
                  <span key={index} className="px-3 py-1 text-[var(--zalama-text)]/70">...</span>
                );
              }
              return null;
            })}
            
            <button 
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-3 py-1 rounded border ${currentPage === totalPages || totalPages === 0 ? 'border-[var(--zalama-border)]/30 bg-[var(--zalama-bg-light)]/50 text-[var(--zalama-text)]/30 cursor-not-allowed' : 'border-[var(--zalama-border)] bg-[var(--zalama-bg-light)] text-[var(--zalama-text)] hover:bg-[var(--zalama-bg-light)]/80'}`}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
