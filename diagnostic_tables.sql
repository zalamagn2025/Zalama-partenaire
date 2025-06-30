-- =====================================================
-- SCRIPT DE DIAGNOSTIC - VÉRIFICATION DES DONNÉES
-- =====================================================

-- 1. Vérifier les partenaires
SELECT 'PARTENAIRES' as table_name, COUNT(*) as count FROM partners;

-- 2. Vérifier les employés
SELECT 'EMPLOYÉS' as table_name, COUNT(*) as count FROM employees;

-- 3. Vérifier les demandes d'avance sur salaire
SELECT 'DEMANDES AVANCE' as table_name, COUNT(*) as count FROM demandes_avance_salaire;

-- 4. Vérifier les demandes P2P
SELECT 'DEMANDES P2P' as table_name, COUNT(*) as count FROM demandes_p2p;

-- 5. Vérifier les avis
SELECT 'AVIS' as table_name, COUNT(*) as count FROM avis;

-- 6. Vérifier les messages
SELECT 'MESSAGES' as table_name, COUNT(*) as count FROM messages;

-- 7. Détails des employés avec leur partenaire
SELECT 
  e.id as employee_id,
  e.nom,
  e.prenom,
  e.partner_id,
  p.nom as partner_nom
FROM employees e
LEFT JOIN partners p ON e.partner_id = p.id
LIMIT 10;

-- 8. Détails des demandes d'avance (si elles existent)
SELECT 
  id,
  employee_id,
  partner_id,
  montant,
  statut,
  date_demande
FROM demandes_avance_salaire
LIMIT 10;

-- 9. Détails des demandes P2P (si elles existent)
SELECT 
  id,
  employee_id,
  partner_id,
  montant,
  statut,
  date_demande
FROM demandes_p2p
LIMIT 10;

-- 10. Vérifier si les tables existent
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('partners', 'employees', 'demandes_avance_salaire', 'demandes_p2p', 'avis', 'messages')
ORDER BY table_name;

-- 11. Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('partners', 'employees', 'demandes_avance_salaire', 'demandes_p2p', 'avis', 'messages')
ORDER BY tablename, policyname; 