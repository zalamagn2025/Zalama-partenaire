-- =====================================================
-- SCRIPT POUR AJOUTER LE PARTENAIRE TECHSOLUTIONS SARL
-- =====================================================

-- Création de l'utilisateur représentant TechSolutions (Mamadou Diallo)
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
    'mamadou.diallo@techsolutions.com',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', -- Samy2004@
    'Diallo',
    'Mamadou',
    'Entreprise',
    'Actif',
    'TechSolutions SARL',
    'Directeur Général',
    '+224 611 222 333',
    'Conakry, Guinée',
    NOW(),
    NOW(),
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Création de l'utilisateur RH TechSolutions (Fatou Camara)
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
    'fatou.camara@techsolutions.com',
    '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', -- Samy2004@
    'Camara',
    'Fatou',
    'Entreprise',
    'Actif',
    'TechSolutions SARL',
    'Directrice RH',
    '+224 622 333 444',
    'Conakry, Guinée',
    NOW(),
    NOW(),
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Création du partenaire TechSolutions SARL
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
    (SELECT id FROM users WHERE email = 'mamadou.diallo@techsolutions.com'),
    'TechSolutions SARL',
    'Entreprise',
    'Technologie',
    'Entreprise leader dans le développement de solutions technologiques innovantes',
    'Mamadou Diallo',
    'mamadou.diallo@techsolutions.com',
    '+224 611 222 333',
    'Directeur Général',
    'Fatou Camara',
    'fatou.camara@techsolutions.com',
    '+224 622 333 444',
    'mamadou.diallo@techsolutions.com',
    '+224 611 222 333',
    'Conakry, Guinée',
    NOW(),
    true,
    75,
    35000000,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VÉRIFICATION DE L'AJOUT
-- =====================================================
SELECT 
    'Utilisateurs TechSolutions' as type,
    u.email,
    u.nom || ' ' || u.prenom as nom_complet,
    u.poste,
    u.actif::text
FROM users u
WHERE u.organisation = 'TechSolutions SARL'

UNION ALL

SELECT 
    'Partenaire TechSolutions' as type,
    p.nom,
    p.nom_representant || ' (Représentant)' as nom_complet,
    p.email_representant,
    p.actif::text
FROM partners p
WHERE p.nom = 'TechSolutions SARL';

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Partenaire TechSolutions SARL ajouté avec succès !';
    RAISE NOTICE 'Représentant: Mamadou Diallo (mamadou.diallo@techsolutions.com)';
    RAISE NOTICE 'RH: Fatou Camara (fatou.camara@techsolutions.com)';
    RAISE NOTICE 'Mot de passe pour les deux comptes: Samy2004@';
END $$; 