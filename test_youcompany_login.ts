// Script de test pour la connexion YouCompany
import { createHash } from 'crypto';
import { supabase } from './lib/supabase';

// Fonction pour hasher un mot de passe
const hashPassword = (password: string) => {
  return createHash('sha256').update(password).digest('hex');
};

// Test de connexion pour les utilisateurs YouCompany
async function testYouCompanyLogin() {
  console.log('=== TEST DE CONNEXION YOUCOMPANY ===');
  
  const testUsers = [
    {
      email: 'ousmane.sow@youcompany.com',
      password: 'Samy2004@',
      role: 'Directeur Général'
    },
    {
      email: 'aissatou.bah@youcompany.com',
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
              console.log(`✅ Partenaire trouvé: ${partner.company_name}`);
    console.log(`   Représentant: ${partner.rep_full_name}`);
    console.log(`   RH: ${partner.hr_full_name}`);
    console.log(`   Nombre d'employés: ${partner.employees_count}`);
    console.log(`   Payroll: ${partner.payroll}`);
        }

        // Récupérer les employés
        const { data: employees, error: employeesError } = await supabase
          .from('employees')
          .select('*')
          .eq('partner_id', user.id)
          .eq('actif', true);

        if (employeesError) {
          console.log(`⚠️  Erreur lors de la récupération des employés:`, employeesError.message);
        } else {
          console.log(`✅ ${employees?.length || 0} employés trouvés`);
        }

        // Récupérer les demandes d'avance
        const { data: demandes, error: demandesError } = await supabase
          .from('demandes_avance_salaire')
          .select(`
            *,
            employees!inner(*)
          `)
          .eq('employees.partner_id', user.id);

        if (demandesError) {
          console.log(`⚠️  Erreur lors de la récupération des demandes:`, demandesError.message);
        } else {
          console.log(`✅ ${demandes?.length || 0} demandes d'avance trouvées`);
        }

        // Récupérer les transactions financières
        const { data: transactions, error: transactionsError } = await supabase
          .from('financial_transactions')
          .select('*')
          .eq('partenaire_id', user.id);

        if (transactionsError) {
          console.log(`⚠️  Erreur lors de la récupération des transactions:`, transactionsError.message);
        } else {
          console.log(`✅ ${transactions?.length || 0} transactions financières trouvées`);
        }

        // Récupérer les avis
        const { data: avis, error: avisError } = await supabase
          .from('avis')
          .select('*')
          .eq('partner_id', user.id);

        if (avisError) {
          console.log(`⚠️  Erreur lors de la récupération des avis:`, avisError.message);
        } else {
          console.log(`✅ ${avis?.length || 0} avis trouvés`);
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
testYouCompanyLogin().then(() => {
  console.log('\n=== FIN DES TESTS YOUCOMPANY ===');
}).catch(error => {
  console.error('Erreur générale:', error);
}); 