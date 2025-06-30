// Script de test pour les demandes d'avance de salaire
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://mspmrzlqhwpdkkburjiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSalaryAdvanceRequests() {
  console.log('=== TEST DES DEMANDES D\'AVANCE DE SALAIRE ===\n');
  
  // Récupérer le partenaire YouCompany
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('*')
    .eq('nom', 'YouCompany')
    .single();
  
  if (partnerError) {
    console.error('❌ Erreur lors de la récupération du partenaire:', partnerError);
    return;
  }
  
  console.log(`✅ Partenaire trouvé: ${partner.nom} (ID: ${partner.id})\n`);
  
  // Récupérer toutes les demandes d'avance pour YouCompany
  const { data: requests, error: requestsError } = await supabase
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
    .eq('partenaire_id', partner.id)
    .order('date_creation', { ascending: false });
  
  if (requestsError) {
    console.error('❌ Erreur lors de la récupération des demandes:', requestsError);
    return;
  }
  
  console.log(`✅ ${requests?.length || 0} demandes d'avance trouvées\n`);
  
  // Afficher les détails de chaque demande
  requests?.forEach((request, index) => {
    console.log(`--- Demande ${index + 1} ---`);
    console.log(`ID: ${request.id}`);
    console.log(`Employé: ${request.employees?.nom} ${request.employees?.prenom} (${request.employees?.poste})`);
    console.log(`Montant demandé: ${request.montant_demande.toLocaleString()} GNF`);
    console.log(`Type de motif: ${request.type_motif}`);
    console.log(`Motif: ${request.motif}`);
    console.log(`Frais de service: ${request.frais_service.toLocaleString()} GNF`);
    console.log(`Montant total: ${request.montant_total.toLocaleString()} GNF`);
    console.log(`Statut: ${request.statut}`);
    console.log(`Date de création: ${new Date(request.date_creation).toLocaleDateString()}`);
    
    if (request.date_validation) {
      console.log(`Date de validation: ${new Date(request.date_validation).toLocaleDateString()}`);
    }
    
    if (request.date_rejet) {
      console.log(`Date de rejet: ${new Date(request.date_rejet).toLocaleDateString()}`);
      console.log(`Motif de rejet: ${request.motif_rejet}`);
    }
    
    console.log('');
  });
  
  // Statistiques par statut
  console.log('=== STATISTIQUES PAR STATUT ===');
  const stats = {};
  requests?.forEach(request => {
    if (!stats[request.statut]) {
      stats[request.statut] = {
        count: 0,
        total: 0
      };
    }
    stats[request.statut].count++;
    stats[request.statut].total += request.montant_demande;
  });
  
  Object.entries(stats).forEach(([statut, data]) => {
    console.log(`${statut}: ${data.count} demandes, ${data.total.toLocaleString()} GNF total`);
  });
  
  console.log('\n=== FIN DU TEST ===');
}

testSalaryAdvanceRequests().catch(console.error); 