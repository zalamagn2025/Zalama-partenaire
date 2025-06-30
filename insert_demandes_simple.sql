-- =====================================================
-- SCRIPT SIMPLE POUR INSÉRER DES DEMANDES DE TEST
-- =====================================================

-- Insérer des demandes d'avance sur salaire
INSERT INTO demandes_avance_salaire (
    employee_id,
    partner_id,
    montant,
    motif,
    date_demande,
    date_remboursement,
    statut,
    priorite,
    created_at,
    updated_at
)
SELECT 
    e.id as employee_id,
    e.partner_id,
    CASE 
        WHEN random() > 0.5 THEN 250000
        ELSE 350000
    END as montant,
    CASE 
        WHEN random() > 0.7 THEN 'Urgences familiales'
        WHEN random() > 0.5 THEN 'Achat d''équipement'
        ELSE 'Formation professionnelle'
    END as motif,
    NOW() as date_demande,
    (NOW() + INTERVAL '30 days')::date as date_remboursement,
    CASE 
        WHEN random() > 0.7 THEN 'Approuvée'
        WHEN random() > 0.5 THEN 'En cours'
        ELSE 'En attente'
    END as statut,
    CASE 
        WHEN random() > 0.8 THEN 3
        WHEN random() > 0.5 THEN 2
        ELSE 1
    END as priorite,
    NOW() as created_at,
    NOW() as updated_at
FROM employees e
LIMIT 5;

-- Insérer des demandes P2P
INSERT INTO demandes_p2p (
    employee_id,
    partner_id,
    montant,
    duree_mois,
    motif,
    taux_interet,
    date_demande,
    date_debut_remboursement,
    statut,
    priorite,
    created_at,
    updated_at
)
SELECT 
    e.id as employee_id,
    e.partner_id,
    CASE 
        WHEN random() > 0.5 THEN 1500000
        ELSE 2000000
    END as montant,
    CASE 
        WHEN random() > 0.5 THEN 12
        ELSE 18
    END as duree_mois,
    CASE 
        WHEN random() > 0.7 THEN 'Développement de projet personnel'
        WHEN random() > 0.5 THEN 'Formation professionnelle'
        ELSE 'Achat d''équipement informatique'
    END as motif,
    CASE 
        WHEN random() > 0.5 THEN 0.08
        ELSE 0.12
    END as taux_interet,
    NOW() as date_demande,
    (NOW() + INTERVAL '60 days')::date as date_debut_remboursement,
    CASE 
        WHEN random() > 0.7 THEN 'Approuvée'
        WHEN random() > 0.5 THEN 'En cours'
        ELSE 'En attente'
    END as statut,
    CASE 
        WHEN random() > 0.8 THEN 3
        WHEN random() > 0.5 THEN 2
        ELSE 1
    END as priorite,
    NOW() as created_at,
    NOW() as updated_at
FROM employees e
LIMIT 5;

-- Vérifier les données insérées
SELECT 'DEMANDES AVANCE' as type, COUNT(*) as count FROM demandes_avance_salaire;
SELECT 'DEMANDES P2P' as type, COUNT(*) as count FROM demandes_p2p;

-- Afficher quelques exemples
SELECT 
    'Demande Avance' as type,
    id,
    employee_id,
    partner_id,
    montant,
    statut
FROM demandes_avance_salaire
ORDER BY created_at DESC
LIMIT 3;

SELECT 
    'Demande P2P' as type,
    id,
    employee_id,
    partner_id,
    montant,
    duree_mois,
    statut
FROM demandes_p2p
ORDER BY created_at DESC
LIMIT 3; 