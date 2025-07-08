"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Euro, TrendingUp, TrendingDown, Filter, Download, Printer, Users, Calendar, CreditCard, DollarSign, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/dashboard/StatCard';
import { toast } from 'sonner';
import { dashboardService, PartnerDataService } from '@/lib/services';
import { financialServiceFixed } from '@/lib/services_fixed';
import type { FinancialTransaction, Employee, FinancialTransactionWithEmployee } from '@/lib/supabase';
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
  Cell,
  BarChart,
  Bar
} from 'recharts';
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

// Interface pour les statistiques financières
interface FinancialStats {
  totalDebloque: number;
  totalRecupere: number;
  totalRevenus: number;
  totalRemboursements: number;
  totalCommissions: number;
  balance: number;
  pendingTransactions: number;
  totalTransactions: number;
  montantMoyen: number;
  evolutionMensuelle: any[];
  repartitionParType: any[];
  repartitionParStatut: any[];
}

export default function FinancesPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  
  // États pour les données financières
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransactionWithEmployee[]>([]);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    fluxFinance: 0,
    debloqueMois: 0,
    aRembourserMois: 0,
    dateLimite: '',
    nbEmployesApprouves: 0
  });
  const [salaryRequests, setSalaryRequests] = useState<any[]>([]);
  // Ajoute un état pour le payment_day
  const [paymentDay, setPaymentDay] = useState<number | null>(null);

  // Charger les demandes d'avance de salaire dynamiquement
  useEffect(() => {
    if (!loading && session?.partner) {
      loadSalaryAdvanceData();
    }
  }, [loading, session?.partner]);

  // Récupère le payment_day du partenaire connecté
  useEffect(() => {
    const fetchPaymentDay = async () => {
      if (!session?.partner) return;
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

  // Calcul de la date limite de remboursement
  const now = new Date();
  let dateLimite = '';
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
  }

  const loadSalaryAdvanceData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('salary_advance_requests')
        .select('*')
        .eq('partenaire_id', session?.partner?.id)
        .eq('statut', 'Validé');
      if (error) throw error;
      setSalaryRequests(data || []);
      // Calculs dynamiques SANS frais_service
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const demandesMois = (data || []).filter((d: any) => {
        const dVal = d.date_validation ? new Date(d.date_validation) : null;
        return dVal && dVal.getMonth() === thisMonth && dVal.getFullYear() === thisYear;
      });
      const fluxFinance = (data || []).reduce((sum: number, d: any) => sum + Number(d.montant_demande || 0), 0);
      const debloqueMois = demandesMois.reduce((sum: number, d: any) => sum + Number(d.montant_demande || 0), 0);
      const aRembourserMois = debloqueMois;
      // Date limite = date_validation dernière demande validée + 30j
      // let dateLimite = ''; // This line is now redundant as dateLimite is calculated above
      // if (demandesMois.length > 0) {
      //   const last = demandesMois.reduce((a: any, b: any) => new Date(a.date_validation) > new Date(b.date_validation) ? a : b);
      //   const date = new Date(last.date_validation);
      //   date.setDate(date.getDate() + 30);
      //   dateLimite = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      // }
      // Nombre d'employés approuvés ce mois-ci
      const employesApprouves = new Set(demandesMois.map((d: any) => d.employe_id)).size;
      setStats({
        fluxFinance,
        debloqueMois,
        aRembourserMois,
        dateLimite,
        nbEmployesApprouves: employesApprouves
      });
    } catch (e) {
      toast.error('Erreur lors du chargement des données financières');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer les statistiques financières dynamiques
  const calculateFinancialStats = (transactions: FinancialTransactionWithEmployee[]): FinancialStats => {
    // Calculs de base
    const totalDebloque = transactions
      .filter(t => t.type === 'Débloqué' && t.statut === 'Validé')
      .reduce((sum, t) => sum + (t.montant || 0), 0);
    
    const totalRecupere = transactions
      .filter(t => t.type === 'Récupéré' && t.statut === 'Validé')
      .reduce((sum, t) => sum + (t.montant || 0), 0);
      
    const totalRevenus = transactions
      .filter(t => t.type === 'Revenu' && t.statut === 'Validé')
      .reduce((sum, t) => sum + (t.montant || 0), 0);
      
    const totalRemboursements = transactions
      .filter(t => t.type === 'Remboursement' && t.statut === 'Validé')
      .reduce((sum, t) => sum + (t.montant || 0), 0);

    const totalCommissions = transactions
      .filter(t => t.type === 'Commission' && t.statut === 'Validé')
      .reduce((sum, t) => sum + (t.montant || 0), 0);

    const pendingTransactions = transactions.filter(t => t.statut === 'En attente').length;
    const totalTransactions = transactions.length;
    const balance = totalDebloque - totalRecupere + totalRevenus - totalRemboursements;
    const montantMoyen = totalTransactions > 0 
      ? transactions.reduce((sum, t) => sum + (t.montant || 0), 0) / totalTransactions 
      : 0;

    // Calcul de l'évolution mensuelle
    const evolutionMensuelle = calculateMonthlyEvolution(transactions);

    // Répartition par type
    const repartitionParType = calculateTypeDistribution(transactions);

    // Répartition par statut
    const repartitionParStatut = calculateStatusDistribution(transactions);

    return {
      totalDebloque,
      totalRecupere,
      totalRevenus,
      totalRemboursements,
      totalCommissions,
      balance,
      pendingTransactions,
      totalTransactions,
      montantMoyen,
      evolutionMensuelle,
      repartitionParType,
      repartitionParStatut
    };
  };

  // Calculer l'évolution mensuelle
  const calculateMonthlyEvolution = (transactions: FinancialTransactionWithEmployee[]) => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    
    const monthlyData = months.map((month, index) => {
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date_transaction);
        return transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === index;
      });

      const debloque = monthTransactions
        .filter(t => t.type === 'Débloqué' && t.statut === 'Validé')
        .reduce((sum, t) => sum + (t.montant || 0), 0);

      const recupere = monthTransactions
        .filter(t => t.type === 'Récupéré' && t.statut === 'Validé')
        .reduce((sum, t) => sum + (t.montant || 0), 0);

      const revenus = monthTransactions
        .filter(t => t.type === 'Revenu' && t.statut === 'Validé')
        .reduce((sum, t) => sum + (t.montant || 0), 0);

      return {
        mois: month,
        debloque,
        recupere,
        revenus,
        balance: debloque - recupere + revenus
      };
    });

    return monthlyData;
  };

  // Calculer la répartition par type
  const calculateTypeDistribution = (transactions: FinancialTransactionWithEmployee[]) => {
    const typeMap = new Map<string, number>();
    
    transactions.forEach(t => {
      if (t.statut === 'Validé') {
        const type = t.type || 'Autre';
        typeMap.set(type, (typeMap.get(type) || 0) + (t.montant || 0));
      }
    });

    const colors = {
      'Débloqué': '#3b82f6',
      'Récupéré': '#10b981',
      'Revenu': '#f59e0b',
      'Remboursement': '#ef4444',
      'Commission': '#8b5cf6',
      'Autre': '#6b7280'
    };

    return Array.from(typeMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: colors[name as keyof typeof colors] || '#6b7280'
    }));
  };

  // Calculer la répartition par statut
  const calculateStatusDistribution = (transactions: FinancialTransactionWithEmployee[]) => {
    const statusMap = new Map<string, number>();
    
    transactions.forEach(t => {
      const status = t.statut || 'Inconnu';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const colors = {
      'Validé': '#10b981',
      'En attente': '#f59e0b',
      'Rejeté': '#ef4444',
      'Annulé': '#6b7280',
      'Inconnu': '#9ca3af'
    };

    return Array.from(statusMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: colors[name as keyof typeof colors] || '#9ca3af'
    }));
  };

  const loadFinancialData = async () => {
    if (!session?.partner) return;
    
    setIsLoading(true);
    try {
      // Utiliser le service pour récupérer les vraies données
      const partnerService = new PartnerDataService(session.partner.id);
      const transactions = await partnerService.getFinancialTransactions();
      
      setTransactions(transactions);
      
      // Calculer les statistiques financières
      const stats = calculateFinancialStats(transactions);
      setFinancialStats(stats);

    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error);
      toast.error('Erreur lors du chargement des données financières');
    } finally {
      setIsLoading(false);
    }
  };

  // Pour l'historique des transactions, charge les données de financial_transactions :
  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('partenaire_id', session?.partner?.id)
        .order('date_transaction', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (e) {
      toast.error('Erreur lors du chargement des transactions');
    }
  };
  useEffect(() => {
    if (!loading && session?.partner) {
      loadTransactions();
    }
  }, [loading, session?.partner]);

  // Rediriger vers la page de login si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [loading, session, router]);

  // Filtrer les transactions
  useEffect(() => {
    let filtered = transactions;

    if (selectedType) {
      filtered = filtered.filter(transaction => transaction.type === selectedType);
    }

    if (selectedStatus) {
      filtered = filtered.filter(transaction => transaction.statut === selectedStatus);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, selectedType, selectedStatus]);

  // Pagination
  const transactionsPerPage = 10;
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  // Exporter les données au format CSV
  const handleExportCSV = () => {
    if (!session?.partner) return;
    
    const headers = ["ID", "Date", "Employé", "Poste", "Montant", "Type", "Description", "Statut", "Référence"];
    const csvData = [
      headers.join(","),
      ...transactions.map(transaction => [
        transaction.transaction_id,
        formatDate(transaction.date_transaction),
        transaction.employees ? `${transaction.employees.prenom} ${transaction.employees.nom}` : 'Non spécifié',
        transaction.employees?.poste || 'Non spécifié',
        transaction.montant,
        transaction.type,
        transaction.description || '',
        transaction.statut,
        transaction.reference || ''
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${session.partner.nom}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export CSV réussi');
  };

  // Si en cours de chargement, afficher un état de chargement
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête Finances */}
      <h1 className="text-2xl font-bold text-white mb-2">Finances</h1>
      <p className="text-gray-400 mb-6">Entreprise: {session.partner.nom}</p>
      {/* Cartes principales finances */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        <StatCard
          title="Flux du Montant Financé"
          value={gnfFormatter(stats.fluxFinance)}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Montant total débloqué ce mois ci"
          value={gnfFormatter(stats.debloqueMois)}
          icon={Calendar}
          color="green"
        />
        
        <StatCard
          title="Montant à rembourser ce mois ci"
          value={gnfFormatter(stats.aRembourserMois)}
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Date limite de Remboursement"
          value={dateLimite}
          icon={Calendar}
          color="green"
        />
      </div>

      {/* Statistiques supplémentaires */}
      {/* Remplace les cartes par :
      - Flux du montant financé
      - Montant total débloqué ce mois ci
      - Montant à rembourser ce mois ci
      - Date limite de remboursement
      - Nombre d’employés approuvés ce mois ci */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
            title="Nombre d'employés ayant eu une demande approuvée ce mois-ci"
            value={stats.nbEmployesApprouves}
            icon={Users}
            color="purple"
        />
      </div>

      {/* Graphiques */}
      {financialStats && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des montants */}
        <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Évolution mensuelle des montants
          </h3>
          <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financialStats.evolutionMensuelle}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip formatter={(value) => gnfFormatter(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="debloque" stroke="#3b82f6" strokeWidth={2} name="Débloqué" />
              <Line type="monotone" dataKey="recupere" stroke="#10b981" strokeWidth={2} name="Récupéré" />
                <Line type="monotone" dataKey="revenus" stroke="#f59e0b" strokeWidth={2} name="Revenus" />
                <Line type="monotone" dataKey="balance" stroke="#8b5cf6" strokeWidth={2} name="Balance" />
            </LineChart>
          </ResponsiveContainer>
        </div>

          {/* Répartition des transactions par type */}
        <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Répartition par type de transaction
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                  data={financialStats.repartitionParType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                  {financialStats.repartitionParType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => gnfFormatter(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Graphique de répartition par statut */}
      {financialStats && financialStats.repartitionParStatut.length > 0 && (
        <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition par statut des transactions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialStats.repartitionParStatut}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Filtre par type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de transaction
            </label>
            <select
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="w-full px-3 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tous les types</option>
              <option value="Débloqué">Débloqué</option>
              <option value="Récupéré">Récupéré</option>
              <option value="Revenu">Revenu</option>
              <option value="Remboursement">Remboursement</option>
              <option value="Commission">Commission</option>
            </select>
          </div>

          {/* Filtre par statut */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut
            </label>
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus(e.target.value || null)}
              className="w-full px-3 py-2 dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="Validé">Validé</option>
              <option value="Rejeté">Rejeté</option>
              <option value="Annulé">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des transactions */}
      <div className="bg-white dark:bg-[var(--zalama-card)] border border-[var(--zalama-border)] border-opacity-2 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historique des transactions ({filteredTransactions.length} transactions)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full  dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-[var(--zalama-card)] border-b border-[var(--zalama-border)] border-opacity-20">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Référence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[var(--zalama-card)] divide-y divide-gray-200 dark:divide-gray-700">
              {currentTransactions.length > 0 ? (
                currentTransactions.map((transaction) => (
                <tr key={transaction.transaction_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(transaction.date_transaction)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {transaction.employees ? `${transaction.employees.prenom} ${transaction.employees.nom}` : 'Non spécifié'}
                    {transaction.employees?.poste && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.employees.poste}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {transaction.description || 'Aucune description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'Débloqué' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      transaction.type === 'Récupéré' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      transaction.type === 'Revenu' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        transaction.type === 'Commission' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {gnfFormatter(transaction.montant || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.statut === 'Validé' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      transaction.statut === 'En attente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {transaction.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transaction.reference || '-'}
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Aucune transaction trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-[var(--zalama-card)] px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Affichage de <span className="font-medium">{indexOfFirstTransaction + 1}</span> à{' '}
                  <span className="font-medium">{Math.min(indexOfLastTransaction, filteredTransactions.length)}</span> sur{' '}
                  <span className="font-medium">{filteredTransactions.length}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
