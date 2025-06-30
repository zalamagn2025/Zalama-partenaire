// Types pour les entreprises et les administrateurs
export interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  employeesCount: number;
  createdAt: Date;
  stats: {
    totalEmployes: number;
    demandesEnCours: number;
    demandesMois: number;
    montantTotal: number;
    limiteRemboursement: number;
    joursAvantRemboursement: number;
    dateLimiteRemboursement: string;
  };
  employeeData: {
    departements: { name: string; value: number }[];
    statuts: { name: string; value: number }[];
    evolution: { mois: string; nombre: number }[];
  };
  financeData: {
    avances: { mois: string; montant: number }[];
    demandes: { mois: string; nombre: number }[];
    repartition: { categorie: string; montant: number }[];
  };
  alertes: {
    id: number;
    titre: string;
    description: string;
    date: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }[];
}

export interface Admin {
  id: string;
  email: string;
  password: string; // Note: Dans une application réelle, ne stockez jamais les mots de passe en clair
  name: string;
  role: string;
  companyId: string;
}

// Liste des entreprises partenaires
export const companies: Company[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    logo: '/images/companies/acme.svg',
    industry: 'Technologie',
    employeesCount: 120,
    createdAt: new Date('2020-01-15'),
    stats: {
      totalEmployes: 248,
      demandesEnCours: 12,
      demandesMois: 35,
      montantTotal: 15000,
      limiteRemboursement: 25000,
      joursAvantRemboursement: 7,
      dateLimiteRemboursement: '20 Juin 2025'
    },
    employeeData: {
      departements: [
        { name: 'Développement', value: 45 },
        { name: 'Marketing', value: 25 },
        { name: 'Ventes', value: 30 },
        { name: 'Administratif', value: 15 },
        { name: 'Support', value: 5 }
      ],
      statuts: [
        { name: 'CDI', value: 85 },
        { name: 'CDD', value: 25 },
        { name: 'Stagiaire', value: 8 },
        { name: 'Freelance', value: 2 }
      ],
      evolution: [
        { mois: 'Jan', nombre: 90 },
        { mois: 'Fév', nombre: 95 },
        { mois: 'Mar', nombre: 100 },
        { mois: 'Avr', nombre: 105 },
        { mois: 'Mai', nombre: 110 },
        { mois: 'Juin', nombre: 115 },
        { mois: 'Juil', nombre: 120 }
      ]
    },
    financeData: {
      avances: [
        { mois: 'Jan', montant: 2100 },
        { mois: 'Fév', montant: 1800 },
        { mois: 'Mar', montant: 2400 },
        { mois: 'Avr', montant: 2200 },
        { mois: 'Mai', montant: 2600 },
        { mois: 'Juin', montant: 2300 },
        { mois: 'Juil', montant: 2200 }
      ],
      demandes: [
        { mois: 'Jan', nombre: 25 },
        { mois: 'Fév', nombre: 22 },
        { mois: 'Mar', nombre: 30 },
        { mois: 'Avr', nombre: 28 },
        { mois: 'Mai', nombre: 32 },
        { mois: 'Juin', nombre: 29 },
        { mois: 'Juil', nombre: 27 }
      ],
      repartition: [
        { categorie: 'Logement', montant: 6500 },
        { categorie: 'Transport', montant: 3200 },
        { categorie: 'Santé', montant: 2800 },
        { categorie: 'Éducation', montant: 1800 },
        { categorie: 'Autres', montant: 1300 }
      ]
    },
    alertes: [
      { id: 1, titre: "Dépassement de plafond", description: "Le plafond mensuel de demandes a été atteint", date: "02/05/2025", type: "warning" },
      { id: 2, titre: "Nouvelle demande", description: "Jean Dupont a soumis une nouvelle demande d'avance", date: "01/05/2025", type: "info" },
      { id: 3, titre: "Retard de paiement", description: "Échéance du 30/04 non honorée", date: "01/05/2025", type: "error" }
    ]
  },
  {
    id: '2',
    name: 'Globex Industries',
    logo: '/images/companies/globex.svg',
    industry: 'Manufacture',
    employeesCount: 85,
    createdAt: new Date('2019-05-22'),
    stats: {
      totalEmployes: 85,
      demandesEnCours: 5,
      demandesMois: 18,
      montantTotal: 8900,
      limiteRemboursement: 15000,
      joursAvantRemboursement: 15,
      dateLimiteRemboursement: '20 Juin 2025'
    },
    employeeData: {
      departements: [
        { name: 'Production', value: 40 },
        { name: 'Logistique', value: 20 },
        { name: 'Qualité', value: 10 },
        { name: 'Administratif', value: 10 },
        { name: 'R&D', value: 5 }
      ],
      statuts: [
        { name: 'CDI', value: 65 },
        { name: 'CDD', value: 15 },
        { name: 'Intérim', value: 5 }
      ],
      evolution: [
        { mois: 'Jan', nombre: 75 },
        { mois: 'Fév', nombre: 76 },
        { mois: 'Mar', nombre: 78 },
        { mois: 'Avr', nombre: 80 },
        { mois: 'Mai', nombre: 82 },
        { mois: 'Juin', nombre: 83 },
        { mois: 'Juil', nombre: 85 }
      ]
    },
    financeData: {
      avances: [
        { mois: 'Jan', montant: 1200 },
        { mois: 'Fév', montant: 1100 },
        { mois: 'Mar', montant: 1400 },
        { mois: 'Avr', montant: 1300 },
        { mois: 'Mai', montant: 1500 },
        { mois: 'Juin', montant: 1200 },
        { mois: 'Juil', montant: 1200 }
      ],
      demandes: [
        { mois: 'Jan', nombre: 15 },
        { mois: 'Fév', nombre: 14 },
        { mois: 'Mar', nombre: 18 },
        { mois: 'Avr', nombre: 16 },
        { mois: 'Mai', nombre: 19 },
        { mois: 'Juin', nombre: 15 },
        { mois: 'Juil', nombre: 15 }
      ],
      repartition: [
        { categorie: 'Logement', montant: 3800 },
        { categorie: 'Transport', montant: 1900 },
        { categorie: 'Santé', montant: 1500 },
        { categorie: 'Éducation', montant: 1000 },
        { categorie: 'Autres', montant: 700 }
      ]
    },
    alertes: [
      { id: 1, titre: "Nouvelle demande", description: "Marie Martin a soumis une nouvelle demande d'avance", date: "03/05/2025", type: "info" },
      { id: 2, titre: "Mise à jour système", description: "Maintenance prévue le 10/05", date: "02/05/2025", type: "warning" }
    ]
  },
  {
    id: '3',
    name: 'Stark Enterprises',
    logo: '/images/companies/stark.svg',
    industry: 'Énergie',
    employeesCount: 250,
    createdAt: new Date('2018-11-08'),
    stats: {
      totalEmployes: 250,
      demandesEnCours: 15,
      demandesMois: 45,
      montantTotal: 28500,
      limiteRemboursement: 35000,
      joursAvantRemboursement: 5,
      dateLimiteRemboursement: '20 Juin 2025'
    },
    employeeData: {
      departements: [
        { name: 'Ingénierie', value: 100 },
        { name: 'R&D', value: 60 },
        { name: 'Production', value: 50 },
        { name: 'Administratif', value: 25 },
        { name: 'Commercial', value: 15 }
      ],
      statuts: [
        { name: 'CDI', value: 200 },
        { name: 'CDD', value: 30 },
        { name: 'Stagiaire', value: 15 },
        { name: 'Apprenti', value: 5 }
      ],
      evolution: [
        { mois: 'Jan', nombre: 230 },
        { mois: 'Fév', nombre: 235 },
        { mois: 'Mar', nombre: 240 },
        { mois: 'Avr', nombre: 242 },
        { mois: 'Mai', nombre: 245 },
        { mois: 'Juin', nombre: 248 },
        { mois: 'Juil', nombre: 250 }
      ]
    },
    financeData: {
      avances: [
        { mois: 'Jan', montant: 3800 },
        { mois: 'Fév', montant: 3600 },
        { mois: 'Mar', montant: 4200 },
        { mois: 'Avr', montant: 4000 },
        { mois: 'Mai', montant: 4500 },
        { mois: 'Juin', montant: 4200 },
        { mois: 'Juil', montant: 4200 }
      ],
      demandes: [
        { mois: 'Jan', nombre: 40 },
        { mois: 'Fév', nombre: 38 },
        { mois: 'Mar', nombre: 45 },
        { mois: 'Avr', nombre: 42 },
        { mois: 'Mai', nombre: 48 },
        { mois: 'Juin', nombre: 45 },
        { mois: 'Juil', nombre: 45 }
      ],
      repartition: [
        { categorie: 'Logement', montant: 12000 },
        { categorie: 'Transport', montant: 6500 },
        { categorie: 'Santé', montant: 5000 },
        { categorie: 'Éducation', montant: 3500 },
        { categorie: 'Autres', montant: 1500 }
      ]
    },
    alertes: [
      { id: 1, titre: "Pic de demandes", description: "Augmentation significative des demandes ce mois-ci", date: "04/05/2025", type: "warning" },
      { id: 2, titre: "Nouvelle politique", description: "Mise à jour des conditions d'avance", date: "03/05/2025", type: "info" },
      { id: 3, titre: "Succès du programme", description: "Objectif trimestriel atteint", date: "01/05/2025", type: "success" }
    ]
  }
];

