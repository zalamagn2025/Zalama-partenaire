-- =====================================================
-- SCRIPT POUR CRÉER LES TABLES MANQUANTES DANS SUPABASE
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- =====================================================

-- Créer la table employees si elle n'existe pas
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  genre VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  telephone VARCHAR(20),
  adresse TEXT,
  poste VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  type_contrat VARCHAR(20) NOT NULL,
  salaire_net DECIMAL(10,2),
  date_embauche DATE,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table avis si elle n'existe pas
CREATE TABLE IF NOT EXISTS avis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  note INTEGER CHECK (note >= 1 AND note <= 5) NOT NULL,
  commentaire TEXT,
  date_avis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approuve BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table demandes si elle n'existe pas
CREATE TABLE IF NOT EXISTS demandes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  service_id BIGINT,
  type_demande VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  statut VARCHAR(50) DEFAULT 'En attente',
  priorite INTEGER DEFAULT 1,
  date_demande TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_traitement TIMESTAMP WITH TIME ZONE,
  commentaire_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table demandes_avance_salaire si elle n'existe pas
CREATE TABLE IF NOT EXISTS demandes_avance_salaire (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  montant DECIMAL(10,2) NOT NULL,
  motif TEXT NOT NULL,
  date_demande TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_remboursement DATE,
  statut VARCHAR(50) DEFAULT 'En attente',
  priorite INTEGER DEFAULT 1,
  commentaire_admin TEXT,
  approuve_par UUID REFERENCES users(id),
  date_approbation TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table demandes_p2p si elle n'existe pas
CREATE TABLE IF NOT EXISTS demandes_p2p (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  montant DECIMAL(10,2) NOT NULL,
  duree_mois INTEGER NOT NULL,
  motif TEXT NOT NULL,
  taux_interet DECIMAL(5,2) DEFAULT 0.00,
  date_demande TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_debut_remboursement DATE,
  statut VARCHAR(50) DEFAULT 'En attente',
  priorite INTEGER DEFAULT 1,
  commentaire_admin TEXT,
  approuve_par UUID REFERENCES users(id),
  date_approbation TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table messages si elle n'existe pas
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expediteur_id UUID REFERENCES users(id) ON DELETE CASCADE,
  destinataire_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sujet VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT false,
  important BOOLEAN DEFAULT false,
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_lecture TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_employees_partner_id ON employees(partner_id);
CREATE INDEX IF NOT EXISTS idx_employees_actif ON employees(actif);

CREATE INDEX IF NOT EXISTS idx_avis_user_id ON avis(user_id);
CREATE INDEX IF NOT EXISTS idx_avis_partner_id ON avis(partner_id);
CREATE INDEX IF NOT EXISTS idx_avis_note ON avis(note);
CREATE INDEX IF NOT EXISTS idx_avis_date_avis ON avis(date_avis);

CREATE INDEX IF NOT EXISTS idx_demandes_user_id ON demandes(user_id);
CREATE INDEX IF NOT EXISTS idx_demandes_partner_id ON demandes(partner_id);
CREATE INDEX IF NOT EXISTS idx_demandes_service_id ON demandes(service_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_date_demande ON demandes(date_demande);

CREATE INDEX IF NOT EXISTS idx_demandes_avance_employee_id ON demandes_avance_salaire(employee_id);
CREATE INDEX IF NOT EXISTS idx_demandes_avance_partner_id ON demandes_avance_salaire(partner_id);
CREATE INDEX IF NOT EXISTS idx_demandes_avance_statut ON demandes_avance_salaire(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_avance_date_demande ON demandes_avance_salaire(date_demande);

CREATE INDEX IF NOT EXISTS idx_demandes_p2p_employee_id ON demandes_p2p(employee_id);
CREATE INDEX IF NOT EXISTS idx_demandes_p2p_partner_id ON demandes_p2p(partner_id);
CREATE INDEX IF NOT EXISTS idx_demandes_p2p_statut ON demandes_p2p(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_p2p_date_demande ON demandes_p2p(date_demande);

CREATE INDEX IF NOT EXISTS idx_messages_expediteur_id ON messages(expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire_id ON messages(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_messages_lu ON messages(lu);
CREATE INDEX IF NOT EXISTS idx_messages_date_envoi ON messages(date_envoi);

-- Activer RLS (Row Level Security) sur les nouvelles tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_avance_salaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes_p2p ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Employees are viewable by their partner" ON employees;
DROP POLICY IF EXISTS "Users can insert employees" ON employees;
DROP POLICY IF EXISTS "Avis are viewable by everyone" ON avis;
DROP POLICY IF EXISTS "Users can view their own demandes" ON demandes;
DROP POLICY IF EXISTS "Users can create demandes" ON demandes;
DROP POLICY IF EXISTS "Users can view their own demandes avance" ON demandes_avance_salaire;
DROP POLICY IF EXISTS "Users can create demandes avance" ON demandes_avance_salaire;
DROP POLICY IF EXISTS "Users can view their own demandes p2p" ON demandes_p2p;
DROP POLICY IF EXISTS "Users can create demandes p2p" ON demandes_p2p;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Créer les nouvelles politiques plus permissives pour le développement
CREATE POLICY "Employees are viewable by everyone" ON employees
  FOR SELECT USING (true);

CREATE POLICY "Users can insert employees" ON employees
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update employees" ON employees
  FOR UPDATE USING (true);

CREATE POLICY "Avis are viewable by everyone" ON avis
  FOR SELECT USING (true);

CREATE POLICY "Users can create avis" ON avis
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update avis" ON avis
  FOR UPDATE USING (true);

CREATE POLICY "Demandes are viewable by everyone" ON demandes
  FOR SELECT USING (true);

CREATE POLICY "Users can create demandes" ON demandes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update demandes" ON demandes
  FOR UPDATE USING (true);

CREATE POLICY "Demandes avance are viewable by everyone" ON demandes_avance_salaire
  FOR SELECT USING (true);

CREATE POLICY "Users can create demandes avance" ON demandes_avance_salaire
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update demandes avance" ON demandes_avance_salaire
  FOR UPDATE USING (true);

CREATE POLICY "Demandes p2p are viewable by everyone" ON demandes_p2p
  FOR SELECT USING (true);

CREATE POLICY "Users can create demandes p2p" ON demandes_p2p
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update demandes p2p" ON demandes_p2p
  FOR UPDATE USING (true);

CREATE POLICY "Messages are viewable by everyone" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update messages" ON messages
  FOR UPDATE USING (true);

-- Message de confirmation
SELECT 'Politiques RLS corrigées avec succès !' as message; 