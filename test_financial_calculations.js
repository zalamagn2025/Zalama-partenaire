const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour calculer les statistiques financières
function calculateAdvancedStats(transactions) {
  const stats = {
    total_debloque: 0,
    total_recupere: 0,
    total_revenus: 0,
    total_remboursements: 0,
    total_commissions: 0,
    total_transactions: transactions.length,
    montant_moyen: 0,
    balance: 0,
    pending_transactions: 0,
    evolution_mensuelle: [],
    repartition_par_type: [],
    repartition_par_statut: []
  };

  if (transactions.length > 0) {
    const totalMontant = transactions.reduce((sum, transaction) => sum + Number(transaction.montant || 0), 0);
    stats.montant_moyen = totalMontant / transactions.length;

    // Calculer les totaux par type
    transactions.forEach(transaction => {
      const montant = Number(transaction.montant || 0);
      const type = transaction.type?.toLowerCase();
      const statut = transaction.statut;

      if (statut === 'Validé') {
        switch (type) {
          case 'debloque':
            stats.total_debloque += montant;
            break;
          case 'recupere':
            stats.total_recupere += montant;
            break;
          case 'revenu':
            stats.total_revenus += montant;
            break;
          case 'remboursement':
            stats.total_remboursements += montant;
            break;
          case 'commission':
            stats.total_commissions += montant;
            break;
        }
      }

      if (statut === 'En attente') {
        stats.pending_transactions++;
      }
    });

    // Calculer la balance
    stats.balance = stats.total_debloque - stats.total_recupere + stats.total_revenus - stats.total_remboursements;

    // Calculer l'évolution mensuelle
    stats.evolution_mensuelle = calculateMonthlyEvolution(transactions);

    // Calculer la répartition par type
    stats.repartition_par_type = calculateTypeDistribution(transactions);

    // Calculer la répartition par statut
    stats.repartition_par_statut = calculateStatusDistribution(transactions);
  }

  return stats;
}

// Calculer l'évolution mensuelle
function calculateMonthlyEvolution(transactions) {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const currentYear = new Date().getFullYear();
  
  return months.map((month, index) => {
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date_transaction);
      return transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === index;
    });

    const debloque = monthTransactions
      .filter(t => t.type?.toLowerCase() === 'debloque' && t.statut === 'Validé')
      .reduce((sum, t) => sum + Number(t.montant || 0), 0);

    const recupere = monthTransactions
      .filter(t => t.type?.toLowerCase() === 'recupere' && t.statut === 'Validé')
      .reduce((sum, t) => sum + Number(t.montant || 0), 0);

    const revenus = monthTransactions
      .filter(t => t.type?.toLowerCase() === 'revenu' && t.statut === 'Validé')
      .reduce((sum, t) => sum + Number(t.montant || 0), 0);

    return {
      mois: month,
      debloque,
      recupere,
      revenus,
      balance: debloque - recupere + revenus
    };
  });
}

// Calculer la répartition par type
function calculateTypeDistribution(transactions) {
  const typeMap = new Map();
  
  transactions.forEach(t => {
    if (t.statut === 'Validé') {
      const type = t.type || 'Autre';
      typeMap.set(type, (typeMap.get(type) || 0) + Number(t.montant || 0));
    }
  });

  return Array.from(typeMap.entries()).map(([name, value]) => ({
    name,
    value
  }));
}

// Calculer la répartition par statut
function calculateStatusDistribution(transactions) {
  const statusMap = new Map();
  
  transactions.forEach(t => {
    const status = t.statut || 'Inconnu';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  return Array.from(statusMap.entries()).map(([name, value]) => ({
    name,
    value
  }));
}

// Fonction principale de test
async function testFinancialCalculations() {
  console.log('🧪 Test des calculs financiers dynamiques...\n');

  try {
    // Récupérer tous les partenaires
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id, nom')
      .eq('actif', true);

    if (partnersError) {
      console.error('❌ Erreur lors de la récupération des partenaires:', partnersError);
      return;
    }

    console.log(`📊 Test sur ${partners.length} partenaires actifs\n`);

    for (const partner of partners) {
      console.log(`\n🏢 Partenaire: ${partner.nom} (ID: ${partner.id})`);
      console.log('─'.repeat(50));

      // Récupérer les transactions du partenaire
      const { data: transactions, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('partenaire_id', partner.id)
        .order('date_transaction', { ascending: false });

      if (transactionsError) {
        console.error(`❌ Erreur pour ${partner.nom}:`, transactionsError);
        continue;
      }

      console.log(`📈 Transactions trouvées: ${transactions.length}`);

      if (transactions.length === 0) {
        console.log('⚠️  Aucune transaction pour ce partenaire');
        continue;
      }

      // Calculer les statistiques
      const stats = calculateAdvancedStats(transactions);

      // Afficher les résultats
      console.log('\n💰 Statistiques financières:');
      console.log(`   • Total débloqué: ${stats.total_debloque.toLocaleString()} GNF`);
      console.log(`   • Total récupéré: ${stats.total_recupere.toLocaleString()} GNF`);
      console.log(`   • Total revenus: ${stats.total_revenus.toLocaleString()} GNF`);
      console.log(`   • Total remboursements: ${stats.total_remboursements.toLocaleString()} GNF`);
      console.log(`   • Total commissions: ${stats.total_commissions.toLocaleString()} GNF`);
      console.log(`   • Balance: ${stats.balance.toLocaleString()} GNF`);
      console.log(`   • Transactions en attente: ${stats.pending_transactions}`);
      console.log(`   • Montant moyen: ${stats.montant_moyen.toLocaleString()} GNF`);

      // Afficher la répartition par type
      if (stats.repartition_par_type.length > 0) {
        console.log('\n📊 Répartition par type:');
        stats.repartition_par_type.forEach(item => {
          const percentage = ((item.value / stats.total_transactions) * 100).toFixed(1);
          console.log(`   • ${item.name}: ${item.value.toLocaleString()} GNF (${percentage}%)`);
        });
      }

      // Afficher la répartition par statut
      if (stats.repartition_par_statut.length > 0) {
        console.log('\n📋 Répartition par statut:');
        stats.repartition_par_statut.forEach(item => {
          const percentage = ((item.value / stats.total_transactions) * 100).toFixed(1);
          console.log(`   • ${item.name}: ${item.value} transactions (${percentage}%)`);
        });
      }

      // Afficher l'évolution mensuelle (seulement les mois avec des données)
      const monthsWithData = stats.evolution_mensuelle.filter(month => 
        month.debloque > 0 || month.recupere > 0 || month.revenus > 0
      );

      if (monthsWithData.length > 0) {
        console.log('\n📅 Évolution mensuelle (mois avec données):');
        monthsWithData.forEach(month => {
          console.log(`   • ${month.mois}: Débloqué=${month.debloque.toLocaleString()}, Récupéré=${month.recupere.toLocaleString()}, Revenus=${month.revenus.toLocaleString()}, Balance=${month.balance.toLocaleString()}`);
        });
      }

      console.log('\n✅ Calculs terminés pour ce partenaire');
    }

    console.log('\n🎉 Test des calculs financiers terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testFinancialCalculations(); 