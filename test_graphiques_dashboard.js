// Script pour tester les données des graphiques du dashboard
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mspmrzlqhwpdkkburjiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGraphiquesDashboard() {
  console.log('=== TEST DES GRAPHIQUES DU DASHBOARD ===\n');
  
  const partnerId = 'e58fc4f9-83c9-45a2-a7b3-275d382664f9'; // YouCompany
  
  // Récupérer toutes les demandes
  const { data: demandes, error } = await supabase
    .from('salary_advance_requests')
    .select(`
      *,
      employees (
        id,
        nom,
        prenom,
        email,
        poste
      )
    `)
    .eq('partenaire_id', partnerId)
    .order('date_creation', { ascending: false });

  if (error) {
    console.error('❌ Erreur récupération demandes:', error);
    return;
  }

  console.log(`✅ ${demandes.length} demandes récupérées\n`);

  // Fonction pour obtenir les 6 derniers mois
  const getLast6Months = () => {
    const months = [];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
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
  
  console.log('📅 6 derniers mois analysés:');
  last6Months.forEach(({ month, year, name }) => {
    console.log(`   ${name} ${year} (mois ${month})`);
  });
  console.log('');

  // Calculer l'évolution des demandes
  console.log('📊 ÉVOLUTION DES DEMANDES:');
  const demandesEvolutionData = last6Months.map(({ month, year, name }) => {
    const count = demandes.filter(d => {
      const demandDate = new Date(d.date_creation);
      return demandDate.getMonth() === month && demandDate.getFullYear() === year;
    }).length;
    
    console.log(`   ${name} ${year}: ${count} demandes`);
    return { mois: name, demandes: count };
  });

  console.log('');

  // Calculer l'évolution des montants
  console.log('💰 ÉVOLUTION DES MONTANTS:');
  const montantsEvolutionData = last6Months.map(({ month, year, name }) => {
    const total = demandes.filter(d => {
      const demandDate = new Date(d.date_creation);
      return demandDate.getMonth() === month && demandDate.getFullYear() === year;
    }).reduce((sum, d) => sum + d.montant_demande, 0);
    
    console.log(`   ${name} ${year}: ${total.toLocaleString()} GNF`);
    return { mois: name, montant: total };
  });

  console.log('');

  // Calculer la répartition par motifs
  console.log('🎯 RÉPARTITION PAR MOTIFS:');
  const motifCounts = demandes.reduce((acc, demande) => {
    acc[demande.type_motif] = (acc[demande.type_motif] || 0) + 1;
    return acc;
  }, {});

  Object.entries(motifCounts).forEach(([motif, count]) => {
    const percentage = ((count / demandes.length) * 100).toFixed(1);
    console.log(`   ${motif}: ${count} demandes (${percentage}%)`);
  });

  console.log('');

  // Afficher les données pour les graphiques
  console.log('📈 DONNÉES POUR LES GRAPHIQUES:');
  console.log('Évolution des demandes:', JSON.stringify(demandesEvolutionData, null, 2));
  console.log('');
  console.log('Évolution des montants:', JSON.stringify(montantsEvolutionData, null, 2));

  // Vérifier si les graphiques auront des données
  const hasDemandesData = demandes.length > 0;
  const totalDemandes = demandesEvolutionData.reduce((sum, item) => sum + item.demandes, 0);
  const totalMontants = montantsEvolutionData.reduce((sum, item) => sum + item.montant, 0);

  console.log('\n🎯 CONCLUSION:');
  console.log(`   • Demandes totales: ${demandes.length}`);
  console.log(`   • Demandes dans les 6 derniers mois: ${totalDemandes}`);
  console.log(`   • Montant total dans les 6 derniers mois: ${totalMontants.toLocaleString()} GNF`);
  
  if (hasDemandesData && totalDemandes > 0) {
    console.log('✅ Les graphiques afficheront des données dynamiques');
  } else {
    console.log('❌ Les graphiques n\'afficheront pas de données');
  }
}

testGraphiquesDashboard().catch(console.error); 