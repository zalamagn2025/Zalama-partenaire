import { Notification } from './types';

// Données factices pour les notifications
export const notificationsMock: Notification[] = [
  {
    id: 1,
    title: "Nouvelle demande d'employé",
    message: "Jean Dupont a soumis une nouvelle demande de congés pour la période du 15 au 20 juin.",
    type: "info",
    timestamp: new Date(2025, 4, 2, 9, 30),
    read: false,
    link: "/dashboard/entreprise/demandes"
  },
  {
    id: 2,
    title: "Alerte de sécurité",
    message: "Une tentative de connexion suspecte a été détectée depuis Paris. Veuillez vérifier votre compte.",
    type: "warning",
    timestamp: new Date(2025, 4, 1, 18, 45),
    read: false,
    link: "/dashboard/entreprise/parametres"
  },
  {
    id: 3,
    title: "Paiement reçu",
    message: "Le paiement de 1500GNF pour le projet XYZ a été reçu avec succès.",
    type: "success",
    timestamp: new Date(2025, 4, 1, 14, 20),
    read: false,
    link: "/dashboard/entreprise/finances"
  },
  {
    id: 4,
    title: "Échéance de projet",
    message: "Le projet 'Refonte du site web' arrive à échéance dans 3 jours. Veuillez vérifier l'avancement.",
    type: "warning",
    timestamp: new Date(2025, 4, 1, 11, 0),
    read: true,
    link: "/dashboard/entreprise/projets"
  },
  {
    id: 5,
    title: "Nouvel employé",
    message: "Marie Martin a rejoint l'équipe. Veuillez l'ajouter aux projets en cours.",
    type: "info",
    timestamp: new Date(2025, 3, 30, 9, 15),
    read: true,
    link: "/dashboard/entreprise/employes"
  },
  {
    id: 6,
    title: "Mise à jour du système",
    message: "Une mise à jour importante du système est disponible. Veuillez planifier l'installation.",
    type: "info",
    timestamp: new Date(2025, 3, 29, 16, 30),
    read: true
  },
  {
    id: 7,
    title: "Erreur de facturation",
    message: "Une erreur a été détectée dans la facture #F-2025-042. Veuillez la vérifier et la corriger.",
    type: "error",
    timestamp: new Date(2025, 3, 29, 14, 0),
    read: true,
    link: "/dashboard/entreprise/finances"
  },
  {
    id: 8,
    title: "Réunion d'équipe",
    message: "Rappel : Réunion d'équipe hebdomadaire demain à 10h00.",
    type: "info",
    timestamp: new Date(2025, 3, 28, 15, 45),
    read: true
  }
];
