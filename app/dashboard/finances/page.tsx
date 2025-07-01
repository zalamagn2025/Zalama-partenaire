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

export default function FinancesPage() {
  const { session, loading } = useAuth();
  const router = useRouter();
  
  // États pour les données financières
  const [transactions, setTransactions] = useState<FinancialTransactionWithEmployee[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransactionWithEmployee[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Charger les données financières
  useEffect(() => {
    if (!loading && session?.partner) {
      loadFinancialData();
    }
  }, [loading, session?.partner]);

  const loadFinancialData = async () => {
    if (!session?.partner) return;
    
    setIsLoading(true);
    try {
      // Utiliser le service pour récupérer les vraies données
      const partnerService = new PartnerDataService(session.partner.id);
      const transactions = await partnerService.getFinancialTransactions();
      
      setTransactions(transactions);

    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error);
      toast.error('Erreur lors du chargement des données financières');
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

  // Calculer les statistiques - utilisation des mêmes calculs que le dashboard
  const totalDebloque = transactions
    .filter(t => t.type === 'debloque' && t.statut === 'Validé')
    .reduce((sum, t) => sum + t.montant, 0);
  
  const totalRecupere = transactions
    .filter(t => t.type === 'recupere' && t.statut === 'Validé')
    .reduce((sum, t) => sum + t.montant, 0);
    
  const totalRevenus = transactions
    .filter(t => t.type === 'revenu' && t.statut === 'Validé')
    .reduce((sum, t) => sum + t.montant, 0);
    
  const totalRemboursements = transactions
    .filter(t => t.type === 'remboursement' && t.statut === 'Validé')
    .reduce((sum, t) => sum + t.montant, 0);

  const pendingTransactions = transactions.filter(t => t.statut === 'En attente').length;
  const balance = totalDebloque - totalRecupere + totalRevenus - totalRemboursements;

  // Données pour les graphiques
  const evolutionData = [
    { mois: 'Jan', debloque: 42000, recupere: 38000 },
    { mois: 'Fév', debloque: 38000, recupere: 35000 },
    { mois: 'Mar', debloque: 45000, recupere: 42000 },
    { mois: 'Avr', debloque: 52000, recupere: 48000 },
    { mois: 'Mai', debloque: 48000, recupere: 45000 },
  ];

  const repartitionData = [
    { name: 'Débloqué', value: totalDebloque, color: '#3b82f6' },
    { name: 'Récupéré', value: totalRecupere, color: '#10b981' },
    { name: 'Revenus', value: totalRevenus, color: '#f59e0b' },
    { name: 'Remboursements', value: totalRemboursements, color: '#ef4444' },
  ];

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
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Finances
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {session.partner.nom} - Gestion financière
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadFinancialData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Montant total débloqué"
          value={gnfFormatter(totalDebloque)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Montant total récupéré"
          value={gnfFormatter(totalRecupere)}
          icon={TrendingDown}
          color="blue"
        />
        <StatCard
          title="Balance actuelle"
          value={gnfFormatter(balance)}
          icon={Euro}
          color={balance >= 0 ? "green" : "red"}
        />
        <StatCard
          title="Transactions en attente"
          value={pendingTransactions}
          icon={CreditCard}
          color="yellow"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des montants */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Évolution des montants
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis />
              <Tooltip formatter={(value) => gnfFormatter(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="debloque" stroke="#3b82f6" strokeWidth={2} name="Débloqué" />
              <Line type="monotone" dataKey="recupere" stroke="#10b981" strokeWidth={2} name="Récupéré" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition des transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Répartition des transactions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={repartitionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {repartitionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => gnfFormatter(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Filtre par type */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de transaction
            </label>
            <select
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tous les types</option>
              <option value="Débloqué">Débloqué</option>
              <option value="Récupéré">Récupéré</option>
              <option value="Revenu">Revenu</option>
              <option value="Remboursement">Remboursement</option>
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historique des transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
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
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentTransactions.map((transaction) => (
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
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {gnfFormatter(transaction.montant)}
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
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
