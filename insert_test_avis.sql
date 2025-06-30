-- Script pour insérer des avis de test pour YouCompany
INSERT INTO avis (
  id,
  user_id,
  partner_id,
  note,
  commentaire,
  date_avis,
  created_at,
  updated_at
) VALUES 
-- Avis pour YouCompany (partner_id: e58fc4f9-83c9-45a2-a7b3-275d382664f9)
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'),
  'e58fc4f9-83c9-45a2-a7b3-275d382664f9',
  5,
  'Service exceptionnel ! Le processus d''avance de salaire est très simple et rapide. Je recommande vivement.',
  '2025-01-25',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'aissatou.bah@youcompany.com'),
  'e58fc4f9-83c9-45a2-a7b3-275d382664f9',
  4,
  'Très satisfaite du service. L''équipe est professionnelle et réactive.',
  '2025-01-24',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'ibrahim.keita@youcompany.com'),
  'e58fc4f9-83c9-45a2-a7b3-275d382664f9',
  5,
  'Excellent service ! J''ai reçu mon avance en moins de 24h. Très efficace.',
  '2025-01-23',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'mariama.diallo@youcompany.com'),
  'e58fc4f9-83c9-45a2-a7b3-275d382664f9',
  4,
  'Service de qualité. Les frais sont raisonnables et le processus est transparent.',
  '2025-01-22',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'sekou.camara@youcompany.com'),
  'e58fc4f9-83c9-45a2-a7b3-275d382664f9',
  3,
  'Service correct mais pourrait être plus rapide. Interface utilisateur à améliorer.',
  '2025-01-21',
  NOW(),
  NOW()
);

-- Vérifier les avis insérés
SELECT 
  a.id,
  u.prenom || ' ' || u.nom as utilisateur,
  p.nom as partenaire,
  a.note,
  a.commentaire,
  a.date_avis
FROM avis a
JOIN users u ON a.user_id = u.id
JOIN partners p ON a.partner_id = p.id
WHERE p.nom = 'YouCompany'
ORDER BY a.date_avis DESC; 