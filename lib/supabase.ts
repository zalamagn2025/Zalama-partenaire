import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mspmrzlqhwpdkkburjiw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fonction pour générer un UUID simple
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Fonction pour hasher un mot de passe
const hashPassword = (password: string) => {
  return createHash('sha256').update(password).digest('hex');
};

// Fonction pour créer des utilisateurs de test
export const createTestUsers = async () => {
  const testUsers = [
    {
      email: 'fatou.camara@innovatech.com',
      password: 'Samy2004@',
      nom: 'Camara',
      prenom: 'Fatou',
      type: 'Entreprise' as const,
      statut: 'Actif' as const,
      organisation: 'InnovaTech',
      poste: 'Directrice RH',
      telephone: '+224 623 456 789',
      adresse: 'Conakry, Guinée'
    },
    {
      email: 'mamadou.diallo@innovatech.com',
      password: 'Samy2004@',
      nom: 'Diallo',
      prenom: 'Mamadou',
      type: 'Entreprise' as const,
      statut: 'Actif' as const,
      organisation: 'InnovaTech',
      poste: 'Directeur Financier',
      telephone: '+224 624 567 890',
      adresse: 'Conakry, Guinée'
    },
    {
      email: 'aissatou.bah@educenter.org',
      password: 'Samy2004@',
      nom: 'Bah',
      prenom: 'Aissatou',
      type: 'Entreprise' as const,
      statut: 'Actif' as const,
      organisation: 'EduCenter',
      poste: 'Responsable Formation',
      telephone: '+224 625 678 901',
      adresse: 'Conakry, Guinée'
    },
    {
      email: 'ousmane.sow@educenter.org',
      password: 'Samy2004@',
      nom: 'Sow',
      prenom: 'Ousmane',
      type: 'Entreprise' as const,
      statut: 'Actif' as const,
      organisation: 'EduCenter',
      poste: 'Directeur Général',
      telephone: '+224 626 789 012',
      adresse: 'Conakry, Guinée'
    }
  ];

  const createdUsers = [];

  for (const userData of testUsers) {
    try {
      // Générer un UUID pour l'utilisateur
      const userId = generateUUID();
      
      // Hasher le mot de passe
      const passwordHash = hashPassword(userData.password);
      
      // Insérer directement dans la table users avec tous les champs requis
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userData.email,
          password_hash: passwordHash,
          nom: userData.nom,
          prenom: userData.prenom,
          type: userData.type,
          statut: userData.statut,
          organisation: userData.organisation,
          poste: userData.poste,
          telephone: userData.telephone,
          adresse: userData.adresse,
          date_inscription: new Date().toISOString(),
          derniere_connexion: new Date().toISOString(),
          actif: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (userError) {
        console.error(`Erreur lors de l'insertion des données utilisateur pour ${userData.email}:`, userError);
        console.error('Détails de l\'erreur:', JSON.stringify(userError, null, 2));
        continue;
      }

      // Créer le partenaire correspondant
      const { error: partnerError } = await supabase
        .from('partners')
        .insert({
          id: userId,
          company_name: userData.organisation,
          legal_status: 'SARL',
          rccm: `RCCM/GN/CON/2023/${userData.organisation.toUpperCase()}-001`,
          nif: `NIF${Math.random().toString().slice(2, 11)}`,
          activity_domain: userData.organisation === 'InnovaTech' ? 'Technologie' : 'Éducation',
          headquarters_address: userData.adresse,
          phone: userData.telephone,
          email: userData.email,
          employees_count: Math.floor(Math.random() * 100) + 10,
          payroll: 'Mensuel',
          cdi_count: Math.floor(Math.random() * 50) + 5,
          cdd_count: Math.floor(Math.random() * 20) + 2,
          payment_date: new Date().toISOString().split('T')[0],
          rep_full_name: `${userData.prenom} ${userData.nom}`,
          rep_position: userData.poste,
          rep_email: userData.email,
          rep_phone: userData.telephone,
          hr_full_name: `${userData.prenom} ${userData.nom}`,
          hr_email: `rh@${userData.organisation.toLowerCase()}.com`,
          hr_phone: userData.telephone,
          agreement: true,
          status: 'approved',
          payment_day: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (partnerError) {
        console.error(`Erreur lors de la création du partenaire pour ${userData.email}:`, partnerError);
        console.error('Détails de l\'erreur partenaire:', JSON.stringify(partnerError, null, 2));
      }

      // Ajouter l'utilisateur à la liste des utilisateurs créés
      createdUsers.push({
        id: userId,
        email: userData.email,
        nom: userData.nom,
        prenom: userData.prenom
      });

      console.log(`Utilisateur créé avec succès: ${userData.email} (ID: ${userId})`);
    } catch (error) {
      console.error(`Erreur générale pour ${userData.email}:`, error);
    }
  }

  return createdUsers;
};

// Fonction pour créer des données de test complètes
export async function createTestData() {
  try {
    console.log('Début de la création des données de test...');

    // Vérifier si les utilisateurs existent déjà
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email')
      .in('email', [
        'fatou.camara@innovatech.com',
        'mamadou.diallo@innovatech.com', 
        'aissatou.bah@educenter.org',
        'ousmane.sow@educenter.org'
      ]);

    const existingEmails = existingUsers?.map(u => u.email) || [];
    console.log('Emails existants:', existingEmails);

    // Créer les utilisateurs de test (seulement s'ils n'existent pas)
    const users = [];
    const testUsers = [
      {
        email: 'fatou.camara@innovatech.com',
        password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // Samy2004@
        nom: 'Camara',
        prenom: 'Fatou',
        telephone: '+224444555666',
        adresse: '123 Rue Innovatech, Conakry',
        type: 'Entreprise',
        statut: 'Actif',
        organisation: 'Innovatech SARL',
        poste: 'Directrice Générale'
      },
      {
        email: 'mamadou.diallo@innovatech.com',
        password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // Samy2004@
        nom: 'Diallo',
        prenom: 'Mamadou',
        telephone: '+224777888999',
        adresse: '456 Avenue Tech, Conakry',
        type: 'Salarié',
        statut: 'Actif',
        organisation: 'Innovatech SARL',
        poste: 'Développeur'
      },
      {
        email: 'aissatou.bah@educenter.org',
        password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // Samy2004@
        nom: 'Bah',
        prenom: 'Aissatou',
        telephone: '+224555666777',
        adresse: '789 Boulevard Éducation, Conakry',
        type: 'Entreprise',
        statut: 'Actif',
        organisation: 'Educenter',
        poste: 'Présidente'
      },
      {
        email: 'ousmane.sow@educenter.org',
        password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // Samy2004@
        nom: 'Sow',
        prenom: 'Ousmane',
        telephone: '+224888999000',
        adresse: '321 Rue Formation, Conakry',
        type: 'Salarié',
        statut: 'Actif',
        organisation: 'Educenter',
        poste: 'Formateur'
      }
    ];

    for (const userData of testUsers) {
      if (!existingEmails.includes(userData.email)) {
        const { data: user, error } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();
        
        if (error) {
          console.error(`Erreur lors de l'insertion des données utilisateur pour ${userData.email}:`, error);
          console.error('Détails de l\'erreur:', error);
        } else {
          users.push(user);
          console.log(`Utilisateur créé: ${userData.email}`);
        }
      } else {
        // Récupérer l'utilisateur existant
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', userData.email)
          .single();
        
        if (existingUser) {
          users.push(existingUser);
          console.log(`Utilisateur existant récupéré: ${userData.email}`);
        }
      }
    }

    if (users.length === 0) {
      throw new Error('Aucun utilisateur créé ou récupéré');
    }

    console.log(`${users.length} utilisateurs prêts pour la création des partenaires...`);

    const partnerId = users[0].id;

    // Créer des employés de test
    const employees = [
      {
        partner_id: users[0].id,
        nom: 'Diallo',
        prenom: 'Mamadou',
        genre: 'Homme',
        email: 'mamadou.diallo@innovatech.com',
        telephone: '+224777888999',
        adresse: '123 Rue Innovatech, Conakry',
        poste: 'Développeur Full Stack',
        role: 'Développeur',
        type_contrat: 'CDI',
        salaire_net: 2500000,
        date_embauche: '2023-01-15',
        actif: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        partner_id: users[0].id,
        nom: 'Bah',
        prenom: 'Aissatou',
        genre: 'Femme',
        email: 'aissatou.bah@innovatech.com',
        telephone: '+224666777888',
        adresse: '456 Avenue Tech, Conakry',
        poste: 'Designer UI/UX',
        role: 'Designer',
        type_contrat: 'CDI',
        salaire_net: 2000000,
        date_embauche: '2023-03-20',
        actif: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        partner_id: users[1]?.id,
        nom: 'Sow',
        prenom: 'Ousmane',
        genre: 'Homme',
        email: 'ousmane.sow@educenter.org',
        telephone: '+224555666777',
        adresse: '789 Boulevard Éducation, Conakry',
        poste: 'Formateur',
        role: 'Formateur',
        type_contrat: 'CDD',
        salaire_net: 1800000,
        date_embauche: '2023-06-10',
        actif: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    console.log('Création des employés avec les données:', employees);

    for (const employee of employees) {
      const { data, error } = await supabase.from('employees').insert(employee).select();
      if (error) {
        console.error('Erreur lors de la création de l\'employé:', error);
        console.error('Données de l\'employé:', employee);
      } else {
        console.log('Employé créé avec succès:', data);
      }
    }

    // Créer des transactions financières de test
    const transactions = [
      {
        transaction_id: 1001,
        montant: 5000000,
        type: 'Débloqué',
        description: 'Avance sur salaire - Janvier 2024',
        partenaire_id: 1,
        statut: 'Validé',
        date_transaction: '2024-01-15',
        reference: 'AVC-2024-001'
      },
      {
        transaction_id: 1002,
        montant: 4500000,
        type: 'Récupéré',
        description: 'Remboursement avance - Février 2024',
        partenaire_id: 1,
        statut: 'Validé',
        date_transaction: '2024-02-15',
        reference: 'RMB-2024-001'
      },
      {
        transaction_id: 1003,
        montant: 3000000,
        type: 'Revenu',
        description: 'Paiement service P2P',
        partenaire_id: 1,
        statut: 'Validé',
        date_transaction: '2024-01-20',
        reference: 'REV-2024-001'
      },
      {
        transaction_id: 1004,
        montant: 2000000,
        type: 'Remboursement',
        description: 'Remboursement frais de service',
        partenaire_id: 1,
        statut: 'En attente',
        date_transaction: '2024-01-25',
        reference: 'RMB-2024-002'
      }
    ];

    for (const transaction of transactions) {
      const { error } = await supabase.from('financial_transactions').insert(transaction);
      if (error) {
        console.error('Erreur lors de la création de la transaction:', error);
      }
    }

    // Récupérer les employés pour créer les avis, demandes et messages
    const { data: employeesData } = await supabase
      .from('employees')
      .select('id, email, partner_id')
      .limit(5);

    console.log('Employés récupérés pour création des données:', employeesData?.length || 0);

    // Créer des avis de test (liés aux employés du partenaire)
    if (employeesData && employeesData.length > 0) {
      const avis = [];
      
      for (const employee of employeesData) {
        if (employee.email) {
          // Récupérer l'utilisateur correspondant à l'employé
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', employee.email)
            .single();
          
          if (userData) {
            avis.push({
              employee_id: employee.id,
              partner_id: employee.partner_id,
              note: Math.floor(Math.random() * 3) + 3, // Note entre 3 et 5
              commentaire: [
                'Excellent service, très satisfait de la collaboration avec ZaLaMa !',
                'Bon service, je recommande vivement.',
                'Service exceptionnel, très réactif et professionnel.',
                'Très content du support reçu.',
                'Service de qualité, je recommande.'
              ][Math.floor(Math.random() * 5)],
              type_retour: Math.random() > 0.5 ? 'positif' : 'negatif',
              date_avis: new Date().toISOString(),
              approuve: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      console.log('Création des avis avec les données:', avis);

      for (const avi of avis) {
        const { data, error } = await supabase.from('avis').insert(avi).select();
        if (error) {
          console.error('Erreur lors de la création de l\'avis:', error);
          console.error('Données de l\'avis:', avi);
        } else {
          console.log('Avis créé avec succès:', data);
        }
      }
    }

    // Créer des demandes de test (liées aux employés du partenaire)
    if (employeesData && employeesData.length > 0) {
      const demandes = [];
      
      for (const employee of employeesData) {
        if (employee.email) {
          // Récupérer l'utilisateur correspondant à l'employé
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', employee.email)
            .single();
          
          if (userData) {
            const typesDemande = ['Avance sur Salaire', 'P2P', 'Consultation', 'Formation', 'Support'];
            const descriptions = [
              'Demande d\'avance de 500 000 GNF pour frais médicaux urgents',
              'Demande de prêt P2P de 1 000 000 GNF pour formation professionnelle',
              'Demande de consultation pour optimisation fiscale',
              'Demande de formation en développement web',
              'Demande de support technique pour notre système'
            ];
            
            demandes.push({
              user_id: userData.id,
              partner_id: employee.partner_id,
              service_id: Math.floor(Math.random() * 4) + 1001, // Service ID entre 1001 et 1004
              type_demande: typesDemande[Math.floor(Math.random() * typesDemande.length)],
              description: descriptions[Math.floor(Math.random() * descriptions.length)],
              statut: ['En attente', 'En cours', 'Approuvée'][Math.floor(Math.random() * 3)],
              priorite: Math.floor(Math.random() * 3) + 1,
              date_demande: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      console.log('Création des demandes avec les données:', demandes);

      for (const demande of demandes) {
        const { data, error } = await supabase.from('demandes').insert(demande).select();
        if (error) {
          console.error('Erreur lors de la création de la demande:', error);
          console.error('Données de la demande:', demande);
        } else {
          console.log('Demande créée avec succès:', data);
        }
      }
    }

    // Créer des messages de test (liés aux employés du partenaire)
    if (employeesData && employeesData.length > 0) {
      const messages = [];
      
      for (const employee of employeesData) {
        if (employee.email) {
          // Récupérer l'utilisateur correspondant à l'employé
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('email', employee.email)
            .single();
          
          if (userData) {
            const sujets = [
              'Demande d\'information sur les services',
              'Question sur la facturation',
              'Demande de support technique',
              'Problème avec l\'application',
              'Demande de formation'
            ];
            
            const contenus = [
              'Bonjour, j\'aimerais avoir plus d\'informations sur vos services de consultation.',
              'Pouvez-vous me renseigner sur les modalités de facturation ?',
              'J\'ai besoin d\'aide avec notre système, pouvez-vous m\'assister ?',
              'Nous rencontrons des difficultés avec l\'application mobile.',
              'Serait-il possible d\'organiser une session de formation pour notre équipe ?'
            ];
            
            messages.push({
              expediteur_id: userData.id,
              destinataire_id: 'admin-zalama', // ID de l'admin ZaLaMa
              sujet: sujets[Math.floor(Math.random() * sujets.length)],
              contenu: contenus[Math.floor(Math.random() * contenus.length)],
              lu: Math.random() > 0.5,
              date_envoi: new Date().toISOString(),
              date_lecture: Math.random() > 0.5 ? new Date().toISOString() : null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      console.log('Création des messages avec les données:', messages);

      for (const message of messages) {
        const { data, error } = await supabase.from('messages').insert(message).select();
        if (error) {
          console.error('Erreur lors de la création du message:', error);
          console.error('Données du message:', message);
        } else {
          console.log('Message créé avec succès:', data);
        }
      }
    }

    // Créer des alertes de test
    const alerts = [
      {
        titre: 'Nouvelle demande de partenariat',
        description: 'Une nouvelle demande de partenariat a été soumise et nécessite votre attention.',
        type: 'Importante',
        statut: 'Nouvelle',
        source: 'Système',
        priorite: 2
      },
      {
        titre: 'Mise à jour du système',
        description: 'Une maintenance est prévue ce weekend pour améliorer les performances.',
        type: 'Information',
        statut: 'En cours',
        source: 'Système',
        priorite: 1
      },
      {
        titre: 'Paiement en retard',
        description: 'Un paiement est en retard et nécessite une action immédiate.',
        type: 'Critique',
        statut: 'Nouvelle',
        source: 'Finance',
        priorite: 3
      }
    ];

    for (const alert of alerts) {
      const { error } = await supabase.from('alerts').insert(alert);
      if (error) {
        console.error('Erreur lors de la création de l\'alerte:', error);
      }
    }

    // Créer des demandes d'avance sur salaire de test
    if (employeesData && employeesData.length > 0) {
      const demandesAvance = [];
      
      for (const employee of employeesData) {
        const motifs = [
          'Frais médicaux urgents',
          'Paiement de loyer',
          'Frais de scolarité des enfants',
          'Réparation de véhicule',
          'Achat d\'équipement de travail'
        ];
        
        demandesAvance.push({
          employee_id: employee.id,
          partner_id: employee.partner_id,
          montant: Math.floor(Math.random() * 500000) + 100000, // Entre 100k et 600k GNF
          motif: motifs[Math.floor(Math.random() * motifs.length)],
          date_demande: new Date().toISOString(),
          date_remboursement: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 jours
          statut: ['En attente', 'En cours', 'Approuvée'][Math.floor(Math.random() * 3)],
          priorite: Math.floor(Math.random() * 3) + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      console.log('Création des demandes d\'avance avec les données:', demandesAvance);

      for (const demande of demandesAvance) {
        const { data, error } = await supabase.from('demandes_avance_salaire').insert(demande).select();
        if (error) {
          console.error('Erreur lors de la création de la demande d\'avance:', error);
          console.error('Données de la demande d\'avance:', demande);
        } else {
          console.log('Demande d\'avance créée avec succès:', data);
        }
      }
    }

    // Créer des demandes P2P de test
    if (employeesData && employeesData.length > 0) {
      const demandesP2P = [];
      
      for (const employee of employeesData) {
        const motifs = [
          'Formation professionnelle',
          'Achat d\'équipement informatique',
          'Développement de projet personnel',
          'Investissement dans une activité secondaire',
          'Amélioration des compétences'
        ];
        
        demandesP2P.push({
          employee_id: employee.id,
          partner_id: employee.partner_id,
          montant: Math.floor(Math.random() * 2000000) + 500000, // Entre 500k et 2.5M GNF
          duree_mois: Math.floor(Math.random() * 24) + 6, // Entre 6 et 30 mois
          motif: motifs[Math.floor(Math.random() * motifs.length)],
          taux_interet: Math.random() * 0.15, // Entre 0% et 15%
          date_demande: new Date().toISOString(),
          date_debut_remboursement: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +60 jours
          statut: ['En attente', 'En cours', 'Approuvée'][Math.floor(Math.random() * 3)],
          priorite: Math.floor(Math.random() * 3) + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      console.log('Création des demandes P2P avec les données:', demandesP2P);

      for (const demande of demandesP2P) {
        const { data, error } = await supabase.from('demandes_p2p').insert(demande).select();
        if (error) {
          console.error('Erreur lors de la création de la demande P2P:', error);
          console.error('Données de la demande P2P:', demande);
        } else {
          console.log('Demande P2P créée avec succès:', data);
        }
      }
    }

    console.log('Données de test créées avec succès !');
    return true;
  } catch (error) {
    console.error('Erreur lors de la création des données de test:', error);
    throw error;
  }
}

// Types pour les données Supabase
export interface User {
  id: string
  email: string
  encrypted_password: string
  nom: string
  prenom: string
  telephone?: string
  adresse?: string
  type: 'Étudiant' | 'Salarié' | 'Entreprise'
  statut: 'Actif' | 'Inactif' | 'En attente'
  photo_url?: string
  organisation?: string
  poste?: string
  niveau_etudes?: string
  etablissement?: string
  date_inscription: string
  derniere_connexion?: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Partner {
  id: string
  company_name: string
  legal_status: string
  rccm: string
  nif: string
  activity_domain: string
  headquarters_address: string
  phone: string
  email: string
  employees_count: number
  payroll: string
  cdi_count: number
  cdd_count: number
  payment_date: string
  rep_full_name: string
  rep_position: string
  rep_email: string
  rep_phone: string
  hr_full_name: string
  hr_email: string
  hr_phone: string
  agreement: boolean
  status: 'pending' | 'approved' | 'rejected' | 'in_review'
  motivation_letter_url?: string
  motivation_letter_text?: string
  payment_day?: number
  logo_url?: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  partner_id: string
  nom: string
  prenom: string
  genre: 'Homme' | 'Femme' | 'Autre'
  email?: string
  telephone?: string
  adresse?: string
  poste: string
  role?: string
  type_contrat: 'CDI' | 'CDD' | 'Consultant' | 'Stage' | 'Autre'
  salaire_net?: number,
  salaire_restant?: number,
  date_embauche?: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: number
  nom: string
  description?: string
  categorie?: string
  prix: number
  duree?: string
  disponible: boolean
  image_url?: string
  date_creation: string
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  titre: string
  description?: string
  type: 'Critique' | 'Importante' | 'Information'
  statut: 'Résolue' | 'En cours' | 'Nouvelle'
  source?: string
  assigne_a?: string
  date_creation: string
  date_resolution?: string
  priorite: number
  created_at: string
  updated_at: string
}

export interface FinancialTransaction {
  transaction_id: number
  montant: number
  type: string
  description?: string
  partenaire_id?: string
  utilisateur_id?: string
  service_id?: number
  statut: string
  date_transaction: string
  date_validation?: string
  reference?: string
  created_at: string
  updated_at: string
}

// Type étendu pour les transactions avec les données des employés
export interface FinancialTransactionWithEmployee extends FinancialTransaction {
  employees?: Employee;
}

export interface Message {
  message_id: string
  expediteur: string
  destinataire: string
  sujet: string
  contenu: string
  type: string
  priorite: string
  statut: string
  lu: boolean
  date_envoi: string
  created_at: string
  updated_at: string
}

export interface Avis {
  id: string
  employee_id: string
  partner_id: string
  note: number
  commentaire?: string
  type_retour?: 'positif' | 'negatif'
  date_avis: string
  approuve: boolean
  created_at: string
  updated_at: string
}

export interface Demande {
  id: string
  user_id: string
  partner_id: string
  service_id?: number
  type_demande: string
  description: string
  statut: string
  priorite: number
  date_demande: string
  date_traitement?: string
  commentaire_admin?: string
  created_at: string
  updated_at: string
}

export interface DemandeAvanceSalaire {
  id: string
  employee_id: string
  partner_id: string
  montant: number
  motif: string
  date_demande: string
  date_remboursement?: string
  statut: string
  priorite: number
  commentaire_admin?: string
  approuve_par?: string
  date_approbation?: string
  created_at: string
  updated_at: string
}

export interface DemandeP2P {
  id: string
  employee_id: string
  partner_id: string
  montant: number
  duree_mois: number
  motif: string
  taux_interet: number
  date_demande: string
  date_debut_remboursement?: string
  statut: string
  priorite: number
  commentaire_admin?: string
  approuve_par?: string
  date_approbation?: string
  created_at: string
  updated_at: string
}

export interface PartnershipRequest {
  id: string
  nom_entreprise: string
  rccm: string
  nif: string
  adresse: string
  type_entreprise?: string
  secteur?: string
  email_entreprise?: string
  telephone_entreprise?: string
  nom_representant: string
  poste_representant: string
  email_representant: string
  telephone_representant: string
  nom_rh: string
  email_rh: string
  telephone_rh: string
  agreement: boolean
  statut: 'En attente' | 'Validée' | 'Rejetée'
  commentaire_rejet?: string
  date_soumission: string
  date_validation?: string
  created_at: string
  updated_at: string
}

export interface SalaryAdvanceRequest {
  id: string
  employe_id: string
  partenaire_id: string
  montant_demande: number
  type_motif: string
  motif: string
  numero_reception?: string
  frais_service: number
  montant_total: number
  salaire_disponible?: number
  avance_disponible?: number
  statut: string
  date_creation: string
  date_validation?: string
  date_rejet?: string
  motif_rejet?: string
  created_at: string
  updated_at: string
}

export interface SalaryAdvanceRequestWithEmployee extends SalaryAdvanceRequest {
  employees?: Employee;
} 