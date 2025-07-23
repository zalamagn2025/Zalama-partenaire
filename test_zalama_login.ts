// Script de test pour la connexion Zalama
import { createHash } from 'crypto';
import { supabase } from './lib/supabase';

// Fonction pour hasher un mot de passe
const hashPassword = (password: string) => {
  return createHash('sha256').update(password).digest('hex');
};

// Test de connexion pour les utilisateurs Zalama
async function testZalamaLogin() {
  console.log('=== TEST DE CONNEXION ZALAMA ===');
  
  const testUsers = [
    {
      email: 'zalamagn@gmail.com',
      password: 'Samy2004@',
      role: 'Représentant'
    },
    {
      email: 'diabykarfalla2@gmail.com',
      password: 'Samy2004@',
      role: 'Responsable RH'
    }
  ];

  for (const userData of testUsers) {
    console.log(`\n--- Test de connexion pour ${userData.role} ---`);
    
    try {
      // Vérifier si l'utilisateur existe
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .eq('actif', true)
        .single();

      if (userError) {
        console.error(`❌ Utilisateur ${userData.email} non trouvé:`, userError.message);
        continue;
      }

      console.log(`✅ Utilisateur trouvé: ${user.nom} ${user.prenom}`);
      console.log(`   Poste: ${user.poste}`);
      console.log(`   Organisation: ${user.organisation}`);

      // Vérifier le mot de passe
      const passwordHash = hashPassword(userData.password);
      if (user.encrypted_password === passwordHash) {
        console.log(`✅ Mot de passe correct pour ${userData.email}`);
        
        // Récupérer les informations du partenaire
        const { data: partner, error: partnerError } = await supabase
          .from('partners')
          .select('*')
          .eq('id', user.id)
          .single();

        if (partnerError) {
          console.log(`⚠️  Partenaire non trouvé pour ${userData.email}:`, partnerError.message);
        } else {
              console.log(`✅ Partenaire trouvé: ${partner.company_name}`);
    console.log(`   Représentant: ${partner.rep_full_name}`);
    console.log(`   RH: ${partner.hr_full_name}`);
        }
      } else {
        console.error(`❌ Mot de passe incorrect pour ${userData.email}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors du test pour ${userData.email}:`, error);
    }
  }
}

// Exécuter le test
testZalamaLogin().then(() => {
  console.log('\n=== FIN DES TESTS ===');
}).catch(error => {
  console.error('Erreur générale:', error);
}); 