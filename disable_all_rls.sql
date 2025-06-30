-- =====================================================
-- SCRIPT POUR DÉSACTIVER RLS SUR TOUTES LES TABLES
-- =====================================================

-- Désactiver RLS sur toutes les tables
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE avis DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandes DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_avance_salaire DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_p2p DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_requests DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques RLS existantes
DROP POLICY IF EXISTS "Employees are viewable by everyone" ON employees;
DROP POLICY IF EXISTS "Users can insert employees" ON employees;
DROP POLICY IF EXISTS "Users can update employees" ON employees;
DROP POLICY IF EXISTS "Avis are viewable by everyone" ON avis;
DROP POLICY IF EXISTS "Users can create avis" ON avis;
DROP POLICY IF EXISTS "Users can update avis" ON avis;
DROP POLICY IF EXISTS "Demandes are viewable by everyone" ON demandes;
DROP POLICY IF EXISTS "Users can create demandes" ON demandes;
DROP POLICY IF EXISTS "Users can update demandes" ON demandes;
DROP POLICY IF EXISTS "Demandes avance are viewable by everyone" ON demandes_avance_salaire;
DROP POLICY IF EXISTS "Users can create demandes avance" ON demandes_avance_salaire;
DROP POLICY IF EXISTS "Users can update demandes avance" ON demandes_avance_salaire;
DROP POLICY IF EXISTS "Demandes p2p are viewable by everyone" ON demandes_p2p;
DROP POLICY IF EXISTS "Users can create demandes p2p" ON demandes_p2p;
DROP POLICY IF EXISTS "Users can update demandes p2p" ON demandes_p2p;
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;

-- Message de confirmation
SELECT 'RLS désactivé sur toutes les tables avec succès !' as message; 