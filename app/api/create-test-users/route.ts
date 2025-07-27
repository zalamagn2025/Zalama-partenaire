import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// Interface pour les utilisateurs de test
interface TestUser {
  email: string;
  password: string;
  display_name: string;
  role: 'rh' | 'responsable';
  partner: {
    company_name: string;
    legal_status: string;
    rccm: string;
    nif: string;
    activity_domain: string;
    headquarters_address: string;
    phone: string;
    email: string;
    employees_count: number;
    payroll: string;
    cdi_count: number;
    cdd_count: number;
    payment_date: string;
    rep_full_name: string;
    rep_position: string;
    rep_email: string;
    rep_phone: string;
    hr_full_name: string;
    hr_email: string;
    hr_phone: string;
    agreement: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'in_review';
    payment_day?: number;
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
      company_name: 'Innovatech Solutions',
      legal_status: 'SARL',
      rccm: 'RCCM/GN/CON/2023/IT-001',
      nif: 'NIF123456789IT',
      activity_domain: 'Technologies',
      headquarters_address: 'Quartier Almamya, Conakry, Guinée',
      phone: '+224 123 456 789',
      email: 'contact@innovatech.com',
      employees_count: 50,
      payroll: 'Mensuel',
      cdi_count: 35,
      cdd_count: 10,
      payment_date: '2024-01-15',
      rep_full_name: 'Mamadou DIALLO',
      rep_position: 'Directeur Général',
      rep_email: 'responsable@innovatech.com',
      rep_phone: '+224 123 456 789',
      hr_full_name: 'Fatoumata CAMARA',
      hr_email: 'rh@innovatech.com',
      hr_phone: '+224 123 456 789',
      agreement: true,
      status: 'approved',
      payment_day: 25,
    }
  },
  {
    email: 'responsable@innovatech.com',
    password: 'TestResp2024!',
    display_name: 'Mamadou DIALLO',
    role: 'responsable',
    partner: {
      company_name: 'Innovatech Solutions',
      legal_status: 'SARL',
      rccm: 'RCCM/GN/CON/2023/IT-001',
      nif: 'NIF123456789IT',
      activity_domain: 'Technologies',
      headquarters_address: 'Quartier Almamya, Conakry, Guinée',
      phone: '+224 123 456 789',
      email: 'contact@innovatech.com',
      employees_count: 50,
      payroll: 'Mensuel',
      cdi_count: 35,
      cdd_count: 10,
      payment_date: '2024-01-15',
      rep_full_name: 'Mamadou DIALLO',
      rep_position: 'Directeur Général',
      rep_email: 'responsable@innovatech.com',
      rep_phone: '+224 123 456 789',
      hr_full_name: 'Fatoumata CAMARA',
      hr_email: 'rh@innovatech.com',
      hr_phone: '+224 123 456 789',
      agreement: true,
      status: 'approved',
      payment_day: 25,
    }
  },
  {
    email: 'rh@educenter.org',
    password: 'TestRH2024!',
    display_name: 'Aissatou BAH',
    role: 'rh',
    partner: {
      company_name: 'EduCenter International',
      legal_status: 'ONG',
      rccm: 'RCCM/GN/CON/2023/EDU-002',
      nif: 'NIF987654321EDU',
      activity_domain: 'Éducation',
      headquarters_address: 'Quartier Kaloum, Conakry, Guinée',
      phone: '+224 987 654 321',
      email: 'contact@educenter.org',
      employees_count: 30,
      payroll: 'Mensuel',
      cdi_count: 20,
      cdd_count: 8,
      payment_date: '2024-01-15',
      rep_full_name: 'Ousmane SOW',
      rep_position: 'Directeur Général',
      rep_email: 'responsable@educenter.org',
      rep_phone: '+224 987 654 321',
      hr_full_name: 'Aissatou BAH',
      hr_email: 'rh@educenter.org',
      hr_phone: '+224 987 654 321',
      agreement: true,
      status: 'approved',
      payment_day: 25,
    }
  },
  {
    email: 'responsable@educenter.org',
    password: 'TestResp2024!',
    display_name: 'Ousmane SOW',
    role: 'responsable',
    partner: {
      company_name: 'EduCenter International',
      legal_status: 'ONG',
      rccm: 'RCCM/GN/CON/2023/EDU-002',
      nif: 'NIF987654321EDU',
      activity_domain: 'Éducation',
      headquarters_address: 'Quartier Kaloum, Conakry, Guinée',
      phone: '+224 987 654 321',
      email: 'contact@educenter.org',
      employees_count: 30,
      payroll: 'Mensuel',
      cdi_count: 20,
      cdd_count: 8,
      payment_date: '2024-01-15',
      rep_full_name: 'Ousmane SOW',
      rep_position: 'Directeur Général',
      rep_email: 'responsable@educenter.org',
      rep_phone: '+224 987 654 321',
      hr_full_name: 'Aissatou BAH',
      hr_email: 'rh@educenter.org',
      hr_phone: '+224 987 654 321',
      agreement: true,
      status: 'approved',
      payment_day: 25,
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
      const partnerName = testUser.partner.company_name;
      
      if (!partnersMap.has(partnerName)) {
        // Vérifier si le partenaire existe déjà
        const { data: existingPartner } = await supabase
          .from('partners')
          .select('id')
          .eq('company_name', partnerName)
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
      const partnerId = partnersMap.get(testUser.partner.company_name);
      
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
            partner: testUser.partner.company_name,
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
            partner: testUser.partner.company_name,
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
        partner: u.partner.company_name
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