// Liste des administrateurs d'entreprises
export const admins: Admin[] = [
  {
    id: '1',
    email: 'admin@acme.com',
    password: 'password123', // Dans une vraie application, utilisez un hash sécurisé
    name: 'John Smith',
    role: 'Administrateur',
    companyId: '1' // Acme Corporation
  },
  {
    id: '2',
    email: 'admin@globex.com',
    password: 'password123',
    name: 'Sarah Johnson',
    role: 'Administrateur',
    companyId: '2' // Globex Industries
  },
  {
    id: '3',
    email: 'admin@stark.com',
    password: 'password123',
    name: 'Tony Stark',
    role: 'Administrateur',
    companyId: '3' // Stark Enterprises
  }
];

// Fonction utilitaire pour obtenir une entreprise par ID
export function getCompanyById(id: string): Company | undefined {
  return companies.find(company => company.id === id);
}

// Fonction utilitaire pour authentifier un administrateur
export function authenticateAdmin(email: string, password: string): Admin | null {
  return admins.find(admin => admin.email === email && admin.password === password) || null;
}

// Fonction utilitaire pour obtenir l'entreprise d'un administrateur
export function getCompanyByAdminId(adminId: string): Company | undefined {
  const admin = admins.find(a => a.id === adminId);
  if (!admin) return undefined;
  
  return getCompanyById(admin.companyId);
}

// Fonction utilitaire pour obtenir l'entreprise par email d'administrateur
export function getCompanyByAdminEmail(email: string): Company | undefined {
  const admin = admins.find(a => a.email === email);
  if (!admin) return undefined;
  
  return getCompanyById(admin.companyId);
}
