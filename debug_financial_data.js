const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFinancialData() {
  console.log('🔍 Débogage des données financières...\n');

  try {
    // 1. Vérifier les types de transactions disponibles
    console.log('📋 Types de transactions dans la base :');
    const { data: typeData, error: typeError } = await supabase
      .from('financial_transactions')
      .select('type')
      .limit(100);

    if (typeError) {
      console.error('❌ Erreur lors de la récupération des types:', typeError);
      return;
    }

    const uniqueTypes = [...new Set(typeData.map(t => t.type))];
    console.log('Types uniques trouvés:', uniqueTypes);
    console.log('');

    // 2. Vérifier les statuts disponibles
    console.log('📋 Statuts de transactions dans la base :');
    const { data: statusData, error: statusError } = await supabase
      .from('financial_transactions')
      .select('statut')
      .limit(100);

    if (statusError) {
      console.error('❌ Erreur lors de la récupération des statuts:', statusError);
      return;
    }

    const uniqueStatuses = [...new Set(statusData.map(t => t.statut))];
    console.log('Statuts uniques trouvés:', uniqueStatuses);
    console.log('');

    // 3. Récupérer toutes les transactions avec détails
    console.log('📊 Toutes les transactions financières :');
    const { data: allTransactions, error: allError } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        partners (
          id,
          nom
        )
      `)
      .order('date_transaction', { ascending: false });

    if (allError) {
      console.error('❌ Erreur lors de la récupération des transactions:', allError);
      return;
    }

    console.log(`Total des transactions: ${allTransactions.length}\n`);

    // 4. Afficher les détails de chaque transaction
    allTransactions.forEach((transaction, index) => {
      console.log(`Transaction ${index + 1}:`);
      console.log(`  ID: ${transaction.id}`);
      console.log(`  Partenaire: ${transaction.partners?.nom || 'Non spécifié'}`);
      console.log(`  Type: "${transaction.type}"`);
      console.log(`  Statut: "${transaction.statut}"`);
      console.log(`  Montant: ${transaction.montant} GNF`);
      console.log(`  Description: ${transaction.description || 'Aucune'}`);
      console.log(`  Date: ${transaction.date_transaction}`);
      console.log(`  Référence: ${transaction.reference || 'Aucune'}`);
      console.log('');
    });

    // 5. Calculer les statistiques avec les vrais types
    console.log('💰 Calcul des statistiques avec les vrais types :');
    
    const stats = {
      total_debloque: 0,
      total_recupere: 0,
      total_revenus: 0,
      total_remboursements: 0,
      total_commissions: 0,
      total_transactions: allTransactions.length,
      montant_moyen: 0,
      balance: 0,
      pending_transactions: 0,
      repartition_par_type: {},
      repartition_par_statut: {}
    };

    if (allTransactions.length > 0) {
      const totalMontant = allTransactions.reduce((sum, t) => sum + Number(t.montant || 0), 0);
      stats.montant_moyen = totalMontant / allTransactions.length;

      allTransactions.forEach(transaction => {
        const montant = Number(transaction.montant || 0);
        const type = transaction.type;
        const statut = transaction.statut;

        // Compter par statut
        stats.repartition_par_statut[statut] = (stats.repartition_par_statut[statut] || 0) + 1;

        if (statut === 'Validé') {
          // Compter par type
          stats.repartition_par_type[type] = (stats.repartition_par_type[type] || 0) + montant;

          // Calculer les totaux selon le type exact
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
            default:
              console.log(`⚠️  Type non reconnu: "${type}" avec montant ${montant}`);
          }
        }

        if (statut === 'En attente') {
          stats.pending_transactions++;
        }
      });

      stats.balance = stats.total_debloque - stats.total_recupere + stats.total_revenus - stats.total_remboursements;
    }

    console.log('Statistiques calculées :');
    console.log(`  • Total débloqué: ${stats.total_debloque.toLocaleString()} GNF`);
    console.log(`  • Total récupéré: ${stats.total_recupere.toLocaleString()} GNF`);
    console.log(`  • Total revenus: ${stats.total_revenus.toLocaleString()} GNF`);
    console.log(`  • Total remboursements: ${stats.total_remboursements.toLocaleString()} GNF`);
    console.log(`  • Total commissions: ${stats.total_commissions.toLocaleString()} GNF`);
    console.log(`  • Balance: ${stats.balance.toLocaleString()} GNF`);
    console.log(`  • Transactions en attente: ${stats.pending_transactions}`);
    console.log(`  • Montant moyen: ${stats.montant_moyen.toLocaleString()} GNF`);

    console.log('\n📊 Répartition par type (montants) :');
    Object.entries(stats.repartition_par_type).forEach(([type, montant]) => {
      console.log(`  • "${type}": ${montant.toLocaleString()} GNF`);
    });

    console.log('\n📋 Répartition par statut (nombre) :');
    Object.entries(stats.repartition_par_statut).forEach(([statut, nombre]) => {
      console.log(`  • "${statut}": ${nombre} transactions`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error);
  }
}

// Exécuter le débogage
debugFinancialData(); 