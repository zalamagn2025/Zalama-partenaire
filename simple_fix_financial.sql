-- =====================================================
-- SCRIPT SIMPLE POUR CORRIGER FINANCIAL_TRANSACTIONS
-- =====================================================

-- 1. Supprimer la table existante
DROP TABLE IF EXISTS financial_transactions CASCADE;

-- 2. Recréer la table avec les bons types
CREATE TABLE financial_transactions (
    transaction_id BIGINT PRIMARY KEY,
    montant DECIMAL(10,2) NOT NULL,
    type VARCHAR(255) NOT NULL,
    description TEXT,
    partenaire_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    utilisateur_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    service_id BIGINT REFERENCES services(id) ON DELETE CASCADE,
    statut VARCHAR(255) NOT NULL DEFAULT 'En attente',
    date_transaction DATE NOT NULL,
    date_validation DATE,
    reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer la séquence
CREATE SEQUENCE financial_transactions_transaction_id_seq
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

-- 6. Insérer des données de test pour Innovatech SARL
INSERT INTO financial_transactions (
    montant, type, description, partenaire_id, utilisateur_id, statut, date_transaction, reference
)
SELECT 
    500000 as montant,
    'Débloqué' as type,
    'Avance sur salaire - ' || e.prenom || ' ' || e.nom as description,
    p.id as partenaire_id,
    e.id as utilisateur_id,
    'Validé' as statut,
    CURRENT_DATE - (random() * 30)::integer as date_transaction,
    'REF-' || floor(random() * 10000)::text as reference
FROM partners p
CROSS JOIN employees e
WHERE p.email_representant = 'fatou.camara@innovatech.com'
AND e.partner_id = p.id
AND e.actif = true
LIMIT 10;

-- 7. Insérer plus de transactions variées
INSERT INTO financial_transactions (
    montant, type, description, partenaire_id, utilisateur_id, statut, date_transaction, reference
)
SELECT 
    CASE 
        WHEN random() > 0.7 THEN 300000
        WHEN random() > 0.5 THEN 200000
        ELSE 150000
    END as montant,
    CASE 
        WHEN random() > 0.7 THEN 'Récupéré'
        WHEN random() > 0.5 THEN 'Revenu'
        ELSE 'Remboursement'
    END as type,
    CASE 
        WHEN random() > 0.7 THEN 'Paiement de salaire - ' || e.poste
        WHEN random() > 0.5 THEN 'Commission de vente - ' || e.nom
        ELSE 'Remboursement de frais - ' || e.prenom
    END as description,
    p.id as partenaire_id,
    e.id as utilisateur_id,
    CASE 
        WHEN random() > 0.7 THEN 'Validé'
        WHEN random() > 0.5 THEN 'En attente'
        ELSE 'Rejeté'
    END as statut,
    CURRENT_DATE - (random() * 60)::integer as date_transaction,
    'REF-' || floor(random() * 10000)::text as reference
FROM partners p
CROSS JOIN employees e
WHERE p.email_representant = 'fatou.camara@innovatech.com'
AND e.partner_id = p.id
AND e.actif = true
LIMIT 15;

-- 8. Vérifier les données créées
SELECT 
    'RÉSULTATS' as info,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT partenaire_id) as partenaires,
    COUNT(DISTINCT utilisateur_id) as employes,
    SUM(montant) as montant_total
FROM financial_transactions;

-- 9. Afficher un exemple
SELECT 
    'EXEMPLE' as info,
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