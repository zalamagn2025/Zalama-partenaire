require("dotenv").config();

async function testOTPAPI() {
  console.log("🧪 Test de l'API OTP...\n");

  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const testEmail = "morykoulibaly1223@gmail.com"; // Utilisez votre email

  try {
    // Test 1: Envoyer un OTP
    console.log("1. Test d'envoi d'OTP...");
    console.log(`   URL: ${baseURL}/api/otp/send`);
    console.log(`   Email: ${testEmail}`);

    const sendResponse = await fetch(`${baseURL}/api/otp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    console.log(`   Status: ${sendResponse.status}`);

    if (sendResponse.ok) {
      const sendData = await sendResponse.json();
      console.log("✅ OTP envoyé avec succès");
      console.log(`   Message: ${sendData.message}`);
      console.log(`   Expire à: ${sendData.expiresAt}\n`);

      // Test 2: Vérifier un OTP incorrect
      console.log("2. Test de vérification d'OTP incorrect...");
      const verifyResponse = await fetch(`${baseURL}/api/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testEmail,
          otp: "000000",
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        console.log("✅ Erreur attendue pour OTP incorrect");
        console.log(`   Erreur: ${verifyData.error}\n`);
      } else {
        console.log("❌ OTP incorrect accepté (problème de sécurité)\n");
      }
    } else {
      const errorText = await sendResponse.text();
      console.log("❌ Erreur lors de l'envoi de l'OTP");
      console.log(`   Status: ${sendResponse.status}`);
      console.log(`   Response: ${errorText}\n`);

      // Afficher les détails de l'erreur
      if (sendResponse.status === 404) {
        console.log("🔍 Détails de l'erreur 404:");
        console.log("   - Vérifiez que le serveur Next.js est démarré");
        console.log(
          "   - Vérifiez que le fichier app/api/otp/send/route.ts existe"
        );
        console.log(
          "   - Vérifiez que le serveur a redémarré après les modifications"
        );
      }
    }

    console.log("🎉 Test de l'API OTP terminé!");
  } catch (error) {
    console.error("❌ Erreur lors du test de l'API OTP:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("\n🔍 Le serveur Next.js n'est pas démarré");
      console.log("   Démarrez le serveur avec: npm run dev");
    }
  }
}

// Test de la base de données
async function testDatabase() {
  console.log("🗄️  Test de la base de données...\n");

  const { createClient } = require("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Variables Supabase manquantes");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Vérifier la table otp_sessions
    console.log("1. Vérification de la table otp_sessions...");
    const { data: tableInfo, error: tableError } = await supabase
      .from("otp_sessions")
      .select("*")
      .limit(1);

    if (tableError) {
      console.log("❌ Erreur table otp_sessions:", tableError.message);
    } else {
      console.log("✅ Table otp_sessions accessible");
    }

    // Test 2: Vérifier l'utilisateur
    console.log("2. Vérification de l'utilisateur...");
    const { data: user, error: userError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", "morykoulibaly1223@gmail.com")
      .eq("active", true)
      .single();

    if (userError) {
      console.log("❌ Erreur utilisateur:", userError.message);
    } else {
      console.log("✅ Utilisateur trouvé:", user.email);
    }
  } catch (error) {
    console.error("❌ Erreur base de données:", error.message);
  }
}

async function runTests() {
  console.log("🚀 Démarrage des tests...\n");

  await testDatabase();
  console.log("");
  await testOTPAPI();

  console.log("\n📋 Résumé :");
  console.log("1. Vérifiez que le serveur Next.js est démarré");
  console.log("2. Vérifiez que les variables d'environnement sont configurées");
  console.log("3. Vérifiez que la table otp_sessions existe");
  console.log("4. Vérifiez que l'utilisateur existe dans admin_users");
}

// Exécuter les tests
runTests().catch(console.error);
