-- =====================================================
-- SCRIPT POUR INSÉRER DES DONNÉES DE TEST DANS salary_advance_requests
-- =====================================================

-- Insertion de demandes d'avance de salaire pour YouCompany
INSERT INTO salary_advance_requests (
    employe_id,
    partenaire_id,
    montant_demande,
    type_motif,
    motif,
    numero_reception,
    frais_service,
    montant_total,
    salaire_disponible,
    avance_disponible,
    statut,
    date_creation,
    date_validation,
    date_rejet,
    motif_rejet,
    created_at,
    updated_at
) VALUES 
    -- Demande 1 : Ibrahim Keita - Frais médicaux (En attente)
    (
        (SELECT id FROM employees WHERE email = 'ibrahim.keita@youcompany.com'),
        (SELECT id FROM partners WHERE nom = 'YouCompany'),
        300000,
        'Frais médicaux',
        'Frais médicaux urgents pour consultation spécialisée',
        'REF-001-2024',
        15000,
        315000,
        850000,
        400000,
        'En attente',
        NOW() - INTERVAL '5 days',
        NULL,
        NULL,
        NULL,
        NOW(),
        NOW()
    ),
    
    -- Demande 2 : Mariama Diallo - Équipement informatique (Approuvée)
    (
        (SELECT id FROM employees WHERE email = 'mariama.diallo@youcompany.com'),
        (SELECT id FROM partners WHERE nom = 'YouCompany'),
        500000,
        'Équipement',
        'Achat d''un ordinateur portable pour le travail à distance',
        'REF-002-2024',
        25000,
        525000,
        950000,
        600000,
        'Validé',
        NOW() - INTERVAL '3 days',
        NOW() - INTERVAL '2 days',
        NULL,
        NULL,
        NOW(),
        NOW()
    ),
    
    -- Demande 3 : Sekou Camara - Frais de transport (En attente)
    (
        (SELECT id FROM employees WHERE email = 'sekou.camara@youcompany.com'),
        (SELECT id FROM partners WHERE nom = 'YouCompany'),
        200000,
        'Transport',
        'Frais de transport pour déplacement professionnel',
        'REF-003-2024',
        10000,
        210000,
        750000,
        300000,
        'En attente',
        NOW() - INTERVAL '1 day',
        NULL,
        NULL,
        NULL,
        NOW(),
        NOW()
    ),
    
    -- Demande 4 : Fatoumata Sow - Formation (Rejetée)
    (
        (SELECT id FROM employees WHERE email = 'fatoumata.sow@youcompany.com'),
        (SELECT id FROM partners WHERE nom = 'YouCompany'),
        400000,
        'Formation',
        'Formation en design UX/UI avancé',
        'REF-004-2024',
        20000,
        420000,
        700000,
        350000,
        'Rejeté',
        NOW() - INTERVAL '7 days',
        NULL,
        NOW() - INTERVAL '6 days',
        'Budget formation non disponible pour le moment',
        NOW(),
        NOW()
    ),
    
    -- Demande 5 : Mamadou Bah - Maintenance véhicule (Validé)
    (
        (SELECT id FROM employees WHERE email = 'mamadou.bah@youcompany.com'),
        (SELECT id FROM partners WHERE nom = 'YouCompany'),
        150000,
        'Maintenance',
        'Maintenance du véhicule de service',
        'REF-005-2024',
        7500,
        157500,
        900000,
        500000,
        'Validé',
        NOW() - INTERVAL '10 days',
        NOW() - INTERVAL '9 days',
        NULL,
        NULL,
        NOW(),
        NOW()
    )
ON CONFLICT DO NOTHING;

-- =====================================================
-- VÉRIFICATION DES DONNÉES INSÉRÉES
-- =====================================================
SELECT 
    'Demandes d''avance YouCompany' as type,
    sar.id,
    e.nom || ' ' || e.prenom as employe,
    sar.montant_demande,
    sar.type_motif,
    sar.statut,
    sar.date_creation
FROM salary_advance_requests sar
JOIN employees e ON sar.employe_id = e.id
JOIN partners p ON sar.partenaire_id = p.id
WHERE p.nom = 'YouCompany'
ORDER BY sar.date_creation DESC;

-- =====================================================
-- STATISTIQUES DES DEMANDES
-- =====================================================
SELECT 
    statut,
    COUNT(*) as nombre_demandes,
    SUM(montant_demande) as montant_total,
    AVG(montant_demande) as montant_moyen
FROM salary_advance_requests sar
JOIN partners p ON sar.partenaire_id = p.id
WHERE p.nom = 'YouCompany'
GROUP BY statut
ORDER BY nombre_demandes DESC;

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Données de test insérées dans salary_advance_requests !';
    RAISE NOTICE '5 demandes d''avance créées pour YouCompany';
    RAISE NOTICE 'Statuts: En attente (2), Validé (2), Rejeté (1)';
END $$; 