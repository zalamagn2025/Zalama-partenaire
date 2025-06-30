-- Script pour insérer des messages de test pour YouCompany
INSERT INTO messages (
  id,
  expediteur_id,
  destinataire_id,
  sujet,
  contenu,
  lu,
  date_envoi,
  created_at,
  updated_at
) VALUES 
-- Messages pour le DG (ousmane.sow@youcompany.com)
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'aissatou.bah@youcompany.com'),
  (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'),
  'Rapport mensuel RH - Janvier 2025',
  'Bonjour Ousmane, voici le rapport mensuel des ressources humaines pour janvier 2025. Nous avons traité 12 demandes d''avance de salaire avec un taux de validation de 75%.',
  false,
  '2025-01-25 10:30:00',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'ibrahim.keita@youcompany.com'),
  (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'),
  'Demande d''avance de salaire urgente',
  'Bonjour Monsieur le Directeur, j''ai une situation familiale urgente et j''aurais besoin d''une avance de salaire de 300 000 GNF. Merci de votre compréhension.',
  true,
  '2025-01-24 14:15:00',
  NOW(),
  NOW()
),

-- Messages pour la RH (aissatou.bah@youcompany.com)
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'),
  (SELECT id FROM users WHERE email = 'aissatou.bah@youcompany.com'),
  'Validation des demandes d''avance',
  'Bonjour Aissatou, pouvez-vous traiter les demandes d''avance en attente avant la fin de la semaine ? Merci.',
  false,
  '2025-01-25 09:00:00',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'mariama.diallo@youcompany.com'),
  (SELECT id FROM users WHERE email = 'aissatou.bah@youcompany.com'),
  'Question sur les frais de service',
  'Bonjour Madame, j''aimerais savoir pourquoi les frais de service ont augmenté sur ma dernière demande d''avance. Merci.',
  true,
  '2025-01-23 16:45:00',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'sekou.camara@youcompany.com'),
  (SELECT id FROM users WHERE email = 'aissatou.bah@youcompany.com'),
  'Demande de formation',
  'Bonjour, j''aimerais savoir si ma demande de formation en design UX/UI peut être réexaminée. Merci.',
  false,
  '2025-01-22 11:20:00',
  NOW(),
  NOW()
);

-- Vérifier les messages insérés
SELECT 
  m.id,
  e.prenom || ' ' || e.nom as expediteur,
  d.prenom || ' ' || d.nom as destinataire,
  m.sujet,
  m.contenu,
  m.lu,
  m.date_envoi
FROM messages m
JOIN users e ON m.expediteur_id = e.id
JOIN users d ON m.destinataire_id = d.id
WHERE e.organisation = 'YouCompany' OR d.organisation = 'YouCompany'
ORDER BY m.date_envoi DESC; 