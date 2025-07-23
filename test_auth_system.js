// Script de test pour le système d'authentification
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://mspmrzlqhwpdkkburjiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthSystem() {
  console.log('=== TEST DU SYSTÈME D\'AUTHENTIFICATION ===\n');

  // 1. Test de connexion avec un utilisateur existant
  console.log('1. Test de connexion...');
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'rh@innovatech.com',
      password: 'TestRH2024!'
    });

    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message);
      return;
    }

    console.log('✅ Connexion réussie');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // 2. Vérifier le profil admin
    console.log('\n2. Vérification du profil admin...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', authData.user.id)
      .eq('active', true)
      .single();

    if (adminError || !adminData) {
      console.error('❌ Profil admin introuvable:', adminError?.message);
      return;
    }

    console.log('✅ Profil admin trouvé');
    console.log(`   Display Name: ${adminData.display_name}`);
    console.log(`   Role: ${adminData.role}`);
    console.log(`   Partenaire ID: ${adminData.partenaire_id}`);

    // 3. Vérifier le partenaire
    console.log('\n3. Vérification du partenaire...');
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', adminData.partenaire_id)
      .eq('status', 'approved')
      .single();

    if (partnerError || !partnerData) {
      console.error('❌ Partenaire introuvable:', partnerError?.message);
      return;
    }

    console.log('✅ Partenaire trouvé');
    console.log(`   Company Name: ${partnerData.company_name}`);
    console.log(`   Legal Status: ${partnerData.legal_status}`);
    console.log(`   Activity Domain: ${partnerData.activity_domain}`);
    console.log(`   Employees Count: ${partnerData.employees_count}`);
    console.log(`   Status: ${partnerData.status}`);

    // 4. Vérifier les employés du partenaire
    console.log('\n4. Vérification des employés...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .eq('partner_id', partnerData.id)
      .eq('actif', true);

    if (employeesError) {
      console.error('❌ Erreur lors de la récupération des employés:', employeesError.message);
    } else {
      console.log(`✅ ${employees?.length || 0} employés trouvés`);
    }

    // 5. Vérifier les demandes d'avance
    console.log('\n5. Vérification des demandes d\'avance...');
    const { data: requests, error: requestsError } = await supabase
      .from('salary_advance_requests')
      .select('*')
      .eq('partenaire_id', partnerData.id);

    if (requestsError) {
      console.error('❌ Erreur lors de la récupération des demandes:', requestsError.message);
    } else {
      console.log(`✅ ${requests?.length || 0} demandes trouvées`);
    }

    // 6. Test de déconnexion
    console.log('\n6. Test de déconnexion...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('❌ Erreur lors de la déconnexion:', signOutError.message);
    } else {
      console.log('✅ Déconnexion réussie');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n=== FIN DU TEST ===');
}

// Test avec différents utilisateurs
async function testMultipleUsers() {
  console.log('\n=== TEST AVEC DIFFÉRENTS UTILISATEURS ===\n');

  const testUsers = [
    { email: 'rh@innovatech.com', password: 'TestRH2024!', name: 'Innovatech RH' },
    { email: 'responsable@innovatech.com', password: 'TestResp2024!', name: 'Innovatech Responsable' },
    { email: 'rh@educenter.org', password: 'TestRH2024!', name: 'EduCenter RH' },
    { email: 'responsable@educenter.org', password: 'TestResp2024!', name: 'EduCenter Responsable' }
  ];

  for (const user of testUsers) {
    console.log(`\n--- Test avec ${user.name} ---`);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (authError) {
        console.log(`❌ ${user.name}: ${authError.message}`);
        continue;
      }

      // Vérifier le partenaire
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('partenaire_id')
        .eq('id', authData.user.id)
        .single();

      if (adminData) {
        const { data: partnerData } = await supabase
          .from('partners')
          .select('company_name, status')
          .eq('id', adminData.partenaire_id)
          .single();

        if (partnerData) {
          console.log(`✅ ${user.name}: ${partnerData.company_name} (${partnerData.status})`);
        } else {
          console.log(`❌ ${user.name}: Partenaire introuvable`);
        }
      }

      // Déconnexion
      await supabase.auth.signOut();

    } catch (error) {
      console.log(`❌ ${user.name}: ${error.message}`);
    }
  }
}

// Exécuter les tests
async function runAllTests() {
  await testAuthSystem();
  await testMultipleUsers();
}

runAllTests().catch(console.error); 