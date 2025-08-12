-- Script de nettoyage des OTP expirés
-- À exécuter régulièrement (par exemple via un cron job)

-- Supprimer tous les OTP expirés
DELETE FROM otp_sessions 
WHERE expires_at < NOW();

-- Supprimer les OTP utilisés depuis plus de 24h
DELETE FROM otp_sessions 
WHERE used = true 
AND used_at < NOW() - INTERVAL '24 hours';

-- Statistiques après nettoyage
SELECT 
    COUNT(*) as total_otp_sessions,
    COUNT(CASE WHEN used = true THEN 1 END) as used_sessions,
    COUNT(CASE WHEN used = false THEN 1 END) as unused_sessions,
    COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_sessions
FROM otp_sessions;

-- Créer une fonction pour nettoyage automatique (optionnel)
CREATE OR REPLACE FUNCTION cleanup_expired_otp()
RETURNS void AS $$
BEGIN
    -- Supprimer les OTP expirés
    DELETE FROM otp_sessions 
    WHERE expires_at < NOW();
    
    -- Supprimer les OTP utilisés depuis plus de 24h
    DELETE FROM otp_sessions 
    WHERE used = true 
    AND used_at < NOW() - INTERVAL '24 hours';
    
    -- Log du nettoyage
    RAISE NOTICE 'Nettoyage des OTP expirés terminé à %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Exemple d'utilisation de la fonction
-- SELECT cleanup_expired_otp();

-- Créer un index pour optimiser les requêtes de nettoyage
CREATE INDEX IF NOT EXISTS idx_otp_sessions_expires_at ON otp_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_sessions_used_at ON otp_sessions(used_at) WHERE used = true;
CREATE INDEX IF NOT EXISTS idx_otp_sessions_email ON otp_sessions(email); 