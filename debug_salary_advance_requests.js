// Script pour lister toutes les demandes d'avance pour YouCompany
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mspmrzlqhwpdkkburjiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugSalaryAdvanceRequests() {
  console.log('=== DÉBOGAGE salary_advance_requests ===\n');
  // Récupérer l'ID du partenaire YouCompany
  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('id, nom')
    .eq('nom', 'YouCompany')
    .single();
  if (partnerError) {
    console.error('❌ Erreur récupération partenaire:', partnerError);
    return;
  }
  console.log(`Partenaire: ${partner.nom} (ID: ${partner.id})\n`);
  // Lister toutes les demandes d'avance pour ce partenaire
  const { data: demandes, error: demandesError } = await supabase
    .from('salary_advance_requests')
    .select('*')
    .eq('partenaire_id', partner.id)
    .order('date_creation', { ascending: false });
  if (demandesError) {
    console.error('❌ Erreur récupération demandes:', demandesError);
    return;
  }
  console.log(`Nombre de demandes trouvées: ${demandes.length}`);
  demandes.forEach((d, i) => {
    console.log(`\n--- Demande ${i + 1} ---`);
    console.log(`ID: ${d.id}`);
    console.log(`Employé: ${d.employe_id}`);
    console.log(`Montant: ${d.montant_demande}`);
    console.log(`Statut: ${d.statut}`);
    console.log(`Date création: ${d.date_creation}`);
  });
  console.log('\n=== FIN DU DÉBOGAGE ===');
}
debugSalaryAdvanceRequests().catch(console.error); 