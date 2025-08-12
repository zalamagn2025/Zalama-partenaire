require("dotenv").config();

console.log(
  "🔍 Vérification de la configuration des variables d'environnement...\n"
);

// Vérifier les variables d'environnement
const envVars = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NIMBA_SMS_SERVICE_ID: process.env.NIMBA_SMS_SERVICE_ID,
  NIMBA_SMS_SECRET_TOKEN: process.env.NIMBA_SMS_SECRET_TOKEN,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

console.log("📋 Variables d'environnement :");
Object.entries(envVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${key}: NON DÉFINIE`);
  }
});

console.log("\n🔧 Configuration requise :");
console.log('1. RESEND_API_KEY doit commencer par "re_"');
console.log("2. NIMBA_SMS_SERVICE_ID doit être défini");
console.log("3. NIMBA_SMS_SECRET_TOKEN doit être défini");

// Vérifier le format de la clé Resend
if (process.env.RESEND_API_KEY) {
  if (process.env.RESEND_API_KEY.startsWith("re_")) {
    console.log("\n✅ Clé Resend valide");
  } else {
    console.log('\n❌ Clé Resend invalide - doit commencer par "re_"');
  }
} else {
  console.log("\n❌ Clé Resend manquante");
}

// Vérifier les clés Nimba SMS
if (process.env.NIMBA_SMS_SERVICE_ID && process.env.NIMBA_SMS_SECRET_TOKEN) {
  console.log("✅ Clés Nimba SMS définies");
} else {
  console.log("❌ Clés Nimba SMS manquantes");
}

console.log("\n📝 Pour corriger les problèmes :");
console.log("1. Créez un fichier .env à la racine du projet");
console.log("2. Ajoutez les variables manquantes :");
console.log(`
# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# SMS Service (Nimba SMS)
NIMBA_SMS_SERVICE_ID=your_service_id_here
NIMBA_SMS_SECRET_TOKEN=your_secret_token_here
`);

console.log("\n🌐 Liens utiles :");
console.log("- Resend: https://resend.com");
console.log("- Nimba SMS: https://nimbasms.com");
