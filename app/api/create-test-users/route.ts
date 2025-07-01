import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Interface pour les utilisateurs de test
interface TestUser {
  email: string;
  password: string;
  display_name: string;
  role: 'rh' | 'responsable';
  partner: {
    nom: string;
    type: string;
    secteur: string;
    description: string;
    nom_rh: string;
    email_rh: string;
    telephone_rh: string;
    rccm: string;
    nif: string;
    adresse: string;
    nombre_employes: number;
    salaire_net_total: number;
  };
}

// Données des utilisateurs de test
const testUsers: TestUser[] = [
  {
    email: 'rh@innovatech.com',
    password: 'TestRH2024!',
    display_name: 'Fatoumata CAMARA',
    role: 'rh',
    partner: {
      nom: 'Innovatech Solutions',
      type: 'Entreprise privée',
      secteur: 'Technologies',
      description: 'Solutions technologiques innovantes pour les entreprises',
      nom_rh: 'Fatoumata CAMARA',
      email_rh: 'rh@innovatech.com',
      telephone_rh: '+224 123 456 789',
      rccm: 'RCCM/GN/CON/2023/IT-001',
      nif: 'NIF123456789IT',
      adresse: 'Quartier Almamya, Conakry, Guinée',
      nombre_employes: 50,
      salaire_net_total: 125000000,
    }
  },
  {
    email: 'responsable@innovatech.com',
    password: 'TestResp2024!',
    display_name: 'Mamadou DIALLO',
    role: 'responsable',
    partner: {
      nom: 'Innovatech Solutions',
      type: 'Entreprise privée',
      secteur: 'Technologies',
      description: 'Solutions technologiques innovantes pour les entreprises',
      nom_rh: 'Fatoumata CAMARA',
      email_rh: 'rh@innovatech.com',
      telephone_rh: '+224 123 456 789',
      rccm: 'RCCM/GN/CON/2023/IT-001',
      nif: 'NIF123456789IT',
      adresse: 'Quartier Almamya, Conakry, Guinée',
      nombre_employes: 50,
      salaire_net_total: 125000000,
    }
  },
  {
    email: 'rh@educenter.org',
    password: 'TestRH2024!',
    display_name: 'Aissatou BAH',
    role: 'rh',
    partner: {
      nom: 'EduCenter International',
      type: 'ONG',
      secteur: 'Éducation',
      description: 'Organisation internationale pour le développement de l\'éducation',
      nom_rh: 'Aissatou BAH',
      email_rh: 'rh@educenter.org',
      telephone_rh: '+224 987 654 321',
      rccm: 'RCCM/GN/CON/2023/EDU-002',
      nif: 'NIF987654321EDU',
      adresse: 'Quartier Kaloum, Conakry, Guinée',
      nombre_employes: 30,
      salaire_net_total: 75000000,
    }
  },
  {
    email: 'responsable@educenter.org',
    password: 'TestResp2024!',
    display_name: 'Ousmane SOW',
    role: 'responsable',
    partner: {
      nom: 'EduCenter International',
      type: 'ONG',
      secteur: 'Éducation',
      description: 'Organisation internationale pour le développement de l\'éducation',
      nom_rh: 'Aissatou BAH',
      email_rh: 'rh@educenter.org',
      telephone_rh: '+224 987 654 321',
      rccm: 'RCCM/GN/CON/2023/EDU-002',
      nif: 'NIF987654321EDU',
      adresse: 'Quartier Kaloum, Conakry, Guinée',
      nombre_employes: 30,
      salaire_net_total: 75000000,
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Début de la création des utilisateurs de test...');
    
    const createdUsers = [];
    
    // Créer ou récupérer les partenaires
    const partnersMap = new Map<string, string>();
    
    for (const testUser of testUsers) {
      const partnerName = testUser.partner.nom;
      
      if (!partnersMap.has(partnerName)) {
        // Vérifier si le partenaire existe déjà
        const { data: existingPartner } = await supabase
          .from('partners')
          .select('id')
          .eq('nom', partnerName)
          .single();
        
        if (existingPartner) {
          partnersMap.set(partnerName, existingPartner.id);
          console.log(`✅ Partenaire existant trouvé: ${partnerName}`);
        } else {
          // Créer le nouveau partenaire
          const { data: newPartner, error: partnerError } = await supabase
            .from('partners')
            .insert([testUser.partner])
            .select('id')
            .single();
          
          if (partnerError) {
            throw new Error(`Erreur lors de la création du partenaire ${partnerName}: ${partnerError.message}`);
          }
          
          partnersMap.set(partnerName, newPartner.id);
          console.log(`✅ Nouveau partenaire créé: ${partnerName}`);
        }
      }
    }
    
    // Créer les utilisateurs
    for (const testUser of testUsers) {
      const partnerId = partnersMap.get(testUser.partner.nom);
      
      try {
        // 1. Créer l'utilisateur dans auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: {
            display_name: testUser.display_name,
            role: testUser.role
          }
        });
        
        if (authError) {
          console.log(`⚠️ Utilisateur auth existant: ${testUser.email}`);
          // Si l'utilisateur existe déjà, le récupérer
          const { data: existingUser } = await supabase.auth.admin.listUsers();
          const user = existingUser.users.find(u => u.email === testUser.email);
          
          if (!user) {
            throw new Error(`Impossible de créer ou récupérer l'utilisateur: ${testUser.email}`);
          }
          
          // 2. Créer ou mettre à jour le profil admin
          const { error: adminError } = await supabase
            .from('admin_users')
            .upsert([
              {
                id: user.id,
                email: testUser.email,
                display_name: testUser.display_name,
                role: testUser.role,
                partenaire_id: partnerId,
                active: true,
                last_login: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
          
          if (adminError) {
            throw new Error(`Erreur lors de la mise à jour du profil admin: ${adminError.message}`);
          }
          
          createdUsers.push({
            id: user.id,
            email: testUser.email,
            display_name: testUser.display_name,
            role: testUser.role,
            partner: testUser.partner.nom,
            status: 'updated'
          });
        } else {
          // Utilisateur créé avec succès
          console.log(`✅ Utilisateur auth créé: ${testUser.email}`);
          
          // 2. Créer le profil admin
          const { error: adminError } = await supabase
            .from('admin_users')
            .insert([
              {
                id: authData.user.id,
                email: testUser.email,
                display_name: testUser.display_name,
                role: testUser.role,
                partenaire_id: partnerId,
                active: true,
                last_login: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
          
          if (adminError) {
            throw new Error(`Erreur lors de la création du profil admin: ${adminError.message}`);
          }
          
          createdUsers.push({
            id: authData.user.id,
            email: testUser.email,
            display_name: testUser.display_name,
            role: testUser.role,
            partner: testUser.partner.nom,
            status: 'created'
          });
        }
        
        console.log(`✅ Utilisateur traité: ${testUser.email}`);
        
      } catch (userError) {
        console.error(`❌ Erreur pour l'utilisateur ${testUser.email}:`, userError);
        // Continuer avec les autres utilisateurs
      }
    }
    
    console.log('🎉 Création des utilisateurs de test terminée !');
    
    return NextResponse.json({
      success: true,
      message: `${createdUsers.length} utilisateurs traités avec succès`,
      users: createdUsers,
      credentials: testUsers.map(u => ({
        email: u.email,
        password: u.password,
        role: u.role,
        partner: u.partner.nom
      }))
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création des utilisateurs de test',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 