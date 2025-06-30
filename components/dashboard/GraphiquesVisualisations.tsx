import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar} from 'recharts';

export default function GraphiquesVisualisations() {
  // Données pour l'évolution mensuelle
  const monthlyData = [
    { name: 'Jan', demandes: 400, remboursements: 240, revenus: 100 },
    { name: 'Fév', demandes: 300, remboursements: 180, revenus: 80 },
    { name: 'Mar', demandes: 500, remboursements: 320, revenus: 120 },
    { name: 'Avr', demandes: 450, remboursements: 300, revenus: 110 },
    { name: 'Mai', demandes: 600, remboursements: 400, revenus: 140 },
    { name: 'Juin', demandes: 550, remboursements: 380, revenus: 130 },
  ];

  // Données pour les barres comparatives
  const companiesData = [
    { name: 'Acme Inc', value: 48 },
    { name: 'Globex', value: 36 },
    { name: 'Initech', value: 40 },
    { name: 'Umbrella', value: 28 },
    { name: 'Autres', value: 32 },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-[var(--zalama-blue)]">Graphiques & Visualisations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm md:text-base font-medium mb-3 text-[var(--zalama-text)]">Courbes d&apos;évolution mensuelle</h3>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
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
          <h3 className="text-sm md:text-base font-medium mb-3 text-[var(--zalama-text)]">Barres comparatives</h3>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={companiesData}
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
