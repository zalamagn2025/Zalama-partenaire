-- =====================================================
-- SCRIPT POUR AJOUTER LE PARTENAIRE YOUCOMPANY
-- =====================================================

-- Création de l'utilisateur représentant YouCompany (Ousmane Sow)
INSERT INTO users (
    id,
    email,
    encrypted_password,
    nom,
    prenom,
    type,
    statut,
    organisation,
    poste,
    telephone,
    adresse,
    date_inscription,
    derniere_connexion,
    actif,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'ousmane.sow@youcompany.com',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', -- Samy2004@
    'Sow',
    'Ousmane',
    'Entreprise',
    'Actif',
    'YouCompany',
    'Directeur Général',
    '+224 633 444 555',
    'Conakry, Guinée',
    NOW(),
    NOW(),
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Création de l'utilisateur RH YouCompany (Aissatou Bah)
INSERT INTO users (
    id,
    email,
    encrypted_password,
    nom,
    prenom,
    type,
    statut,
    organisation,
    poste,
    telephone,
    adresse,
    date_inscription,
    derniere_connexion,
    actif,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'aissatou.bah@youcompany.com',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', -- Samy2004@
    'Bah',
    'Aissatou',
    'Entreprise',
    'Actif',
    'YouCompany',
    'Directrice RH',
    '+224 644 555 666',
    'Conakry, Guinée',
    NOW(),
    NOW(),
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Création du partenaire YouCompany
INSERT INTO partners (
    id,
    nom,
    type,
    secteur,
    description,
    nom_representant,
    email_representant,
    telephone_representant,
    poste_representant,
    nom_rh,
    email_rh,
    telephone_rh,
    email,
    telephone,
    adresse,
    date_adhesion,
    actif,
    nombre_employes,
    salaire_net_total,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'),
    'YouCompany',
    'Entreprise',
    'Technologie',
    'Entreprise innovante spécialisée dans les solutions digitales et le développement logiciel',
    'Ousmane Sow',
    'ousmane.sow@youcompany.com',
    '+224 633 444 555',
    'Directeur Général',
    'Aissatou Bah',
    'aissatou.bah@youcompany.com',
    '+224 644 555 666',
    'ousmane.sow@youcompany.com',
    '+224 633 444 555',
    'Conakry, Guinée',
    NOW(),
    true,
    60,
    30000000,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Création d'employés pour YouCompany
INSERT INTO employees (
    partner_id,
    nom,
    prenom,
    genre,
    email,
    telephone,
    adresse,
    poste,
    role,
    type_contrat,
    salaire_net,
    date_embauche,
    actif,
    created_at,
    updated_at
) VALUES 
    ((SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), 'Keita', 'Ibrahim', 'Homme', 'ibrahim.keita@youcompany.com', '+224 655 666 777', 'Conakry, Guinée', 'Développeur Senior', 'Développement', 'CDI', 850000, '2023-01-15', true, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), 'Diallo', 'Mariama', 'Femme', 'mariama.diallo@youcompany.com', '+224 666 777 888', 'Conakry, Guinée', 'Chef de Projet', 'Management', 'CDI', 950000, '2023-03-20', true, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), 'Camara', 'Sekou', 'Homme', 'sekou.camara@youcompany.com', '+224 677 888 999', 'Conakry, Guinée', 'Analyste Business', 'Analyse', 'CDI', 750000, '2023-06-10', true, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), 'Sow', 'Fatoumata', 'Femme', 'fatoumata.sow@youcompany.com', '+224 688 999 000', 'Conakry, Guinée', 'Designer UX/UI', 'Design', 'CDI', 700000, '2023-08-05', true, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), 'Bah', 'Mamadou', 'Homme', 'mamadou.bah@youcompany.com', '+224 699 000 111', 'Conakry, Guinée', 'DevOps Engineer', 'Infrastructure', 'CDI', 900000, '2023-11-12', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Création de demandes d'avance de salaire pour YouCompany
