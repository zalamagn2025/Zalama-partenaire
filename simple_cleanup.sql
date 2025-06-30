-- =====================================================
-- SCRIPT SIMPLE POUR NETTOYER ET CORRIGER LES DONNÉES
-- =====================================================

-- 1. Supprimer la table demandes_p2p si elle existe
DROP TABLE IF EXISTS demandes_p2p CASCADE;

-- 2. Corriger les avis pour les lier au bon partenaire
UPDATE avis 
SET partner_id = '61322992-9f29-4065-a0de-e2512e83f261'
WHERE partner_id != '61322992-9f29-4065-a0de-e2512e83f261';

-- 3. Corriger les employés pour les lier au bon partenaire
UPDATE employees 
SET partner_id = '61322992-9f29-4065-a0de-e2512e83f261'
WHERE partner_id != '61322992-9f29-4065-a0de-e2512e83f261';

-- 4. Corriger les demandes d'avance pour les lier au bon partenaire
UPDATE demandes_avance_salaire 
SET partner_id = '61322992-9f29-4065-a0de-e2512e83f261'
WHERE partner_id != '61322992-9f29-4065-a0de-e2512e83f261';

-- 5. Créer des avis pour le partenaire connecté s'il n'y en a pas
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
    '61322992-9f29-4065-a0de-e2512e83f261' as partner_id,
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
FROM users u
WHERE u.type IN ('Salarié', 'Entreprise')
AND NOT EXISTS (
    SELECT 1 FROM avis a 
    WHERE a.user_id = u.id 
    AND a.partner_id = '61322992-9f29-4065-a0de-e2512e83f261'
)
LIMIT 5;

-- 6. Vérifier les résultats
SELECT 'RÉSULTATS FINAUX' as info;
SELECT 'DEMANDES AVANCE' as type, COUNT(*) as count FROM demandes_avance_salaire WHERE partner_id = '61322992-9f29-4065-a0de-e2512e83f261';
SELECT 'AVIS' as type, COUNT(*) as count FROM avis WHERE partner_id = '61322992-9f29-4065-a0de-e2512e83f261';
SELECT 'EMPLOYÉS' as type, COUNT(*) as count FROM employees WHERE partner_id = '61322992-9f29-4065-a0de-e2512e83f261'; 