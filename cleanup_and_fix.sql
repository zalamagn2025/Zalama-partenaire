-- =====================================================
-- SCRIPT POUR NETTOYER ET CORRIGER LES DONNÉES
-- =====================================================

-- 1. Supprimer la table demandes_p2p
DROP TABLE IF EXISTS demandes_p2p CASCADE;

-- 2. Vérifier les avis existants
SELECT 'AVIS EXISTANTS' as info;
SELECT 
    id,
    user_id,
    partner_id,
    note,
    commentaire,
    date_avis,
    created_at
FROM avis
ORDER BY created_at DESC
LIMIT 5;

-- 3. Vérifier les partenaires existants
SELECT 'PARTENAIRES EXISTANTS' as info;
SELECT id, nom, email_representant FROM partners LIMIT 5;

-- 4. Trouver le partenaire qui se connecte (fatou.camara@innovatech.com)
SELECT 'PARTENAIRE CONNECTÉ' as info;
SELECT id, nom, email_representant FROM partners 
WHERE email_representant = 'fatou.camara@innovatech.com';

-- 5. Corriger les avis pour les lier au bon partenaire
UPDATE avis 
SET partner_id = (
    SELECT id FROM partners 
    WHERE email_representant = 'fatou.camara@innovatech.com'
    LIMIT 1
)
WHERE partner_id != (
    SELECT id FROM partners 
    WHERE email_representant = 'fatou.camara@innovatech.com'
    LIMIT 1
);

-- 6. Si pas d'avis pour le bon partenaire, en créer
INSERT INTO avis (
    user_id,
    partner_id,
    note,
    commentaire,
    date_avis,
    approuve,
    created_at,
    updated_at
)
SELECT 
    u.id as user_id,
    p.id as partner_id,
    CASE 
        WHEN random() > 0.7 THEN 5
        WHEN random() > 0.5 THEN 4
        ELSE 3
    END as note,
    CASE 
        WHEN random() > 0.7 THEN 'Excellent service, très satisfait !'
        WHEN random() > 0.5 THEN 'Bon service, je recommande.'
        ELSE 'Service correct.'
    END as commentaire,
    NOW() as date_avis,
    true as approuve,
    NOW() as created_at,
    NOW() as updated_at
FROM users u, partners p
WHERE p.email_representant = 'fatou.camara@innovatech.com'
AND u.type IN ('Salarié', 'Entreprise')
LIMIT 5
ON CONFLICT DO NOTHING;

-- 7. Vérifier les résultats
SELECT 'RÉSULTATS FINAUX' as info;
SELECT 'DEMANDES AVANCE' as type, COUNT(*) as count FROM demandes_avance_salaire;
SELECT 'AVIS' as type, COUNT(*) as count FROM avis;
SELECT 'EMPLOYÉS' as type, COUNT(*) as count FROM employees;

-- 8. Afficher les avis pour le partenaire connecté
SELECT 
    'Avis pour le partenaire connecté' as info,
    id,
    user_id,
    partner_id,
    note,
    commentaire,
    date_avis
FROM avis
WHERE partner_id = (
    SELECT id FROM partners 
    WHERE email_representant = 'fatou.camara@innovatech.com'
    LIMIT 1
)
ORDER BY created_at DESC
LIMIT 5;

-- 9. Afficher les demandes d'avance pour le partenaire connecté
SELECT 
    'Demandes avance pour le partenaire connecté' as info,
    id,
    employee_id,
    partner_id,
    montant,
    statut,
    date_demande
FROM demandes_avance_salaire
WHERE partner_id = (
    SELECT id FROM partners 
    WHERE email_representant = 'fatou.camara@innovatech.com'
    LIMIT 1
)
ORDER BY created_at DESC
LIMIT 5; 