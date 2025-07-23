// Test simple de connexion Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuration identique à lib/supabase.ts
const supabaseUrl = 'https://mspmrzlqhwpdkkburjiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0';

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey.substring(0, 50) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('\n=== TEST DE CONNEXION SIMPLE ===\n');

  try {
    // Test 1: Vérifier la connexion de base
    console.log('1. Test de connexion de base...');
    const { data, error } = await supabase
      .from('partners')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      console.error('Code:', error.code);
      console.error('Details:', error.details);
      return;
    }

    console.log('✅ Connexion réussie');
    console.log('Data:', data);

    // Test 2: Lister les partenaires
    console.log('\n2. Test de récupération des partenaires...');
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('company_name, status')
      .limit(5);

    if (partnersError) {
      console.error('❌ Erreur partenaires:', partnersError.message);
    } else {
      console.log('✅ Partenaires trouvés:', partners?.length || 0);
      partners?.forEach((partner, index) => {
        console.log(`   ${index + 1}. ${partner.company_name} (${partner.status})`);
      });
    }

    // Test 3: Vérifier les utilisateurs admin
    console.log('\n3. Test de récupération des admins...');
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('display_name, role, active')
      .limit(5);

    if (adminsError) {
      console.error('❌ Erreur admins:', adminsError.message);
    } else {
      console.log('✅ Admins trouvés:', admins?.length || 0);
      admins?.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.display_name} (${admin.role}) - ${admin.active ? 'Actif' : 'Inactif'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n=== FIN DU TEST ===');
}

testConnection(); 