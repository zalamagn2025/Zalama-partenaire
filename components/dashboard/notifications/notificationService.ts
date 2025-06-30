import { Notification } from './types';

// Données factices pour les notifications
export const notificationsMock: Notification[] = [
  {
    id: 1,
    title: "Nouvelle entreprise inscrite",
    message: "L'entreprise 'TechSolutions' vient de s'inscrire sur la plateforme.",
    type: "info",
    timestamp: new Date(2025, 4, 2, 14, 30),
    read: false,
    link: "/dashboard/entreprise/techsolutions"
  },
  {
    id: 2,
    title: "Alerte de sécurité",
    message: "Tentative de connexion suspecte détectée depuis une adresse IP inconnue.",
    type: "warning",
    timestamp: new Date(2025, 4, 2, 10, 15),
    read: false,
    link: "/dashboard/settings"
  },
  {
    id: 3,
    title: "Objectif atteint",
    message: "L'objectif mensuel d'inscriptions a été atteint avec 500 nouveaux utilisateurs.",
    type: "success",
    timestamp: new Date(2025, 4, 1, 18, 45),
    read: false,
    link: "/dashboard/performance"
  },
  {
    id: 4,
    title: "Erreur système",
    message: "Une erreur est survenue lors de la génération des rapports quotidiens.",
    type: "error",
    timestamp: new Date(2025, 4, 1, 15, 20),
    read: true,
    link: "/dashboard/alertes"
  },
  {
    id: 5,
    title: "Mise à jour disponible",
    message: "Une nouvelle version de la plateforme est disponible. Veuillez planifier la mise à jour.",
    type: "info",
    timestamp: new Date(2025, 4, 1, 11, 0),
    read: true
  },
  {
    id: 6,
    title: "Nouveau partenaire",
    message: "L'entreprise 'GlobalFinance' a rejoint notre programme de partenariat.",
    type: "info",
    timestamp: new Date(2025, 3, 30, 16, 30),
    read: true,
    link: "/dashboard/partenaires"
  },
  {
    id: 7,
    title: "Pic d'utilisation",
    message: "Un pic d'utilisation a été détecté avec plus de 2000 utilisateurs simultanés.",
    type: "warning",
    timestamp: new Date(2025, 3, 30, 14, 0),
    read: true,
    link: "/dashboard/performance"
  },
  {
    id: 8,
    title: "Maintenance planifiée",
    message: "Une maintenance est planifiée le 5 mai de 2h à 4h du matin.",
    type: "info",
    timestamp: new Date(2025, 3, 29, 15, 45),
    read: true
  }
];
