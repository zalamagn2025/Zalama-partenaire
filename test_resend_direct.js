// Test direct de Resend pour vérifier l'envoi d'emails
require("dotenv").config();

async function testResendDirect() {
  console.log("🧪 Test direct de Resend...\n");

  const { Resend } = require("resend");
  const resendApiKey = process.env.RESEND_API_KEY;
  const testEmail = "morykoulibaly1223@gmail.com";

  if (!resendApiKey) {
    console.log("❌ Clé Resend manquante");
    return;
  }

  console.log("✅ Clé Resend détectée");
  console.log(`📧 Envoi d'email à: ${testEmail}\n`);

  try {
    const resend = new Resend(resendApiKey);

    const emailResponse = await resend.emails.send({
      from: "Partner <onboarding@resend.dev>",
      to: [testEmail],
      subject: "Test direct - Système OTP Partner",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test d'envoi d'email</h2>
          <p>Ceci est un test direct de l'envoi d'email via Resend.</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">TEST123</h1>
          </div>
          <p>Code de test: TEST123</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log("✅ Email envoyé avec succès!");
    console.log(`   ID: ${emailResponse.id || "N/A"}`);
    console.log(`   From: onboarding@resend.dev`);
    console.log(`   To: ${testEmail}`);
    console.log(`   Subject: Test direct - Système OTP Partner`);

    console.log("\n📋 Vérifiez maintenant :");
    console.log("   1. Votre boîte de réception");
    console.log("   2. Le dossier spam");
    console.log("   3. Le dashboard Resend (peut prendre quelques minutes)");
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi d'email:", error.message);

    if (error.statusCode) {
      console.error(`   Code d'erreur: ${error.statusCode}`);
    }

    if (error.response) {
      console.error("   Détails de l'erreur:", error.response.data);
    }
  }
}

// Exécuter le test
testResendDirect().catch(console.error);
