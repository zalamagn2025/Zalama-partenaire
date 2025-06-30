// Script de test pour la connexion TechSolutions
import { supabase } from './lib/supabase';
import { createHash } from 'crypto';

// Fonction pour hasher un mot de passe
const hashPassword = (password: string) => {
  return createHash('sha256').update(password).digest('hex');
};

// Test de connexion pour les utilisateurs TechSolutions
async function testTechSolutionsLogin() {
  console.log('=== TEST DE CONNEXION TECHSOLUTIONS ===');
  
  const testUsers = [
    {
      email: 'mamadou.diallo@techsolutions.com',
      password: 'Samy2004@',
      role: 'Directeur Général'
    },
    {
      email: 'fatou.camara@techsolutions.com',
      password: 'Samy2004@',
      role: 'Directrice RH'
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
          console.log(`✅ Partenaire trouvé: ${partner.nom}`);
          console.log(`   Représentant: ${partner.nom_representant}`);
          console.log(`   RH: ${partner.nom_rh}`);
          console.log(`   Nombre d'employés: ${partner.nombre_employes}`);
          console.log(`   Salaire total: ${partner.salaire_net_total.toLocaleString()} GNF`);
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
testTechSolutionsLogin().then(() => {
  console.log('\n=== FIN DES TESTS TECHSOLUTIONS ===');
}).catch(error => {
  console.error('Erreur générale:', error);
}); 