"use client";

import React, { useEffect, useState } from 'react';
import { Users, FileText, Star, BarChart2, CreditCard, Clock, AlertCircle, Download, Building2, MessageSquare, ThumbsUp, ClipboardList } from 'lucide-react';
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
  financialService, 
  alertService, 
  messageService, 
  avisService, 
  demandeAvanceService,
  dashboardService 
} from '@/lib/services';
import type { Employee, FinancialTransaction, Alert, Message, Avis, SalaryAdvanceRequest } from '@/lib/supabase';

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
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [demandes, setDemandes] = useState<SalaryAdvanceRequest[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      // Charger toutes les données en parallèle
      const [
        employeesData,
        transactionsData,
        alertsData,
        messagesData,
        avisData,
        demandesData
      ] = await Promise.all([
        employeeService.getEmployees(session.partner.id),
        financialService.getTransactions(session.partner.id),
        alertService.getAlerts(session.partner.id),
        messageService.getMessages(session.partner.id),
        avisService.getAvis(session.partner.id),
        demandeAvanceService.getDemandes(session.partner.id)
      ]);

      if (employeesData.data) setEmployees(employeesData.data);
      if (transactionsData.data) setTransactions(transactionsData.data);
      if (alertsData.data) setAlerts(alertsData.data);
      if (messagesData.data) setMessages(messagesData.data);
      if (avisData.data) setAvis(avisData.data);
      if (demandesData.data) setDemandes(demandesData.data);

      // Calculer les stats localement
      const stats = {
        total_employees: employeesData.data?.length || 0,
        total_transactions: transactionsData.data?.length || 0,
        total_alerts: alertsData.data?.length || 0,
        total_messages: messagesData.data?.length || 0,
        total_avis: avisData.data?.length || 0,
        total_demandes: demandesData.data?.length || 0
      };
      
      setDashboardStats(stats);

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
  const totalTransactions = transactions.reduce((sum, trans) => sum + trans.montant, 0);
  const unreadMessages = messages.filter(msg => !msg.lu && msg.destinataire === session?.admin?.id);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {session?.partner?.nom} - {session?.partner?.secteur}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadDashboardData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Employés actifs"
          value={activeEmployees.length}
          total={employees.length}
          icon={Users}
          trend="+12%"
          trendDirection="up"
          color="blue"
        />
        <StatCard
          title="Montant total débloqué"
          value={gnfFormatter(totalTransactions)}
          icon={CreditCard}
          trend="+8.2%"
          trendDirection="up"
          color="green"
        />
        <StatCard
          title="Note moyenne"
          value={averageRating.toFixed(1)}
          icon={Star}
          trend="+0.3"
          trendDirection="up"
          color="yellow"
        />
        <StatCard
          title="Demandes en attente"
          value={pendingDemandes.length}
          icon={ClipboardList}
          trend="-5%"
          trendDirection="down"
          color="red"
        />
      </div>

      {/* Section Performance Financière */}
      {session?.partner && (
        <PerformanceFinanciere 
          className="mt-6" 
          totalTransactions={gnfFormatter(totalTransactions)} 
          dateLimite={session.partner.date_adhesion || new Date().toISOString()} 
        />
      )}

      {/* Graphiques et visualisations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des demandes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Évolution des demandes
          </h3>
          {hasDemandesData ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={demandesEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="demandes" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <BarChart2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>

        {/* Évolution des montants */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Évolution des montants débloqués
          </h3>
          {hasDemandesData ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={montantsEvolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip formatter={(value) => gnfFormatter(Number(value))} />
                <Legend />
                <Bar dataKey="montant" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Répartition par motifs et alertes récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par motifs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par motifs de demande
          </h3>
          {hasMotifsData ? (
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
                <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            </div>
          )}
        </div>

        {/* Alertes récentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Alertes récentes
          </h3>
          <div className="space-y-3">
            {activeAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <AlertCircle className={`w-5 h-5 mt-0.5 ${
                  alert.type === 'Critique' ? 'text-red-500' :
                  alert.type === 'Importante' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {alert.titre}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {alert.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDate(alert.date_creation)}
                  </p>
                </div>
              </div>
            ))}
            {activeAlerts.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Aucune alerte active
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages non lus et avis récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages non lus */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Messages récents
          </h3>
          <div className="space-y-3">
            {messages.slice(0, 5).map((message) => (
              <div key={message.message_id} className={`flex items-start space-x-3 p-3 rounded-lg ${
                !message.lu ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700'
              }`}>
                <MessageSquare className={`w-5 h-5 mt-0.5 ${
                  !message.lu ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {message.sujet}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {message.contenu.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDate(message.date_envoi)}
                  </p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Aucun message
              </p>
            )}
          </div>
        </div>

        {/* Avis récents */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Avis récents
          </h3>
          <div className="space-y-3">
            {avis.slice(0, 5).map((avisItem) => (
              <div key={avisItem.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <ThumbsUp className="w-5 h-5 mt-0.5 text-green-500" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {avisItem.note}/5
                    </span>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < avisItem.note ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {avisItem.commentaire && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {avisItem.commentaire.substring(0, 100)}...
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatDate(avisItem.date_avis)}
                  </p>
                </div>
              </div>
            ))}
            {avis.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Aucun avis
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
