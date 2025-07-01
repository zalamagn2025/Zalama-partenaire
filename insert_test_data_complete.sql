-- Script pour insérer des données de test complètes dans la base de données Zalama

-- Désactiver temporairement la RLS pour l'insertion
ALTER TABLE avis DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;

-- 1. Insérer des avis de test
INSERT INTO avis (id, employee_id, partner_id, note, commentaire, type_retour, date_avis, approuve, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employees LIMIT 1), (SELECT id FROM partners LIMIT 1), 5, 'Excellent service d''avance sur salaire, très rapide et efficace!', 'positif', NOW() - INTERVAL '5 days', true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM employees OFFSET 1 LIMIT 1), (SELECT id FROM partners LIMIT 1), 4, 'Bon service, quelques améliorations possibles au niveau de l''interface', 'positif', NOW() - INTERVAL '10 days', true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM employees OFFSET 2 LIMIT 1), (SELECT id FROM partners LIMIT 1), 5, 'Parfait pour les urgences financières, je recommande vivement', 'positif', NOW() - INTERVAL '15 days', true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM employees LIMIT 1), (SELECT id FROM partners LIMIT 1), 4, 'Service client très réactif et professionnel', 'positif', NOW() - INTERVAL '20 days', true, NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM employees OFFSET 1 LIMIT 1), (SELECT id FROM partners LIMIT 1), 3, 'Correct mais délais un peu longs', 'negatif', NOW() - INTERVAL '25 days', true, NOW(), NOW());

-- 2. Insérer des transactions financières de test
INSERT INTO financial_transactions (transaction_id, montant, type, description, partenaire_id, statut, date_transaction, reference, created_at, updated_at) VALUES
(1001, 2500000, 'debloque', 'Avance sur salaire - Janvier 2024', (SELECT id FROM partners LIMIT 1), 'Validé', '2024-01-15', 'AVC-2024-001', NOW(), NOW()),
(1002, 1800000, 'debloque', 'Avance sur salaire - Février 2024', (SELECT id FROM partners LIMIT 1), 'Validé', '2024-02-10', 'AVC-2024-002', NOW(), NOW()),
(1003, 3200000, 'debloque', 'Avance sur salaire - Mars 2024', (SELECT id FROM partners LIMIT 1), 'Validé', '2024-03-05', 'AVC-2024-003', NOW(), NOW()),
(1004, 2100000, 'recupere', 'Remboursement - Mars 2024', (SELECT id FROM partners LIMIT 1), 'Validé', '2024-03-25', 'RMB-2024-001', NOW(), NOW()),
(1005, 4500000, 'debloque', 'Avance sur salaire - Avril 2024', (SELECT id FROM partners LIMIT 1), 'Validé', '2024-04-12', 'AVC-2024-004', NOW(), NOW()),
(1006, 1200000, 'recupere', 'Remboursement - Avril 2024', (SELECT id FROM partners LIMIT 1), 'Validé', '2024-04-28', 'RMB-2024-002', NOW(), NOW()),
(1007, 2800000, 'debloque', 'Avance sur salaire - Mai 2024', (SELECT id FROM partners LIMIT 1), 'En attente', NOW() - INTERVAL '3 days', 'AVC-2024-005', NOW(), NOW()),
(1008, 150000, 'commission', 'Commission service - Q1 2024', (SELECT id FROM partners LIMIT 1), 'Validé', '2024-03-31', 'COM-2024-001', NOW(), NOW());

-- 3. Insérer des messages de test
INSERT INTO messages (message_id, expediteur, destinataire, sujet, contenu, type, priorite, statut, lu, date_envoi, created_at, updated_at) VALUES
(gen_random_uuid(), 'Zalama Admin', (SELECT nom FROM partners LIMIT 1), 'Nouvelle fonctionnalité disponible', 'Nous avons le plaisir de vous informer qu''une nouvelle fonctionnalité d''avance sur salaire est maintenant disponible.', 'Information', 'Normale', 'Envoyé', false, NOW() - INTERVAL '2 days', NOW(), NOW()),
(gen_random_uuid(), 'Support Technique', (SELECT nom FROM partners LIMIT 1), 'Maintenance programmée', 'Une maintenance est programmée ce week-end de 2h à 4h du matin. Les services seront temporairement indisponibles.', 'Maintenance', 'Importante', 'Envoyé', false, NOW() - INTERVAL '5 days', NOW(), NOW()),
(gen_random_uuid(), 'Équipe Financière', (SELECT nom FROM partners LIMIT 1), 'Rapport mensuel disponible', 'Votre rapport financier mensuel est maintenant disponible dans votre tableau de bord.', 'Rapport', 'Normale', 'Envoyé', true, NOW() - INTERVAL '7 days', NOW(), NOW()),
(gen_random_uuid(), 'Zalama Admin', (SELECT nom FROM partners LIMIT 1), 'Validation de demande requise', 'Plusieurs demandes d''avance sont en attente de validation de votre part.', 'Demande', 'Urgente', 'Envoyé', false, NOW() - INTERVAL '1 day', NOW(), NOW());

