-- =====================================================
-- SCRIPT DE DONNÉES DE TEST ZALAMA - CORRIGÉ
-- =====================================================

-- Création de la séquence pour financial_transactions
CREATE SEQUENCE IF NOT EXISTS financial_transactions_transaction_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Modification de la table financial_transactions pour utiliser la séquence
ALTER TABLE financial_transactions 
ALTER COLUMN transaction_id SET DEFAULT nextval('financial_transactions_transaction_id_seq');

-- Attribution de la séquence à la colonne
ALTER SEQUENCE financial_transactions_transaction_id_seq OWNED BY financial_transactions.transaction_id;

-- =====================================================
-- FONCTION POUR CRÉER DES DONNÉES DE TEST RÉALISTES
-- =====================================================
CREATE OR REPLACE FUNCTION create_test_data_for_partner(partner_id UUID)
RETURNS VOID AS $$
DECLARE
    employee_record RECORD;
    transaction_count INTEGER := 0;
    avis_count INTEGER := 0;
BEGIN
    -- Créer des employés pour ce partenaire
    INSERT INTO employees (
        partner_id, nom, prenom, genre, email, telephone, adresse, 
        poste, role, type_contrat, salaire_net, date_embauche, actif
    )
    VALUES
        (partner_id, 'Diallo', 'Mamadou', 'Homme', 'mamadou.diallo@innovatech.com', '+224777888999', 'Conakry, Guinée', 'Développeur Senior', 'Développement', 'CDI', 850000, '2023-01-15', true),
        (partner_id, 'Bah', 'Aissatou', 'Femme', 'aissatou.bah@innovatech.com', '+224666777888', 'Conakry, Guinée', 'Chef de Projet', 'Management', 'CDI', 950000, '2023-03-20', true),
        (partner_id, 'Sow', 'Ousmane', 'Homme', 'ousmane.sow@innovatech.com', '+224555666777', 'Conakry, Guinée', 'Analyste Business', 'Analyse', 'CDI', 750000, '2023-06-10', true),
        (partner_id, 'Camara', 'Fatou', 'Femme', 'fatou.camara@innovatech.com', '+224444555666', 'Conakry, Guinée', 'Designer UX/UI', 'Design', 'CDI', 700000, '2023-08-05', true),
        (partner_id, 'Keita', 'Ibrahim', 'Homme', 'ibrahim.keita@innovatech.com', '+224333444555', 'Conakry, Guinée', 'DevOps Engineer', 'Infrastructure', 'CDI', 900000, '2023-11-12', true)
    ON CONFLICT DO NOTHING;

    -- Créer des transactions financières pour chaque employé
    FOR employee_record IN 
        SELECT id, nom, prenom, poste 
        FROM employees 
        WHERE partner_id = partner_id AND actif = true
    LOOP
        -- Créer 2-3 transactions par employé
        FOR i IN 1..(2 + floor(random() * 2)::integer) LOOP
            INSERT INTO financial_transactions (
                montant,
                type,
                description,
                partenaire_id,
                utilisateur_id,
                service_id,
                statut,
                date_transaction,
                date_validation,
                reference,
                created_at,
                updated_at
            )
            VALUES (
                CASE 
                    WHEN random() > 0.7 THEN 500000
                    WHEN random() > 0.5 THEN 300000
                    ELSE 200000
                END,
                CASE 
                    WHEN random() > 0.7 THEN 'Débloqué'
                    WHEN random() > 0.5 THEN 'Récupéré'
                    WHEN random() > 0.3 THEN 'Revenu'
                    ELSE 'Remboursement'
                END,
                CASE 
                    WHEN random() > 0.7 THEN 'Avance sur salaire - ' || employee_record.nom || ' ' || employee_record.prenom
                    WHEN random() > 0.5 THEN 'Paiement de salaire - ' || employee_record.poste
                    WHEN random() > 0.3 THEN 'Commission de vente - ' || employee_record.nom
                    ELSE 'Remboursement de frais - ' || employee_record.prenom
                END,
                partner_id,
                employee_record.id,
                NULL,
                CASE 
                    WHEN random() > 0.7 THEN 'Validé'
                    WHEN random() > 0.5 THEN 'En attente'
                    ELSE 'Rejeté'
                END,
                NOW() - (random() * interval '30 days'),
                CASE 
                    WHEN random() > 0.7 THEN NOW() - (random() * interval '25 days')
                    ELSE NULL
                END,
                'REF-' || floor(random() * 10000)::text,
                NOW(),
                NOW()
            );
            transaction_count := transaction_count + 1;
        END LOOP;
    END LOOP;

    -- Créer des avis pour ce partenaire
    FOR i IN 1..(3 + floor(random() * 3)::integer) LOOP
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
            u.id,
            partner_id,
            CASE 
                WHEN random() > 0.8 THEN 5
                WHEN random() > 0.6 THEN 4
                WHEN random() > 0.4 THEN 3
                ELSE 2
            END,
            CASE 
                WHEN random() > 0.7 THEN 'Excellent service, équipe très professionnelle !'
                WHEN random() > 0.5 THEN 'Très satisfait du partenariat avec ' || (SELECT nom FROM partners WHERE id = partner_id)
                WHEN random() > 0.3 THEN 'Bon service, je recommande.'
                ELSE 'Service correct, quelques améliorations possibles.'
            END,
            NOW() - (random() * interval '60 days'),
            CASE WHEN random() > 0.3 THEN true ELSE false END,
            NOW(),
            NOW()
        FROM users u
        WHERE u.type IN ('Salarié', 'Entreprise')
        AND u.id NOT IN (SELECT user_id FROM avis WHERE partner_id = partner_id)
        LIMIT 1;
        
        avis_count := avis_count + 1;
    END LOOP;

    RAISE NOTICE 'Données créées pour le partenaire %: % employés, % transactions, % avis', 
        partner_id, 
        (SELECT COUNT(*) FROM employees WHERE partner_id = partner_id AND actif = true),
        transaction_count,
        avis_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXÉCUTION POUR LE PARTENAIRE CONNECTÉ
