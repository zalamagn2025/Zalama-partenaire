-- Script pour insérer des alertes de test pour YouCompany
INSERT INTO alerts (
  id,
  titre,
  description,
  type,
  statut,
  date_creation,
  created_at,
  updated_at
) VALUES 
-- Alertes pour YouCompany
(
  gen_random_uuid(),
  'Demande d''avance en attente depuis plus de 48h',
  'La demande d''avance de salaire de Ibrahim Keita est en attente depuis plus de 48h. Action requise.',
  'Importante',
  'Active',
  '2025-01-25 08:00:00',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Taux de validation des demandes en baisse',
  'Le taux de validation des demandes d''avance est passé de 80% à 65% ce mois. Analyse requise.',
  'Critique',
  'Active',
  '2025-01-24 14:30:00',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Nouvelle demande d''avance urgente',
  'Mariama Diallo a soumis une demande d''avance urgente pour frais médicaux. Traitement prioritaire.',
  'Urgente',
  'Active',
  '2025-01-23 16:15:00',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Maintenance système prévue',
  'Une maintenance du système d''avance de salaire est prévue le 28 janvier de 22h à 02h.',
  'Information',
  'Active',
  '2025-01-22 10:00:00',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Formation RH disponible',
  'Une nouvelle formation sur la gestion des demandes d''avance est disponible pour l''équipe RH.',
  'Information',
  'Résolue',
  '2025-01-21 09:45:00',
  NOW(),
  NOW()
);

-- Vérifier les alertes insérées
SELECT 
  id,
  titre,
  description,
  type,
  statut,
  date_creation
FROM alerts
ORDER BY date_creation DESC; 