-- 4. Insérer des alertes de test
INSERT INTO alerts (id, titre, description, type, statut, source, date_creation, priorite, created_at, updated_at) VALUES
(gen_random_uuid(), 'Pic d''activité détecté', 'Un nombre inhabituellement élevé de demandes d''avance a été enregistré aujourd''hui', 'Information', 'Nouvelle', 'Système automatique', NOW() - INTERVAL '2 hours', 2, NOW(), NOW()),
(gen_random_uuid(), 'Limite budgétaire approchée', 'Vous approchez de votre limite budgétaire mensuelle pour les avances sur salaire', 'Importante', 'En cours', 'Système financier', NOW() - INTERVAL '1 day', 3, NOW(), NOW()),
(gen_random_uuid(), 'Maintenance système terminée', 'La maintenance programmée du système s''est terminée avec succès', 'Information', 'Résolue', 'Équipe technique', NOW() - INTERVAL '3 days', 1, NOW(), NOW()),
(gen_random_uuid(), 'Nouvelle réglementation', 'De nouvelles réglementations bancaires entrent en vigueur le mois prochain', 'Importante', 'Nouvelle', 'Équipe juridique', NOW() - INTERVAL '5 days', 3, NOW(), NOW());

-- 5. Mettre à jour quelques employés avec des salaires réalistes
UPDATE employees SET 
    salaire_net = CASE 
        WHEN poste LIKE '%Directeur%' OR poste LIKE '%Manager%' THEN 4000000 + (RANDOM() * 2000000)::INTEGER
        WHEN poste LIKE '%Senior%' OR poste LIKE '%Lead%' THEN 2500000 + (RANDOM() * 1500000)::INTEGER
        ELSE 1500000 + (RANDOM() * 1000000)::INTEGER
    END
WHERE salaire_net IS NULL OR salaire_net = 0;

-- 6. Ajouter quelques demandes d'avance sur salaire en attente
INSERT INTO salary_advance_requests (id, employe_id, partenaire_id, montant_demande, type_motif, motif, statut, date_creation, created_at, updated_at) VALUES
(gen_random_uuid(), (SELECT id FROM employees LIMIT 1), (SELECT id FROM partners LIMIT 1), 1500000, 'Urgence médicale', 'Frais médicaux urgents pour un membre de la famille', 'En attente', NOW() - INTERVAL '2 days', NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM employees OFFSET 1 LIMIT 1), (SELECT id FROM partners LIMIT 1), 2000000, 'Loyer', 'Paiement du loyer mensuel', 'En attente', NOW() - INTERVAL '1 day', NOW(), NOW()),
(gen_random_uuid(), (SELECT id FROM employees OFFSET 2 LIMIT 1), (SELECT id FROM partners LIMIT 1), 800000, 'Éducation', 'Frais de scolarité des enfants', 'En attente', NOW() - INTERVAL '3 hours', NOW(), NOW());

-- Réactiver la RLS
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Afficher un résumé des données insérées
SELECT 'Avis insérés' as type, COUNT(*) as nombre FROM avis
UNION ALL
SELECT 'Messages insérés' as type, COUNT(*) as nombre FROM messages
UNION ALL
SELECT 'Transactions insérées' as type, COUNT(*) as nombre FROM financial_transactions
UNION ALL
SELECT 'Alertes insérées' as type, COUNT(*) as nombre FROM alerts
UNION ALL
SELECT 'Demandes d''avance insérées' as type, COUNT(*) as nombre FROM salary_advance_requests; 