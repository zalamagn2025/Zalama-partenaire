-- =====================================================
-- SCRIPT COMPLET POUR SETUP salary_advance_requests
-- =====================================================

-- 1. Création de la table salary_advance_requests
CREATE TABLE IF NOT EXISTS salary_advance_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  partenaire_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  montant_demande DECIMAL(15,2) NOT NULL,
  type_motif VARCHAR(50) NOT NULL,
  motif TEXT NOT NULL,
  numero_reception VARCHAR(20),
  frais_service DECIMAL(15,2) DEFAULT 0,
  montant_total DECIMAL(15,2) NOT NULL,
  salaire_disponible DECIMAL(15,2),
  avance_disponible DECIMAL(15,2),
  statut VARCHAR(20) NOT NULL DEFAULT 'En attente',
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_validation TIMESTAMP WITH TIME ZONE,
  date_rejet TIMESTAMP WITH TIME ZONE,
  motif_rejet TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_salary_advance_requests_employe ON salary_advance_requests(employe_id);
CREATE INDEX IF NOT EXISTS idx_salary_advance_requests_partenaire ON salary_advance_requests(partenaire_id);
CREATE INDEX IF NOT EXISTS idx_salary_advance_requests_statut ON salary_advance_requests(statut);
CREATE INDEX IF NOT EXISTS idx_salary_advance_requests_date_creation ON salary_advance_requests(date_creation);

-- 3. Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer le trigger s'il existe déjà, puis le recréer
DROP TRIGGER IF EXISTS trigger_update_salary_advance_requests_updated_at ON salary_advance_requests;
CREATE TRIGGER trigger_update_salary_advance_requests_updated_at
  BEFORE UPDATE ON salary_advance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Insertion de données de test pour YouCompany
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

-- 5. Vérification des données insérées
SELECT 
    'Demandes d''avance YouCompany' as type,
    COUNT(*) as nombre_demandes
FROM salary_advance_requests sar
JOIN partners p ON sar.partenaire_id = p.id
WHERE p.nom = 'YouCompany';

-- 6. Statistiques par statut
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

-- 7. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Setup salary_advance_requests terminé avec succès !';
    RAISE NOTICE '5 demandes d''avance créées pour YouCompany';
    RAISE NOTICE 'Statuts: En attente (2), Validé (2), Rejeté (1)';
END $$; 