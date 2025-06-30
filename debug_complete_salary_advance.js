// Script de débogage complet pour salary_advance_requests
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mspmrzlqhwpdkkburjiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugComplete() {
  console.log('=== DÉBOGAGE COMPLET salary_advance_requests ===\n');
  
  // 1. Vérifier si la table existe
  console.log('1. Vérification de l\'existence de la table...');
  const { data: tableExists, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_name', 'salary_advance_requests');
  
  if (tableError) {
    console.error('❌ Erreur vérification table:', tableError);
  } else {
    console.log(`✅ Table salary_advance_requests existe: ${tableExists?.length > 0}`);
  }
  
  // 2. Lister tous les partenaires
  console.log('\n2. Liste des partenaires...');
  const { data: partners, error: partnersError } = await supabase
    .from('partners')
    .select('id, nom, type');
  
  if (partnersError) {
    console.error('❌ Erreur partenaires:', partnersError);
  } else {
    console.log(`✅ ${partners?.length || 0} partenaires trouvés:`);
    partners?.forEach(p => console.log(`   - ${p.nom} (${p.id})`));
  }
  
  // 3. Lister les employés de YouCompany
  console.log('\n3. Employés de YouCompany...');
  const youcompanyId = partners?.find(p => p.nom === 'YouCompany')?.id;
  let employees = [];
  if (youcompanyId) {
    const { data: employeesData, error: employeesError } = await supabase
      .from('employees')
      .select('id, nom, prenom, email, partner_id')
      .eq('partner_id', youcompanyId);
    
    if (employeesError) {
      console.error('❌ Erreur employés:', employeesError);
    } else {
      employees = employeesData || [];
      console.log(`✅ ${employees.length} employés trouvés pour YouCompany:`);
      employees.forEach(e => console.log(`   - ${e.prenom} ${e.nom} (${e.email}) - ID: ${e.id}`));
    }
  }
  
  // 4. Vérifier les données existantes dans salary_advance_requests
  console.log('\n4. Données existantes dans salary_advance_requests...');
  const { data: existingRequests, error: requestsError } = await supabase
    .from('salary_advance_requests')
    .select('*');
  
  if (requestsError) {
    console.error('❌ Erreur récupération demandes:', requestsError);
  } else {
    console.log(`✅ ${existingRequests?.length || 0} demandes existantes:`);
    existingRequests?.forEach((req, i) => {
      console.log(`   ${i + 1}. ID: ${req.id}, Employé: ${req.employe_id}, Partenaire: ${req.partenaire_id}, Montant: ${req.montant_demande}, Statut: ${req.statut}`);
    });
  }
  
  // 5. Essayer d'insérer une demande de test
  console.log('\n5. Insertion d\'une demande de test...');
  if (youcompanyId && employees?.length > 0) {
    const testEmployee = employees[0];
    const { data: insertResult, error: insertError } = await supabase
      .from('salary_advance_requests')
      .insert({
        employe_id: testEmployee.id,
        partenaire_id: youcompanyId,
        montant_demande: 100000,
        type_motif: 'Test',
        motif: 'Demande de test pour débogage',
        numero_reception: 'TEST-001',
        frais_service: 5000,
        montant_total: 105000,
        salaire_disponible: 800000,
        avance_disponible: 300000,
        statut: 'En attente',
        date_creation: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();
    
    if (insertError) {
      console.error('❌ Erreur insertion:', insertError);
    } else {
      console.log('✅ Demande de test insérée:', insertResult);
    }
  }
  
  // 6. Vérifier à nouveau après insertion
  console.log('\n6. Vérification après insertion...');
  const { data: finalRequests, error: finalError } = await supabase
    .from('salary_advance_requests')
    .select('*')
    .eq('partenaire_id', youcompanyId);
  
  if (finalError) {
    console.error('❌ Erreur vérification finale:', finalError);
  } else {
    console.log(`✅ ${finalRequests?.length || 0} demandes pour YouCompany après insertion:`);
    finalRequests?.forEach((req, i) => {
      console.log(`   ${i + 1}. ID: ${req.id}, Montant: ${req.montant_demande}, Statut: ${req.statut}`);
    });
  }
  
  console.log('\n=== FIN DU DÉBOGAGE ===');
}

debugComplete().catch(console.error); 