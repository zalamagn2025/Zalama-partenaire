import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { PartnerDataService } from '@/lib/services';

interface ChartData {
  monthlyData: Array<{
    name: string;
    demandes: number;
    remboursements: number;
    revenus: number;
  }>;
  companiesData: Array<{
    name: string;
    value: number;
  }>;
}

export default function GraphiquesVisualisations() {
  const { session } = useAuth();
  const [chartData, setChartData] = useState<ChartData>({
    monthlyData: [],
    companiesData: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.partner) {
      loadChartData();
    }
  }, [session?.partner]);

  const loadChartData = async () => {
    if (!session?.partner) return;

    setIsLoading(true);
    try {
      const partnerService = new PartnerDataService(session.partner.id);
      
      // Récupérer les données financières pour les graphiques
      const financialData = await partnerService.getFinancialTransactions();
      const demandesData = await partnerService.getDemandesAvanceSalaire();
      
      // Calculer les données mensuelles
      const monthlyData = calculateMonthlyData(financialData, demandesData);
      
      // Calculer les données comparatives (pour l'instant, on utilise les données du partenaire actuel)
  const companiesData = [
        { name: session.partner.nom, value: 100 }
      ];

      setChartData({ monthlyData, companiesData });
    } catch (error) {
      console.error('Erreur lors du chargement des données de graphiques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyData = (financialData: any[], demandesData: any[]) => {
    const monthlyStats: { [key: string]: { demandes: number; remboursements: number; revenus: number } } = {};
    
    // Initialiser les 6 derniers mois
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    months.forEach(month => {
      monthlyStats[month] = { demandes: 0, remboursements: 0, revenus: 0 };
    });

    // Calculer les demandes par mois
    demandesData.forEach(demande => {
      const date = new Date(demande.date_demande || demande.created_at);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short' });
      if (monthlyStats[monthKey]) {
        monthlyStats[monthKey].demandes += 1;
      }
    });

    // Calculer les transactions financières par mois
    financialData.forEach(transaction => {
      const date = new Date(transaction.date_transaction || transaction.created_at);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      if (monthlyStats[monthKey]) {
        if (transaction.type === 'Récupéré') {
          monthlyStats[monthKey].remboursements += Number(transaction.montant) || 0;
        } else if (transaction.type === 'Revenu') {
          monthlyStats[monthKey].revenus += Number(transaction.montant) || 0;
        }
      }
    });

    return months.map(month => ({
      name: month,
      ...monthlyStats[month]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--zalama-text-secondary)]">Chargement des graphiques...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-[var(--zalama-blue)]">Graphiques & Visualisations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm md:text-base font-medium mb-3 text-[var(--zalama-text)]">Courbes d&apos;évolution mensuelle</h3>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.monthlyData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="var(--zalama-text-secondary)" fontSize={12} />
                <YAxis stroke="var(--zalama-text-secondary)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--zalama-bg-darker)', borderColor: 'var(--zalama-border)', color: 'var(--zalama-text-light)' }}
                  itemStyle={{ color: 'var(--zalama-text-light)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="demandes" 
                  stroke="var(--zalama-blue)" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: 'var(--zalama-blue)' }}
                  activeDot={{ r: 5 }}
                  name="Demandes"
                />
                <Line 
                  type="monotone" 
                  dataKey="remboursements" 
                  stroke="var(--zalama-green)" 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: 'var(--zalama-green)' }}
                  activeDot={{ r: 5 }}
                  name="Remboursements"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm md:text-base font-medium mb-3 text-[var(--zalama-text)]">Activité du partenaire</h3>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.companiesData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis dataKey="name" stroke="var(--zalama-text-secondary)" fontSize={12} />
                <YAxis stroke="var(--zalama-text-secondary)" fontSize={12} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Volume de transactions']}
                  contentStyle={{ backgroundColor: 'var(--zalama-bg-darker)', borderColor: 'var(--zalama-border)', color: 'var(--zalama-text-light)' }}
                  cursor={{ fill: 'rgba(var(--zalama-blue-rgb), 0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="var(--zalama-blue)" 
                  radius={[4, 4, 0, 0]}
                  name="Volume de transactions"
                  label={{ position: 'top', formatter: (value: number) => `${value}%`, fontSize: 12, fill: 'var(--zalama-text-secondary)' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
