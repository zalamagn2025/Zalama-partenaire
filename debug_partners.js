// Script de débogage pour les partenaires
const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://mspmrzlqhwpdkkburjiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPartners() {
  console.log('=== DÉBOGAGE DES PARTENAIRES ===\n');
  
  // 1. Lister tous les partenaires
  const { data: allPartners, error: allError } = await supabase
    .from('partners')
    .select('*')
    .order('nom');
  
  if (allError) {
    console.error('❌ Erreur lors de la récupération des partenaires:', allError);
    return;
  }
  
  console.log(`📋 Tous les partenaires (${allPartners?.length || 0}):`);
  allPartners?.forEach((partner, index) => {
    console.log(`${index + 1}. ${partner.nom} (ID: ${partner.id}) - Type: ${partner.type}`);
  });
  
  console.log('\n=== RECHERCHE SPÉCIFIQUE ===');
  
  // 2. Rechercher "YouCompany" exactement
  const { data: exactMatch, error: exactError } = await supabase
    .from('partners')
    .select('*')
    .eq('nom', 'YouCompany');
  
  console.log(`\n🔍 Recherche exacte "YouCompany":`);
  if (exactError) {
    console.error('❌ Erreur:', exactError);
  } else {
    console.log(`✅ Trouvé ${exactMatch?.length || 0} résultat(s)`);
    exactMatch?.forEach((partner, index) => {
      console.log(`  ${index + 1}. ${partner.nom} (ID: ${partner.id})`);
    });
  }
  
  // 3. Recherche partielle
  const { data: partialMatch, error: partialError } = await supabase
    .from('partners')
    .select('*')
    .ilike('nom', '%YouCompany%');
  
  console.log(`\n🔍 Recherche partielle "%YouCompany%":`);
  if (partialError) {
    console.error('❌ Erreur:', partialError);
  } else {
    console.log(`✅ Trouvé ${partialMatch?.length || 0} résultat(s)`);
    partialMatch?.forEach((partner, index) => {
      console.log(`  ${index + 1}. ${partner.nom} (ID: ${partner.id})`);
    });
  }
  
  // 4. Vérifier l'utilisateur RH
  const { data: rhUser, error: rhError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'aissatou.bah@youcompany.com')
    .single();
  
  console.log(`\n👤 Utilisateur RH (aissatou.bah@youcompany.com):`);
  if (rhError) {
    console.error('❌ Erreur:', rhError);
  } else {
    console.log(`✅ Trouvé: ${rhUser.nom} ${rhUser.prenom}`);
    console.log(`   Poste: ${rhUser.poste}`);
    console.log(`   Organisation: "${rhUser.organisation}"`);
  }
  
  console.log('\n=== FIN DU DÉBOGAGE ===');
}

debugPartners().catch(console.error); 