const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardFinancial() {
  console.log('🧪 Test des calculs financiers du tableau de bord...\n');

  try {
    // Récupérer tous les partenaires
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id, nom')
      .eq('actif', true)
      .limit(5);

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

      // Calculer les statistiques comme dans le tableau de bord
      const debloquedTransactions = transactions.filter(t => t.type === 'Débloqué' && t.statut === 'Validé');
      const totalDebloque = debloquedTransactions.reduce((sum, trans) => sum + (trans.montant || 0), 0);
      
      const totalRecupere = transactions.filter(t => t.type === 'Récupéré' && t.statut === 'Validé').reduce((sum, trans) => sum + (trans.montant || 0), 0);
      const totalRevenus = transactions.filter(t => t.type === 'Revenu' && t.statut === 'Validé').reduce((sum, trans) => sum + (trans.montant || 0), 0);
      const totalRemboursements = transactions.filter(t => t.type === 'Remboursement' && t.statut === 'Validé').reduce((sum, trans) => sum + (trans.montant || 0), 0);
      const totalCommissions = transactions.filter(t => t.type === 'Commission' && t.statut === 'Validé').reduce((sum, trans) => sum + (trans.montant || 0), 0);

      // Calculer la balance
      const balance = totalDebloque - totalRecupere + totalRevenus - totalRemboursements;

      // Afficher les résultats
      console.log('\n💰 Statistiques du tableau de bord:');
      console.log(`   • Montant total débloqué: ${totalDebloque.toLocaleString()} GNF`);
      console.log(`   • Montant total récupéré: ${totalRecupere.toLocaleString()} GNF`);
      console.log(`   • Total revenus: ${totalRevenus.toLocaleString()} GNF`);
      console.log(`   • Total remboursements: ${totalRemboursements.toLocaleString()} GNF`);
      console.log(`   • Total commissions: ${totalCommissions.toLocaleString()} GNF`);
      console.log(`   • Balance actuelle: ${balance.toLocaleString()} GNF`);

      // Afficher les détails des transactions validées
      const validTransactions = transactions.filter(t => t.statut === 'Validé');
      if (validTransactions.length > 0) {
        console.log('\n📋 Transactions validées:');
        validTransactions.forEach((transaction, index) => {
          console.log(`   ${index + 1}. ${transaction.type}: ${transaction.montant.toLocaleString()} GNF - ${transaction.description || 'Aucune description'}`);
        });
      }

      // Afficher les transactions en attente
      const pendingTransactions = transactions.filter(t => t.statut === 'En attente');
      if (pendingTransactions.length > 0) {
        console.log(`\n⏳ Transactions en attente: ${pendingTransactions.length}`);
        pendingTransactions.forEach((transaction, index) => {
          console.log(`   ${index + 1}. ${transaction.type}: ${transaction.montant.toLocaleString()} GNF - ${transaction.description || 'Aucune description'}`);
        });
      }

      console.log('\n✅ Calculs du tableau de bord terminés pour ce partenaire');
    }

    console.log('\n🎉 Test des calculs financiers du tableau de bord terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testDashboardFinancial(); 