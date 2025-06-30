-- =====================================================
-- SCRIPT POUR INSÉRER DES DONNÉES DE TEST DANS LES DEMANDES
-- =====================================================

-- D'abord, récupérer les IDs des employés et partenaires existants
DO $$
DECLARE
    employee_record RECORD;
    partner_record RECORD;
    employee_count INTEGER := 0;
    partner_count INTEGER := 0;
BEGIN
    -- Compter les employés et partenaires
    SELECT COUNT(*) INTO employee_count FROM employees;
    SELECT COUNT(*) INTO partner_count FROM partners;
    
    RAISE NOTICE 'Employés trouvés: %, Partenaires trouvés: %', employee_count, partner_count;
    
    -- Insérer des demandes d'avance sur salaire pour chaque employé
    FOR employee_record IN SELECT id, partner_id FROM employees LIMIT 5 LOOP
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
        ) VALUES (
            employee_record.id,
            employee_record.partner_id,
            CASE 
                WHEN random() > 0.5 THEN 250000
                ELSE 350000
            END,
            CASE 
                WHEN random() > 0.7 THEN 'Urgences familiales'
                WHEN random() > 0.5 THEN 'Achat d''équipement'
                ELSE 'Formation professionnelle'
            END,
            NOW(),
            (NOW() + INTERVAL '30 days')::date,
            CASE 
                WHEN random() > 0.7 THEN 'Approuvée'
                WHEN random() > 0.5 THEN 'En cours'
                ELSE 'En attente'
            END,
            CASE 
                WHEN random() > 0.8 THEN 3
                WHEN random() > 0.5 THEN 2
                ELSE 1
            END,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Demande d''avance créée pour employé: %', employee_record.id;
    END LOOP;
    
    -- Insérer des demandes P2P pour chaque employé
    FOR employee_record IN SELECT id, partner_id FROM employees LIMIT 5 LOOP
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
        ) VALUES (
            employee_record.id,
            employee_record.partner_id,
            CASE 
                WHEN random() > 0.5 THEN 1500000
                ELSE 2000000
            END,
            CASE 
                WHEN random() > 0.5 THEN 12
                ELSE 18
            END,
            CASE 
                WHEN random() > 0.7 THEN 'Développement de projet personnel'
                WHEN random() > 0.5 THEN 'Formation professionnelle'
                ELSE 'Achat d''équipement informatique'
            END,
            CASE 
                WHEN random() > 0.5 THEN 0.08
                ELSE 0.12
            END,
            NOW(),
            (NOW() + INTERVAL '60 days')::date,
            CASE 
                WHEN random() > 0.7 THEN 'Approuvée'
                WHEN random() > 0.5 THEN 'En cours'
                ELSE 'En attente'
            END,
            CASE 
                WHEN random() > 0.8 THEN 3
                WHEN random() > 0.5 THEN 2
                ELSE 1
            END,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Demande P2P créée pour employé: %', employee_record.id;
    END LOOP;
    
    RAISE NOTICE 'Données de test insérées avec succès !';
END $$;

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
LIMIT 3; 