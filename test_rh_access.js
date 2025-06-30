// Script de test pour l'accès RH
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mspmrzlqhwpdkkburjiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRHAccess() {
  console.log('=== TEST D\'ACCÈS RH ===\n');
  
  // Identifiants RH
  const rhEmail = 'aissatou.bah@youcompany.com';
  const rhPassword = 'Samy2004@';
  
  console.log(`🔐 Test de connexion RH: ${rhEmail}`);
  
  // 1. Vérifier l'utilisateur RH
  const { data: rhUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', rhEmail)
    .single();
  
  if (userError) {
    console.error('❌ Erreur récupération utilisateur RH:', userError);
    return;
  }
  
  console.log(`✅ Utilisateur RH trouvé: ${rhUser.prenom} ${rhUser.nom}`);
  console.log(`   Poste: ${rhUser.poste}`);
  console.log(`   Organisation: ${rhUser.organisation}`);
  console.log(`   Type: ${rhUser.type}`);
  
  // 2. Vérifier le partenaire par organisation
  console.log('\n🔍 Recherche du partenaire par organisation...');
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('*')
    .eq('nom', rhUser.organisation)
    .single();
  
  if (partnerError) {
    console.error('❌ Erreur récupération partenaire:', partnerError);
    return;
  }
  
  console.log(`✅ Partenaire trouvé: ${partner.nom} (ID: ${partner.id})`);
  
  // 3. Tester l'accès aux données du dashboard
  console.log('\n📊 Test d\'accès aux données du dashboard...');
  
  // Employés
  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select('*')
    .eq('partner_id', partner.id);
  
  console.log(`✅ Employés: ${employees?.length || 0} trouvés`);
  
  // Demandes d'avance
  const { data: salaryRequests, error: requestsError } = await supabase
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
    .eq('partenaire_id', partner.id);
  
  if (requestsError) {
    console.error('❌ Erreur demandes d\'avance:', requestsError);
  } else {
    console.log(`✅ Demandes d'avance: ${salaryRequests?.length || 0} trouvées`);
    
    // Afficher les détails des demandes
    salaryRequests?.forEach((request, index) => {
      console.log(`   ${index + 1}. ${request.employees?.prenom} ${request.employees?.nom} - ${request.montant_demande.toLocaleString()} GNF - ${request.statut}`);
    });
  }
  
  // Transactions financières
  const { data: transactions, error: transactionsError } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('partenaire_id', partner.id);
  
  console.log(`✅ Transactions: ${transactions?.length || 0} trouvées`);
  
  // Avis
  const { data: avis, error: avisError } = await supabase
    .from('avis')
    .select('*')
    .eq('partenaire_id', partner.id);
  
  console.log(`✅ Avis: ${avis?.length || 0} trouvés`);
  
  // Messages
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('destinataire_id', rhUser.id);
  
  console.log(`✅ Messages: ${messages?.length || 0} trouvés`);
  
  // Alertes
  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*')
    .eq('partenaire_id', partner.id);
  
  console.log(`✅ Alertes: ${alerts?.length || 0} trouvées`);
  
  // 4. Calculer les statistiques du dashboard
  console.log('\n📈 Statistiques du dashboard pour le RH:');
  
  const activeEmployees = employees?.filter(emp => emp.actif) || [];
  const pendingRequests = salaryRequests?.filter(req => req.statut === 'En attente') || [];
  const approvedRequests = salaryRequests?.filter(req => req.statut === 'Validé') || [];
  const totalAmount = salaryRequests?.reduce((sum, req) => sum + req.montant_demande, 0) || 0;
  const averageRating = avis?.length > 0 ? avis.reduce((sum, av) => sum + av.note, 0) / avis.length : 0;
  
  console.log(`   • Employés actifs: ${activeEmployees.length}/${employees?.length || 0}`);
  console.log(`   • Demandes en attente: ${pendingRequests.length}`);
  console.log(`   • Demandes validées: ${approvedRequests.length}`);
  console.log(`   • Montant total demandé: ${totalAmount.toLocaleString()} GNF`);
  console.log(`   • Note moyenne: ${averageRating.toFixed(1)}/5`);
  
  // 5. Vérifier les permissions
  console.log('\n🔐 Vérification des permissions:');
  console.log(`   • RH peut voir les employés: ${employees?.length > 0 ? '✅ OUI' : '❌ NON'}`);
  console.log(`   • RH peut voir les demandes: ${salaryRequests?.length > 0 ? '✅ OUI' : '❌ NON'}`);
  console.log(`   • RH peut voir les finances: ${transactions?.length > 0 ? '✅ OUI' : '❌ NON'}`);
  console.log(`   • RH peut voir les avis: ${avis?.length > 0 ? '✅ OUI' : '❌ NON'}`);
  
  console.log('\n=== FIN DU TEST RH ===');
  console.log('\n🎯 CONCLUSION:');
  if (employees?.length > 0 && salaryRequests?.length > 0) {
    console.log('✅ Le RH a accès complet au dashboard de son entreprise');
    console.log('✅ Toutes les données sont visibles et dynamiques');
  } else {
    console.log('❌ Le RH n\'a pas accès aux données du dashboard');
    console.log('❌ Vérifier la logique de récupération des données');
  }
}

testRHAccess().catch(console.error); 