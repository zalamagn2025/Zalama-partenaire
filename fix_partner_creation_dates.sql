-- Script pour corriger les dates de création des partenaires
-- Ce script met à jour les dates de création pour qu'elles correspondent à l'année actuelle (2025)

-- Voir les partenaires actuels avec leurs dates de création
SELECT 
    id,
    company_name,
    created_at,
    EXTRACT(YEAR FROM created_at) as creation_year,
    status
FROM partners 
ORDER BY created_at DESC;

-- Mettre à jour les dates de création pour l'année 2025
-- (Uncomment les lignes suivantes si vous voulez corriger les dates)

/*
UPDATE partners 
SET 
    created_at = created_at + INTERVAL '1 year',
    updated_at = NOW()
WHERE EXTRACT(YEAR FROM created_at) = 2024;

-- Vérifier les changements
SELECT 
    id,
    company_name,
    created_at,
    EXTRACT(YEAR FROM created_at) as creation_year,
    status
FROM partners 
ORDER BY created_at DESC;
*/

-- Alternative: Mettre à jour avec une date spécifique en 2025
/*
UPDATE partners 
SET 
    created_at = '2025-01-15 10:00:00+00',
    updated_at = NOW()
WHERE company_name IN ('ZaLaMa', 'TechSolutions', 'YouCompany', 'Zalama');

-- Vérifier les changements
SELECT 
    id,
    company_name,
    created_at,
    EXTRACT(YEAR FROM created_at) as creation_year,
    status
FROM partners 
WHERE company_name IN ('ZaLaMa', 'TechSolutions', 'YouCompany', 'Zalama')
ORDER BY created_at DESC;
*/
