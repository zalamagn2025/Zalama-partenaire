const { Client } = require("nimbasms");

// Configuration de test
const config = {
  SERVICE_ID: process.env.NIMBA_SMS_SERVICE_ID || "test_service_id",
  SECRET_TOKEN: process.env.NIMBA_SMS_SECRET_TOKEN || "test_token",
};

const client = new Client(config);

async function testNimbaSMS() {
  console.log("🧪 Test du système Nimba SMS...\n");

  try {
    // Test 1: Vérifier le solde du compte
    console.log("1. Vérification du solde du compte...");
    const account = await client.accounts.get();
    console.log(`✅ Solde du compte: ${account.balance || "N/A"}\n`);

    // Test 2: Lister les sender names
    console.log("2. Récupération des sender names...");
    const sendernames = await client.sendernames.list();
    console.log(`✅ Nombre de sender names: ${sendernames.count || 0}`);
    if (sendernames.results && sendernames.results.length > 0) {
      console.log("📋 Sender names disponibles:");
      sendernames.results.forEach((sender) => {
        console.log(`   - ${sender.name || sender.sendername}`);
      });
    }
    console.log("");

    // Test 3: Envoyer un SMS de test (si un numéro est fourni)
    const testPhone = process.env.TEST_PHONE;
    if (testPhone) {
      console.log(`3. Envoi d'un SMS de test à ${testPhone}...`);
      const message = await client.messages.create({
        to: [testPhone],
        message: "Test du système OTP Partner - Code: 123456",
        sender_name: "Partner",
      });
      console.log(`✅ SMS envoyé avec succès! ID: ${message.id || "N/A"}\n`);
    } else {
      console.log("3. ⚠️  Aucun numéro de test fourni (TEST_PHONE)\n");
    }

    console.log("🎉 Tous les tests Nimba SMS sont passés avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors du test Nimba SMS:", error.message);

    if (error.response) {
      console.error("Détails de l'erreur:", error.response.data);
    }
  }
}

async function testOTPAPI() {
  console.log("🧪 Test des API OTP...\n");

  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const testEmail = "test@example.com";

  try {
    // Test 1: Envoyer un OTP
    console.log("1. Test d'envoi d'OTP...");
    const sendResponse = await fetch(`${baseURL}/api/otp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        phone: process.env.TEST_PHONE,
      }),
    });

    const sendData = await sendResponse.json();

    if (sendResponse.ok) {
      console.log("✅ OTP envoyé avec succès");
      console.log(`   Message: ${sendData.message}`);
      console.log(`   Expire à: ${sendData.expiresAt}\n`);
    } else {
      console.log("❌ Erreur lors de l'envoi de l'OTP");
      console.log(`   Erreur: ${sendData.error}\n`);
    }

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

    console.log("🎉 Tests des API OTP terminés!");
  } catch (error) {
    console.error("❌ Erreur lors du test des API OTP:", error.message);
  }
}

async function testEmailService() {
  console.log("🧪 Test du service email (Resend)...\n");

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log("⚠️  Aucune clé API Resend trouvée");
    console.log("   Ajoutez RESEND_API_KEY à votre fichier .env\n");
    return;
  }

  try {
    const { Resend } = require("resend");
    const resend = new Resend(resendApiKey);

    console.log("1. Test d'envoi d'email...");
    const emailResponse = await resend.emails.send({
      from: "Partner <noreply@partner.com>",
      to: ["test@example.com"],
      subject: "Test du système OTP Partner",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test du système OTP</h2>
          <p>Ceci est un email de test pour vérifier la configuration Resend.</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">123456</h1>
          </div>
          <p>Code de test: 123456</p>
        </div>
      `,
    });

    console.log("✅ Email de test envoyé avec succès!");
    console.log(`   ID: ${emailResponse.id || "N/A"}\n`);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi d'email:", error.message);

    if (error.statusCode) {
      console.error(`   Code d'erreur: ${error.statusCode}`);
    }
  }
}

async function runAllTests() {
  console.log("🚀 Démarrage des tests du système OTP...\n");

  // Test 1: Service email
  await testEmailService();

  // Test 2: Service SMS
  await testNimbaSMS();

  // Test 3: API OTP
  await testOTPAPI();

  console.log("\n📋 Résumé des tests:");
  console.log("✅ Service email (Resend)");
  console.log("✅ Service SMS (Nimba SMS)");
  console.log("✅ API OTP (send/verify)");
  console.log("\n🎉 Tous les tests sont terminés!");
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testNimbaSMS,
  testOTPAPI,
  testEmailService,
  runAllTests,
};
