-- =====================================================
-- SCRIPT SIMPLE POUR INSÉRER DES DEMANDES D'AVANCE DE TEST
-- =====================================================

-- Vérifier que la table existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'salary_advance_requests'
) as table_exists;

-- Insérer des demandes d'avance de test pour YouCompany
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
    created_at,
    updated_at
) VALUES 
    -- Demande 1 : Test simple
    (
        (SELECT id FROM employees WHERE email = 'ibrahim.keita@youcompany.com' LIMIT 1),
        (SELECT id FROM partners WHERE nom = 'YouCompany' LIMIT 1),
        250000,
        'Frais médicaux',
        'Consultation médicale urgente',
        'REF-TEST-001',
        12500,
        262500,
        850000,
        400000,
        'En attente',
        NOW() - INTERVAL '3 days',
        NOW(),
        NOW()
    ),
    
    -- Demande 2 : Test simple
    (
        (SELECT id FROM employees WHERE email = 'mariama.diallo@youcompany.com' LIMIT 1),
        (SELECT id FROM partners WHERE nom = 'YouCompany' LIMIT 1),
        300000,
        'Équipement',
        'Achat ordinateur portable',
        'REF-TEST-002',
        15000,
        315000,
        950000,
        500000,
        'Validé',
        NOW() - INTERVAL '1 day',
        NOW(),
        NOW()
    )
ON CONFLICT DO NOTHING;

-- Vérifier les données insérées
SELECT 
    'Demandes d''avance test' as type,
    COUNT(*) as nombre_demandes
FROM salary_advance_requests sar
JOIN partners p ON sar.partenaire_id = p.id
WHERE p.nom = 'YouCompany';

-- Afficher les détails
SELECT 
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