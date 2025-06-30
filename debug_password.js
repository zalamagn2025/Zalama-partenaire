// Script de débogage pour les mots de passe
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configuration Supabase
const supabaseUrl = 'https://mspmrzlqhwpdkkburjiw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcG1yemxxaHdwZGtrYnVyaml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODcyNTgsImV4cCI6MjA2NjM2MzI1OH0.zr-TRpKjGJjW0nRtsyPcCLy4Us-c5tOGX71k5_3JJd0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fonction pour hasher un mot de passe
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

async function debugPasswords() {
  console.log('=== DÉBOGAGE DES MOTS DE PASSE YOUCOMPANY ===\n');
  
  const testPassword = 'Samy2004@';
  const expectedHash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';
  const actualHash = hashPassword(testPassword);
  
  console.log(`Mot de passe testé: ${testPassword}`);
  console.log(`Hash attendu: ${expectedHash}`);
  console.log(`Hash calculé: ${actualHash}`);
  console.log(`Hashes identiques: ${expectedHash === actualHash ? '✅ OUI' : '❌ NON'}\n`);
  
  // Récupérer les utilisateurs YouCompany
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, nom, prenom, encrypted_password, password_hash')
    .eq('organisation', 'YouCompany');
  
  if (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return;
  }
  
  console.log('=== UTILISATEURS YOUCOMPANY ===');
  users.forEach(user => {
    console.log(`\nUtilisateur: ${user.nom} ${user.prenom} (${user.email})`);
    console.log(`ID: ${user.id}`);
    console.log(`encrypted_password: ${user.encrypted_password}`);
    console.log(`password_hash: ${user.password_hash || 'NULL'}`);
    
    if (user.encrypted_password) {
      const matchesExpected = user.encrypted_password === expectedHash;
      const matchesActual = user.encrypted_password === actualHash;
      console.log(`Correspond au hash attendu: ${matchesExpected ? '✅ OUI' : '❌ NON'}`);
      console.log(`Correspond au hash calculé: ${matchesActual ? '✅ OUI' : '❌ NON'}`);
    }
  });
  
  console.log('\n=== TEST DE CONNEXION DIRECT ===');
  
  // Test direct avec Supabase
  for (const user of users) {
    console.log(`\n--- Test pour ${user.email} ---`);
    
    // Vérifier avec encrypted_password
    if (user.encrypted_password === actualHash) {
      console.log('✅ Connexion réussie avec encrypted_password');
    } else {
      console.log('❌ Échec avec encrypted_password');
    }
    
    // Vérifier avec password_hash (au cas où)
    if (user.password_hash && user.password_hash === actualHash) {
      console.log('✅ Connexion réussie avec password_hash');
    } else if (user.password_hash) {
      console.log('❌ Échec avec password_hash');
    } else {
      console.log('⚠️  password_hash est NULL');
    }
  }
}

debugPasswords().catch(console.error); 