-- =====================================================
-- SCRIPT POUR CORRIGER LES MOTS DE PASSE YOUCOMPANY
-- =====================================================

-- Mise à jour du mot de passe pour le Directeur Général
UPDATE users 
SET encrypted_password = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
WHERE email = 'ousmane.sow@youcompany.com';

-- Mise à jour du mot de passe pour la Directrice RH
UPDATE users 
SET encrypted_password = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
WHERE email = 'aissatou.bah@youcompany.com';

-- Vérification des mots de passe
SELECT 
    email,
    nom || ' ' || prenom as nom_complet,
    poste,
    encrypted_password,
    CASE 
        WHEN encrypted_password = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' 
        THEN '✅ Mot de passe correct' 
        ELSE '❌ Mot de passe incorrect' 
    END as statut_mot_de_passe
FROM users 
WHERE organisation = 'YouCompany';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Mots de passe YouCompany mis à jour !';
    RAISE NOTICE 'Mot de passe pour les deux comptes: Samy2004@';
END $$; 