-- =====================================================
-- Récupérer l'ID du partenaire connecté (Innovatech SARL)
DO $$
DECLARE
    partner_uuid UUID;
BEGIN
    -- Récupérer l'ID du partenaire Innovatech SARL
    SELECT id INTO partner_uuid 
    FROM partners 
    WHERE nom = 'Innovatech SARL' 
    OR email_representant = 'fatou.camara@innovatech.com'
    LIMIT 1;
    
    IF partner_uuid IS NOT NULL THEN
        -- Créer les données de test pour ce partenaire
        PERFORM create_test_data_for_partner(partner_uuid);
        RAISE NOTICE 'Données de test créées avec succès pour le partenaire %', partner_uuid;
    ELSE
        RAISE NOTICE 'Partenaire Innovatech SARL non trouvé. Vérifiez que le partenaire existe.';
    END IF;
END $$;

-- =====================================================
-- VÉRIFICATION DES DONNÉES CRÉÉES
-- =====================================================
SELECT 
    'Partenaire' as type,
    p.nom,
    p.email_representant,
    p.actif
FROM partners p
WHERE p.nom = 'Innovatech SARL' OR p.email_representant = 'fatou.camara@innovatech.com'

UNION ALL

SELECT 
    'Employés' as type,
    e.nom || ' ' || e.prenom as nom,
    e.poste,
    e.actif::text
FROM employees e
JOIN partners p ON e.partner_id = p.id
WHERE p.nom = 'Innovatech SARL' OR p.email_representant = 'fatou.camara@innovatech.com'

UNION ALL

SELECT 
    'Transactions' as type,
    ft.description,
    ft.montant::text,
    ft.statut
FROM financial_transactions ft
JOIN partners p ON ft.partenaire_id = p.id
WHERE p.nom = 'Innovatech SARL' OR p.email_representant = 'fatou.camara@innovatech.com'
LIMIT 5

UNION ALL

SELECT 
    'Avis' as type,
    a.commentaire,
    a.note::text,
    a.approuve::text
FROM avis a
JOIN partners p ON a.partner_id = p.id
WHERE p.nom = 'Innovatech SARL' OR p.email_representant = 'fatou.camara@innovatech.com'
LIMIT 3; 