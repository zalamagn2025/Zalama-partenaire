-- =====================================================
-- SCRIPT POUR CORRIGER LES MOTS DE PASSE YOUCOMPANY
-- Hash correct pour Samy2004@ : dd5054a82fca370618bdc3979e3c6fc13132cbc49f95dc0bc9a930b0e27cd9be
-- =====================================================

-- Mise à jour du mot de passe pour le Directeur Général
UPDATE users 
SET encrypted_password = 'dd5054a82fca370618bdc3979e3c6fc13132cbc49f95dc0bc9a930b0e27cd9be'
WHERE email = 'ousmane.sow@youcompany.com';

-- Mise à jour du mot de passe pour la Directrice RH
UPDATE users 
SET encrypted_password = 'dd5054a82fca370618bdc3979e3c6fc13132cbc49f95dc0bc9a930b0e27cd9be'
WHERE email = 'aissatou.bah@youcompany.com';

-- Vérification des mots de passe
SELECT 
    email,
    nom || ' ' || prenom as nom_complet,
    poste,
    encrypted_password,
    CASE 
        WHEN encrypted_password = 'dd5054a82fca370618bdc3979e3c6fc13132cbc49f95dc0bc9a930b0e27cd9be' 
        THEN '✅ Mot de passe correct' 
        ELSE '❌ Mot de passe incorrect' 
    END as statut_mot_de_passe
FROM users 
WHERE organisation = 'YouCompany';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Mots de passe YouCompany corrigés avec le bon hash !';
    RAISE NOTICE 'Mot de passe pour les deux comptes: Samy2004@';
    RAISE NOTICE 'Hash correct: dd5054a82fca370618bdc3979e3c6fc13132cbc49f95dc0bc9a930b0e27cd9be';
END $$; 