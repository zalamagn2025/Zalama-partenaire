"use client";

import React, { useEffect, useState } from 'react';
import { Users, FileText, Star, BarChart2, CreditCard, Clock, AlertCircle, Download, Building2, ThumbsUp, ClipboardList } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import PerformanceFinanciere from '@/components/dashboard/PerformanceFinanciere';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
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
import { 
  employeeService, 
  alertService, 
  demandeAvanceService,
  dashboardService,
  PartnerDataService
} from '@/lib/services';
import { financialServiceFixed, messageServiceFixed, avisServiceFixed } from '@/lib/services_fixed';
import type { Employee, FinancialTransaction, Alert, Message, Avis, SalaryAdvanceRequest } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

// Fonction pour formatter les montants en GNF
const gnfFormatter = (value: number) => `${value.toLocaleString()} GNF`;

// Fonction pour formatter les dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function EntrepriseDashboardPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  
  // États pour les données dynamiques
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const [avis, setAvis] = useState<any[]>([]);
  const [demandes, setDemandes] = useState<SalaryAdvanceRequest[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ajoute le hook d'état pour les demandes d'avance
  const [salaryRequests, setSalaryRequests] = useState<any[]>([]);

  // Ajoute un état pour le payment_day
  const [paymentDay, setPaymentDay] = useState<number | null>(null);

  // Charger les données au montage du composant
  useEffect(() => {
    if (!loading && session?.partner) {
      loadDashboardData();
    }
  }, [loading, session?.partner]);

  const loadDashboardData = async () => {
    if (!session?.partner) return;
    
    setIsLoading(true);
    try {
      // Utiliser le service pour récupérer les vraies données
      const partnerService = new PartnerDataService(session.partner.id);
      
      const [employees, transactions, alerts, avis, demandes, stats] = await Promise.all([
        partnerService.getEmployees(),
        partnerService.getFinancialTransactions(),
        partnerService.getAlerts(),
        partnerService.getAvis(),
        partnerService.getSalaryAdvanceRequests(),
        partnerService.getPartnerStats()
      ]);

      // Définir les données récupérées de la base
      setEmployees(employees);
      setTransactions(transactions);
      setAlerts(alerts);
      setAvis(avis);
      setDemandes(demandes);

      // Définir les statistiques calculées
      setDashboardStats({
        total_employees: stats.totalEmployees,
        total_transactions: stats.totalTransactions,
        total_alerts: stats.totalAlerts,
        total_messages: 0, // Section messages supprimée
        total_avis: stats.totalAvis,
        total_demandes: stats.totalDemandes
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
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

  // Afficher un message de bienvenue
  useEffect(() => {
    if (session?.partner && !isLoading) {
      toast.success(`Bienvenue sur le tableau de bord de ${session.partner.nom}`, {
        id: 'dashboard-welcome'
      });
    }
  }, [session?.partner, isLoading]);

  // Ajoute une fonction utilitaire pour charger les avis dynamiquement :
  const loadAvis = async () => {
    try {
      const { data, error } = await supabase
        .from('avis')
        .select('*')
        .eq('partner_id', session?.partner?.id)
        .order('date_avis', { ascending: false });
      if (error) throw error;
      setAvis(data || []);
    } catch (e) {
      toast.error('Erreur lors du chargement des avis');
    }
  };
  useEffect(() => {
    if (!loading && session?.partner) {
      loadAvis();
    }
  }, [loading, session?.partner]);

  useEffect(() => {
    const loadTransactions = async () => {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('partenaire_id', session?.partner?.id)
        .eq('statut', 'Validé');
      if (!error) setTransactions(data || []);
    };
    if (!loading && session?.partner) loadTransactions();
  }, [loading, session?.partner]);

  // Ajoute le hook d'état pour les demandes d'avance
  useEffect(() => {
    const loadSalaryRequests = async () => {
      const { data, error } = await supabase
        .from('salary_advance_requests')
        .select('*')
        .eq('partenaire_id', session?.partner?.id)
        .eq('statut', 'Validé');
      if (!error) setSalaryRequests(data || []);
    };
    if (!loading && session?.partner) loadSalaryRequests();
  }, [loading, session?.partner]);

  // Récupère le payment_day du partenaire connecté
  useEffect(() => {
    const fetchPaymentDay = async () => {
      if (!session?.partner) return;
      // On suppose que le nom du partenaire dans partners = company_name dans partnership_requests
      const { data, error } = await supabase
        .from('partnership_requests')
        .select('payment_day')
        .eq('company_name', session.partner.nom)
        .eq('status', 'approved')
        .single();
      if (!error && data && data.payment_day) {
        setPaymentDay(data.payment_day);
      }
    };
    fetchPaymentDay();
  }, [session?.partner]);

  // Calcul de la date de remboursement et jours restants
  const now = new Date();
  let dateLimite = '';
  let joursRestants = '-';
  if (paymentDay) {
    let mois = now.getMonth();
    let annee = now.getFullYear();
    if (now.getDate() > paymentDay) {
      mois += 1;
      if (mois > 11) {
        mois = 0;
        annee += 1;
      }
    }
    const dateRemboursement = new Date(annee, mois, paymentDay);
    dateLimite = dateRemboursement.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    const diff = Math.ceil((dateRemboursement.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    joursRestants = diff > 0 ? `${diff} jours` : '0 jour';
  }

  // Si en cours de chargement, afficher un état de chargement
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si pas de session ou partenaire, afficher un message d'erreur
  if (!session?.partner) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Vous n'avez pas les permissions nécessaires pour accéder à ce tableau de bord.
          </p>
        </div>
      </div>
    );
  }

  // Calculer les statistiques
  const activeEmployees = employees.filter(emp => emp.actif);
  const totalSalary = activeEmployees.reduce((sum, emp) => sum + (emp.salaire_net || 0), 0);
  
  // Fonction utilitaire pour calculer les montants dynamiques
  const getMontantByType = (type: string) => {
    return transactions.filter((t: any) => t.type === type && t.statut === 'Validé').reduce((sum: number, t: any) => sum + Number(t.montant || 0), 0);
  };

  // Calculs dynamiques pour la section Performance financière
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const demandesValidees = salaryRequests;
  const demandesMois = demandesValidees.filter((d: any) => {
    const dVal = d.date_validation ? new Date(d.date_validation) : null;
    return dVal && dVal.getMonth() === thisMonth && dVal.getFullYear() === thisYear;
  });
  const fluxFinance = demandesValidees.reduce((sum: number, d: any) => sum + Number(d.montant_demande || 0), 0);
  const debloqueMois = demandesMois.reduce((sum: number, d: any) => sum + Number(d.montant_demande || 0), 0);
  const aRembourserMois = debloqueMois;
  // Récupère la date de paiement (date_adhesion du partenaire connecté)
  const datePaiement = session?.partner?.date_adhesion ? new Date(session.partner.date_adhesion) : null;
  let employesApprouves = 0;
  if (datePaiement) {
    // Cherche la dernière demande validée du mois
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const demandesMois = salaryRequests.filter((d: any) => {
      const dVal = d.date_validation ? new Date(d.date_validation) : null;
      return dVal && dVal.getMonth() === thisMonth && dVal.getFullYear() === thisYear;
    });
    if (demandesMois.length > 0) {
      const last = demandesMois.reduce((a: any, b: any) => new Date(a.date_validation) > new Date(b.date_validation) ? a : b);
      const dateValidation = new Date(last.date_validation);
      employesApprouves = new Set(demandesMois.map((d: any) => d.utilisateur_id)).size;
    }
  }

  // Calculer la balance
  const totalRecupere = transactions.filter(t => t.type === 'Récupéré' && t.statut === 'Validé').reduce((sum, trans) => sum + (trans.montant || 0), 0);
  const totalRevenus = transactions.filter(t => t.type === 'Revenu' && t.statut === 'Validé').reduce((sum, trans) => sum + (trans.montant || 0), 0);
  const totalRemboursements = transactions.filter(t => t.type === 'Remboursement' && t.statut === 'Validé').reduce((sum, trans) => sum + (trans.montant || 0), 0);
  const totalCommissions = transactions.filter(t => t.type === 'Commission' && t.statut === 'Validé').reduce((sum, trans) => sum + (trans.montant || 0), 0);
  const balance = totalRecupere - totalRemboursements + totalRevenus;
  
  const activeAlerts = alerts.filter(alert => alert.statut !== 'Résolue');
  const averageRating = avis.length > 0 ? avis.reduce((sum, av) => sum + av.note, 0) / avis.length : 0;
  const pendingDemandes = demandes.filter(dem => dem.statut === 'En attente');

  // Données pour les graphiques - 6 derniers mois + données récentes
  const getLast6Months = () => {
    const months = [];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // Obtenir les 6 derniers mois depuis maintenant
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        name: monthNames[date.getMonth()]
      });
    }
    return months;
  };

  const last6Months = getLast6Months();
  
  // Si pas de données dans les 6 derniers mois, utiliser les mois où il y a des données
  const getMonthsWithData = () => {
    if (demandes.length === 0) return last6Months;
    
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthsWithData = new Set<string>();
    
    demandes.forEach(demande => {
      const date = new Date(demande.date_creation);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthsWithData.add(key);
    });
    
    const monthsArray = Array.from(monthsWithData).map((key: string) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month,
        year,
        name: monthNames[month]
      };
    }).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    
    // Si on a des données récentes, les inclure
    return monthsArray.length > 0 ? monthsArray : last6Months;
  };

  const monthsToShow = getMonthsWithData();
  
  const demandesEvolutionData = monthsToShow.map(({ month, year, name }) => {
    const count = demandes.filter(d => {
      const demandDate = new Date(d.date_creation);
      return demandDate.getMonth() === month && demandDate.getFullYear() === year;
    }).length;
    
    return { mois: name, demandes: count };
  });

  const montantsEvolutionData = monthsToShow.map(({ month, year, name }) => {
    const total = demandes.filter(d => {
      const demandDate = new Date(d.date_creation);
      return demandDate.getMonth() === month && demandDate.getFullYear() === year;
    }).reduce((sum, d) => sum + d.montant_demande, 0);
    
    return { mois: name, montant: total };
  });

  // Calculer la répartition par motifs à partir des vraies données
  const motifCounts = demandes.reduce((acc, demande) => {
    acc[demande.type_motif] = (acc[demande.type_motif] || 0) + 1;
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

  // Si pas de données, créer des données par défaut pour éviter les graphiques vides
  const hasDemandesData = demandes.length > 0;
  const hasMotifsData = repartitionMotifsData.length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* En-tête du tableau de bord */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-900 rounded-lg w-12 h-12 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{session?.partner?.nom?.slice(0,4)?.toUpperCase()}</span>
          </div>
        <div>
            <h1 className="text-xl font-bold text-white">{session?.partner?.nom}</h1>
            <p className="text-gray-400 text-xs">{session?.partner?.secteur} • {activeEmployees.length} employés</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-blue-400 text-xs">Partenaire depuis {session?.partner?.date_adhesion ? new Date(session.partner.date_adhesion).getFullYear() : ''}</span>
          <span className="bg-green-900 text-green-400 text-xs px-3 py-1 rounded-full mt-1">Compte actif</span>
        </div>
      </div>

      {/* Cartes statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard
          title="Employés inscrits"
          value={`${activeEmployees.length}/${employees.length}`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Demandes totales"
          value={demandes.length}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Demandes par employé"
          value={(activeEmployees.length > 0 ? (demandes.length/activeEmployees.length).toFixed(1) : '0.0')}
          icon={ClipboardList}
          color="yellow"
        />
        <StatCard
          title="Note moyenne"
          value={averageRating.toFixed(1)}
          icon={Star}
          color="green"
        />
      </div>

      {/* Performance financière */}
      <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-xl p-6 mt-8">
        <h2 className="text-white text-lg font-semibold mb-4">Performance financière</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start">
            <span className="text-gray-400 text-xs mb-1">Montant total débloqué</span>
            <span className="text-2xl font-bold text-white">{gnfFormatter(debloqueMois)}</span>
          </div>
          <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start">
            <span className="text-gray-400 text-xs mb-1">À rembourser ce mois</span>
            <span className="text-2xl font-bold text-white">{gnfFormatter(aRembourserMois)}</span>
          </div>
          <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start">
            <span className="text-gray-400 text-xs mb-1">Taux de remboursement</span>
            <span className="text-2xl font-bold text-white">{((aRembourserMois/debloqueMois)*100 || 0).toFixed(1)}%</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start">
            <span className="text-gray-400 text-xs mb-1">Date limite de remboursement</span>
            <span className="text-lg font-bold text-white">{dateLimite}</span>
          </div>
          <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 flex flex-col items-start">
            <span className="text-gray-400 text-xs mb-1">Jours restants avant Remboursement</span>
            <span className="text-lg font-bold text-white">{joursRestants}</span>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-yellow-400 h-2 rounded-full" style={{width: `${(aRembourserMois/debloqueMois)*100}%`}}></div>
            </div>
            <span className="text-xs text-gray-400 mt-1">Remboursement cette semaine</span>
          </div>
        </div>
      </div>

      {/* Visualisations et Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Évolution des demandes */}
        <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6">
          <h3 className="text-white text-base font-semibold mb-4">Évolution des demandes</h3>
          {hasDemandesData ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={demandesEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232C3B" />
                <XAxis dataKey="mois" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="demandes" stroke="#4F8EF7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>
        {/* Montants débloqués */}
        <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6">
          <h3 className="text-white text-base font-semibold mb-4">Montants débloqués</h3>
          {hasDemandesData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={montantsEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232C3B" />
                <XAxis dataKey="mois" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip formatter={(value) => gnfFormatter(Number(value))} />
                <Legend />
                <Bar dataKey="montant" fill="#4F8EF7" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Répartition par motif + Documents et rapports sur la même ligne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Répartition par motif */}
        <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg shadow p-6 flex flex-col items-center justify-center">
          <h3 className="text-white text-base font-semibold mb-4">Répartition par motif</h3>
          {hasMotifsData ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={repartitionMotifsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ motif, valeur }) => `${motif} (${valeur})`}
                  outerRadius={70}
                  fill="#4F8EF7"
                  dataKey="valeur"
                >
                  {repartitionMotifsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>
        {/* Documents et rapports */}
        <div className="bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Documents et rapports</h2>
            <button className="text-blue-400 text-sm hover:underline">Tout télécharger</button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { nom: 'Relevé mensuel - Mai 2025', type: 'PDF', size: '1.2 MB', url: '/docs/releve_mai2025.pdf' },
              { nom: "Rapport d'activité - T1 2025", type: 'PDF', size: '2.8 MB', url: '/docs/rapport_t1_2025.pdf' },
              { nom: 'Échéancier de remboursement', type: 'XLSX', size: '0.9 MB', url: '/docs/echeancier.xlsx' },
              { nom: 'Statistiques utilisateurs', type: 'XLSX', size: '1.3 MB', url: '/docs/stats.xlsx' },
              { nom: 'Contrat de partenariat', type: 'PDF', size: '3.2 MB', url: '/docs/contrat.pdf' },
              { nom: "Guide d'utilisation", type: 'PDF', size: '4.5 MB', url: '/docs/guide.pdf' },
            ].map((doc, idx) => (
              <a key={idx} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-20 rounded-lg p-4 hover:bg-[#22304a] transition mb-2">
                <span className="mr-4">
                  {doc.type === 'PDF' ? (
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#2563eb"/><text x="50%" y="60%" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">PDF</text></svg>
                  ) : (
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#059669"/><text x="50%" y="60%" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">XLSX</text></svg>
                  )}
                </span>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{doc.nom}</div>
                  <div className="text-gray-400 text-xs mt-1">{doc.type} • {doc.size}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}