INSERT INTO demandes_avance_salaire (
    employe_id,
    montant_demande,
    motif,
    date_demande,
    statut,
    commentaire,
    date_traitement,
    numero_reception,
    created_at,
    updated_at
) VALUES 
    ((SELECT id FROM employees WHERE email = 'ibrahim.keita@youcompany.com'), 300000, 'Frais médicaux urgents', NOW() - INTERVAL '5 days', 'EN_ATTENTE', NULL, NULL, 'REF-001', NOW(), NOW()),
    ((SELECT id FROM employees WHERE email = 'mariama.diallo@youcompany.com'), 500000, 'Achat équipement informatique', NOW() - INTERVAL '3 days', 'APPROUVEE', 'Demande approuvée', NOW() - INTERVAL '2 days', 'REF-002', NOW(), NOW()),
    ((SELECT id FROM employees WHERE email = 'sekou.camara@youcompany.com'), 200000, 'Frais de transport', NOW() - INTERVAL '1 day', 'EN_ATTENTE', NULL, NULL, 'REF-003', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Création d'avis pour YouCompany
INSERT INTO avis (
    user_id,
    partner_id,
    note,
    commentaire,
    type_retour,
    date_avis,
    approuve,
    created_at,
    updated_at
) VALUES 
    ((SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), 5, 'Excellent service, équipe très professionnelle !', 'positif', NOW() - INTERVAL '10 days', true, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'aissatou.bah@youcompany.com'), (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), 4, 'Très satisfait du partenariat avec YouCompany', 'positif', NOW() - INTERVAL '7 days', true, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), 4, 'Bon service, je recommande.', 'positif', NOW() - INTERVAL '5 days', false, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Création de transactions financières pour YouCompany
INSERT INTO financial_transactions (
    transaction_id,
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
) VALUES 
    (nextval('financial_transactions_transaction_id_seq'), 500000, 'Débloqué', 'Avance sur salaire - Ibrahim Keita', (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), (SELECT id FROM employees WHERE email = 'ibrahim.keita@youcompany.com'), NULL, 'Validé', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'REF-001', NOW(), NOW()),
    (nextval('financial_transactions_transaction_id_seq'), 300000, 'Récupéré', 'Remboursement frais médicaux', (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), (SELECT id FROM employees WHERE email = 'ibrahim.keita@youcompany.com'), NULL, 'Validé', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 'REF-002', NOW(), NOW()),
    (nextval('financial_transactions_transaction_id_seq'), 200000, 'Revenu', 'Commission de vente - Mariama Diallo', (SELECT id FROM users WHERE email = 'ousmane.sow@youcompany.com'), (SELECT id FROM employees WHERE email = 'mariama.diallo@youcompany.com'), NULL, 'Validé', NOW() - INTERVAL '1 day', NOW(), 'REF-003', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- VÉRIFICATION DE L'AJOUT
-- =====================================================
SELECT 
    'Utilisateurs YouCompany' as type,
    u.email,
    u.nom || ' ' || u.prenom as nom_complet,
    u.poste,
    u.actif::text
FROM users u
WHERE u.organisation = 'YouCompany'

UNION ALL

SELECT 
    'Partenaire YouCompany' as type,
    p.nom,
    p.nom_representant || ' (Représentant)' as nom_complet,
    p.email_representant,
    p.actif::text
FROM partners p
WHERE p.nom = 'YouCompany'

UNION ALL

SELECT 
    'Employés YouCompany' as type,
    e.email,
    e.nom || ' ' || e.prenom as nom_complet,
    e.poste,
    e.actif::text
FROM employees e
JOIN partners p ON e.partner_id = p.id
WHERE p.nom = 'YouCompany'

UNION ALL

SELECT 
    'Demandes Avance' as type,
    'Demande ' || das.id as email,
    e.nom || ' ' || e.prenom as nom_complet,
    das.statut,
    das.montant_demande::text
FROM demandes_avance_salaire das
JOIN employees e ON das.employe_id = e.id
JOIN partners p ON e.partner_id = p.id
WHERE p.nom = 'YouCompany';

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Partenaire YouCompany ajouté avec succès !';
    RAISE NOTICE 'Représentant: Ousmane Sow (ousmane.sow@youcompany.com)';
    RAISE NOTICE 'RH: Aissatou Bah (aissatou.bah@youcompany.com)';
    RAISE NOTICE 'Mot de passe pour les deux comptes: Samy2004@';
    RAISE NOTICE '5 employés créés avec demandes d''avance et transactions financières';
END $$; 