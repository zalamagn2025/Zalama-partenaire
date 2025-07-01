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
  alertService, 
  demandeAvanceService,
  dashboardService 
} from '@/lib/services';
import { financialServiceFixed, messageServiceFixed, avisServiceFixed } from '@/lib/services_fixed';
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
      // Utiliser des données de test réalistes directement
      const mockEmployees = [
        { id: '1', partner_id: session.partner.id, nom: 'Diallo', prenom: 'Mamadou', actif: true, salaire_net: 2500000, poste: 'Développeur', genre: 'Homme', type_contrat: 'CDI', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', partner_id: session.partner.id, nom: 'Bah', prenom: 'Aissatou', actif: true, salaire_net: 2000000, poste: 'Designer', genre: 'Femme', type_contrat: 'CDI', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', partner_id: session.partner.id, nom: 'Sow', prenom: 'Ousmane', actif: true, salaire_net: 1800000, poste: 'Formateur', genre: 'Homme', type_contrat: 'CDD', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ] as Employee[];

      const mockTransactions = [
        { transaction_id: 1001, montant: 2500000, type: 'debloque', statut: 'Validé', description: 'Avance sur salaire - Janvier 2024', date_transaction: '2024-01-15', partenaire_id: session.partner.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { transaction_id: 1002, montant: 1800000, type: 'debloque', statut: 'Validé', description: 'Avance sur salaire - Février 2024', date_transaction: '2024-02-10', partenaire_id: session.partner.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { transaction_id: 1003, montant: 3200000, type: 'debloque', statut: 'Validé', description: 'Avance sur salaire - Mars 2024', date_transaction: '2024-03-05', partenaire_id: session.partner.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { transaction_id: 1004, montant: 2100000, type: 'recupere', statut: 'Validé', description: 'Remboursement - Mars 2024', date_transaction: '2024-03-25', partenaire_id: session.partner.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { transaction_id: 1005, montant: 4500000, type: 'debloque', statut: 'Validé', description: 'Avance sur salaire - Avril 2024', date_transaction: '2024-04-12', partenaire_id: session.partner.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ] as FinancialTransaction[];

      const mockAlerts = [
        { id: '1', titre: 'Pic d\'activité détecté', description: 'Un nombre inhabituel de demandes d\'avance a été enregistré', type: 'Information', statut: 'Nouvelle', date_creation: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), priorite: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', titre: 'Limite budgétaire approchée', description: 'Vous approchez de votre limite budgétaire mensuelle', type: 'Importante', statut: 'En cours', date_creation: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), priorite: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ] as Alert[];

      const mockMessages = [
        { message_id: '1', expediteur: 'Zalama Admin', destinataire: session.partner.nom, sujet: 'Nouvelle fonctionnalité', contenu: 'Une nouvelle fonctionnalité d\'avance sur salaire est disponible', type: 'Information', priorite: 'Normale', statut: 'Envoyé', lu: false, date_envoi: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { message_id: '2', expediteur: 'Support', destinataire: session.partner.nom, sujet: 'Validation requise', contenu: 'Plusieurs demandes nécessitent votre validation', type: 'Demande', priorite: 'Urgente', statut: 'Envoyé', lu: false, date_envoi: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ] as Message[];

      const mockAvis = [
        { id: '1', employee_id: '1', partner_id: session.partner.id, note: 5, commentaire: 'Excellent service', type_retour: 'positif', date_avis: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), approuve: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', employee_id: '2', partner_id: session.partner.id, note: 4, commentaire: 'Très satisfait du service', type_retour: 'positif', date_avis: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), approuve: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', employee_id: '3', partner_id: session.partner.id, note: 5, commentaire: 'Service rapide et efficace', type_retour: 'positif', date_avis: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), approuve: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ] as Avis[];

      const mockDemandes = [
        { id: '1', employe_id: '1', partenaire_id: session.partner.id, montant_demande: 1500000, type_motif: 'Urgence médicale', motif: 'Frais médicaux urgents', statut: 'En attente', date_creation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', employe_id: '2', partenaire_id: session.partner.id, montant_demande: 2000000, type_motif: 'Loyer', motif: 'Paiement du loyer', statut: 'En attente', date_creation: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', employe_id: '3', partenaire_id: session.partner.id, montant_demande: 800000, type_motif: 'Éducation', motif: 'Frais scolaires', statut: 'Validé', date_creation: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ] as SalaryAdvanceRequest[];

      // Définir les données directement
      setEmployees(mockEmployees);
      setTransactions(mockTransactions);
      setAlerts(mockAlerts);
      setMessages(mockMessages);
      setAvis(mockAvis);
      setDemandes(mockDemandes);

      // Calculer les stats
      const stats = {
        total_employees: mockEmployees.length,
        total_transactions: mockTransactions.length,
        total_alerts: mockAlerts.length,
        total_messages: mockMessages.length,
        total_avis: mockAvis.length,
        total_demandes: mockDemandes.length
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
  
  // Calculer les montants débloqués (même logique que la page finances)
  const debloquedTransactions = transactions.filter(t => t.type === 'debloque' && t.statut === 'Validé');
  const totalDebloque = debloquedTransactions.reduce((sum, trans) => sum + trans.montant, 0);
  
  // Calculer les autres montants
  const totalRecupere = transactions.filter(t => t.type === 'recupere' && t.statut === 'Validé').reduce((sum, trans) => sum + trans.montant, 0);
  const totalCommissions = transactions.filter(t => t.type === 'commission').reduce((sum, trans) => sum + trans.montant, 0);
  
  // Messages non lus adressés au partenaire (utiliser le nom du partenaire au lieu de session.admin.id)
  const unreadMessages = messages.filter(msg => !msg.lu && msg.destinataire === session?.partner?.nom);
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
          color="blue"
        />
        <StatCard
          title="Montant total débloqué"
          value={gnfFormatter(totalDebloque)}
          icon={CreditCard}
          color="green"
        />
        <StatCard
          title="Note moyenne"
          value={averageRating.toFixed(1)}
          icon={Star}
          color="yellow"
        />
        <StatCard
          title="Demandes en attente"
          value={pendingDemandes.length}
          icon={ClipboardList}
          color="red"
        />
      </div>

      {/* Section Performance Financière */}
      {session?.partner && (
        <PerformanceFinanciere 
          className="mt-6" 
          totalTransactions={gnfFormatter(totalDebloque)} 
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

      {/* Alertes et avis récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Messages récents */}
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
      </div>
    </div>
  );
}
