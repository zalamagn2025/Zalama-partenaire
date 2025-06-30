-- =====================================================
-- SCRIPT POUR AJOUTER LE PARTENAIRE ZALAMA
-- =====================================================

-- Création de l'utilisateur représentant Zalama (Karfalla Diaby)
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
    'zalamagn@gmail.com',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', -- Samy2004@
    'Diaby',
    'Karfalla',
    'Entreprise',
    'Actif',
    'Zalama',
    'Représentant',
    '+224 123 456 789',
    'Conakry, Guinée',
    NOW(),
    NOW(),
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Création de l'utilisateur RH Zalama (Karfalla Diaby)
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
    'diabykarfalla2@gmail.com',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', -- Samy2004@
    'Diaby',
    'Karfalla',
    'Entreprise',
    'Actif',
    'Zalama',
    'Responsable RH',
    '+224 987 654 321',
    'Conakry, Guinée',
    NOW(),
    NOW(),
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Création du partenaire Zalama
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
    (SELECT id FROM users WHERE email = 'zalamagn@gmail.com'),
    'Zalama',
    'Entreprise',
    'Technologie',
    'Partenaire technologique innovant spécialisé dans les solutions digitales',
    'Karfalla Diaby',
    'zalamagn@gmail.com',
    '+224 123 456 789',
    'Représentant',
    'Karfalla Diaby',
    'diabykarfalla2@gmail.com',
    '+224 987 654 321',
    'zalamagn@gmail.com',
    '+224 123 456 789',
    'Conakry, Guinée',
    NOW(),
    true,
    50,
    25000000,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VÉRIFICATION DE L'AJOUT
-- =====================================================
SELECT 
    'Utilisateurs Zalama' as type,
    u.email,
    u.nom || ' ' || u.prenom as nom_complet,
    u.poste,
    u.actif::text
FROM users u
WHERE u.organisation = 'Zalama'

UNION ALL

SELECT 
    'Partenaire Zalama' as type,
    p.nom,
    p.nom_representant || ' (Représentant)' as nom_complet,
    p.email_representant,
    p.actif::text
FROM partners p
WHERE p.nom = 'Zalama';

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Partenaire Zalama ajouté avec succès !';
    RAISE NOTICE 'Représentant: Karfalla Diaby (zalamagn@gmail.com)';
    RAISE NOTICE 'RH: Karfalla Diaby (diabykarfalla2@gmail.com)';
    RAISE NOTICE 'Mot de passe pour les deux comptes: Samy2004@';
END $$; 