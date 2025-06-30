-- =====================================================
-- SCRIPT DE CORRECTION DE LA TABLE FINANCIAL_TRANSACTIONS
-- =====================================================

-- 1. Supprimer la table existante si elle existe
DROP TABLE IF EXISTS financial_transactions CASCADE;

-- 2. Recréer la table avec les bons types de données
CREATE TABLE financial_transactions (
    transaction_id BIGINT PRIMARY KEY,
    montant DECIMAL(10,2) NOT NULL,
    type VARCHAR(255) NOT NULL,
    description TEXT,
    partenaire_id UUID REFERENCES partners(id) ON DELETE CASCADE, -- Changé de BIGINT à UUID
    utilisateur_id UUID REFERENCES employees(id) ON DELETE CASCADE, -- Changé de BIGINT à UUID
    service_id BIGINT REFERENCES services(id) ON DELETE CASCADE,
    statut VARCHAR(255) NOT NULL DEFAULT 'En attente',
    date_transaction DATE NOT NULL,
    date_validation DATE,
    reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer la séquence pour l'auto-incrémentation
CREATE SEQUENCE IF NOT EXISTS financial_transactions_transaction_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- 4. Configurer l'auto-incrémentation
ALTER TABLE financial_transactions 
ALTER COLUMN transaction_id SET DEFAULT nextval('financial_transactions_transaction_id_seq');

ALTER SEQUENCE financial_transactions_transaction_id_seq OWNED BY financial_transactions.transaction_id;

-- 5. Créer les index
CREATE INDEX idx_financial_transactions_partenaire_id ON financial_transactions(partenaire_id);
CREATE INDEX idx_financial_transactions_utilisateur_id ON financial_transactions(utilisateur_id);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(date_transaction);
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX idx_financial_transactions_statut ON financial_transactions(statut);

-- 6. Créer le trigger pour updated_at
CREATE OR REPLACE TRIGGER trigger_update_financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Insérer des données de test pour le partenaire Innovatech SARL
DO $$
DECLARE
    partner_uuid UUID;
    employee_record RECORD;
    transaction_count INTEGER := 0;
BEGIN
    -- Récupérer l'ID du partenaire Innovatech SARL
    SELECT id INTO partner_uuid 
    FROM partners 
    WHERE nom = 'Innovatech SARL' 
    OR email_representant = 'fatou.camara@innovatech.com'
    LIMIT 1;
    
    IF partner_uuid IS NOT NULL THEN
        RAISE NOTICE 'Création des transactions pour le partenaire: %', partner_uuid;
        
        -- Créer des transactions pour chaque employé
        FOR employee_record IN 
            SELECT id, nom, prenom, poste 
            FROM employees 
            WHERE partner_id = partner_uuid AND actif = true
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
                    partner_uuid,
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
        
        RAISE NOTICE 'Créé % transactions pour le partenaire %', transaction_count, partner_uuid;
    ELSE
        RAISE NOTICE 'Partenaire Innovatech SARL non trouvé';
    END IF;
END $$;

-- 8. Vérifier les données créées
SELECT 
    'RÉSULTATS' as info,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT partenaire_id) as partenaires,
    COUNT(DISTINCT utilisateur_id) as employes,
    SUM(montant) as montant_total
FROM financial_transactions;

-- 9. Afficher un exemple de transaction avec employé
SELECT 
    'EXEMPLE TRANSACTION' as info,
    ft.transaction_id,
    ft.montant,
    ft.type,
    ft.description,
    ft.statut,
    e.prenom || ' ' || e.nom as employe,
    e.poste,
    p.nom as partenaire
FROM financial_transactions ft
LEFT JOIN employees e ON ft.utilisateur_id = e.id
LEFT JOIN partners p ON ft.partenaire_id = p.id
LIMIT 5; 