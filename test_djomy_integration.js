// Script de test pour l'intégration Djomy
// Usage: node test_djomy_integration.js

const crypto = require("crypto");

// Configuration de test (remplacez par vos vraies clés)
const config = {
  baseUrl: "https://sandbox-api.djomy.africa",
  clientId: process.env.NEXT_PUBLIC_DJOMY_CLIENT_ID || "test_client_id",
  clientSecret:
    process.env.NEXT_PUBLIC_DJOMY_CLIENT_SECRET || "test_client_secret",
};

// Fonction pour générer la signature HMAC
function generateHmacSignature(clientId, clientSecret) {
  try {
    const hash = crypto
      .createHmac("sha256", clientSecret)
      .update(clientId)
      .digest("hex");
    return hash;
  } catch (error) {
    console.error("Erreur de génération HMAC:", error);
    throw error;
  }
}

// Fonction pour obtenir un token d'authentification
async function getAuthToken() {
  try {
    const signature = generateHmacSignature(
      config.clientId,
      config.clientSecret
    );
    const apiKey = `${config.clientId}:${signature}`;

    console.log("🔑 Tentative d'authentification...");
    console.log("Client ID:", config.clientId);
    console.log("Signature générée:", signature.substring(0, 20) + "...");

    const response = await fetch(`${config.baseUrl}/v1/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(
        `Erreur HTTP: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.success && data.data?.accessToken) {
      console.log("✅ Authentification réussie !");
      return data.data.accessToken;
    } else {
      throw new Error(data.message || "Erreur d'authentification");
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'authentification:", error.message);
    throw error;
  }
}

// Fonction pour tester un paiement
async function testPayment(token) {
  try {
    console.log("\n💳 Test d'initiation de paiement...");

    const paymentData = {
      paymentMethod: "OM",
      payerIdentifier: "00224623707722", // Numéro de test
      amount: 1000, // 1000 GNF
      countryCode: "GN",
      description: "Test de paiement - Remboursement avance",
      merchantPaymentReference: "TEST-REMBOURSEMENT-001",
    };

    console.log("Données de paiement:", paymentData);

    const response = await fetch(`${config.baseUrl}/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(
        `Erreur HTTP: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.success && data.data) {
      console.log("✅ Paiement initié avec succès !");
      console.log("Transaction ID:", data.data.transactionId);
      console.log("Statut:", data.data.status);
      if (data.data.paymentUrl) {
        console.log("URL de paiement:", data.data.paymentUrl);
      }
      return data.data.transactionId;
    } else {
      throw new Error(
        data.message || "Erreur lors de l'initiation du paiement"
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors du test de paiement:", error.message);
    throw error;
  }
}

// Fonction pour tester la vérification de statut
async function testStatusCheck(token, transactionId) {
  try {
    console.log("\n🔍 Test de vérification de statut...");
    console.log("Transaction ID:", transactionId);

    const response = await fetch(
      `${config.baseUrl}/v1/payments/${transactionId}/status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Erreur HTTP: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.success && data.data) {
      console.log("✅ Statut récupéré avec succès !");
      console.log("Statut actuel:", data.data.status);
      console.log("Méthode de paiement:", data.data.paymentMethod);
      console.log("Montant payé:", data.data.paidAmount);
      console.log("Frais:", data.data.fees);
      console.log("Date de création:", data.data.createdAt);
      return data.data;
    } else {
      throw new Error(
        data.message || "Erreur lors de la vérification du statut"
      );
    }
  } catch (error) {
    console.error(
      "❌ Erreur lors de la vérification de statut:",
      error.message
    );
    throw error;
  }
}

// Fonction pour tester la création d'un lien de paiement
async function testPaymentLink(token) {
  try {
    console.log("\n🔗 Test de création de lien de paiement...");

    const linkData = {
      amountToPay: 5000, // 5000 GNF
      linkName: "Test Remboursement Avance",
      phoneNumber: "00224623707722",
      description: "Lien de test pour remboursement avance salariale",
      countryCode: "GN",
      usageType: "UNIQUE",
      merchantReference: "LINK-TEST-REMBOURSEMENT-001",
    };

    console.log("Données du lien:", linkData);

    const response = await fetch(`${config.baseUrl}/v1/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(linkData),
    });

    if (!response.ok) {
      throw new Error(
        `Erreur HTTP: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.success && data.data) {
      console.log("✅ Lien de paiement créé avec succès !");
      console.log("Référence:", data.data.reference);
      console.log("URL de paiement:", data.data.paymentUrl);
      console.log("Statut:", data.data.status);
      return data.data;
    } else {
      throw new Error(data.message || "Erreur lors de la création du lien");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création du lien:", error.message);
    throw error;
  }
}

// Fonction principale de test
async function runTests() {
  console.log("🚀 Démarrage des tests d'intégration Djomy...\n");

  try {
    // Test 1: Authentification
    const token = await getAuthToken();

    // Test 2: Création d'un lien de paiement
    await testPaymentLink(token);

    // Test 3: Initiation d'un paiement
    const transactionId = await testPayment(token);

    // Test 4: Vérification du statut
    await testStatusCheck(token, transactionId);

    console.log("\n🎉 Tous les tests sont passés avec succès !");
    console.log("\n📝 Résumé:");
    console.log("- ✅ Authentification: OK");
    console.log("- ✅ Création de lien: OK");
    console.log("- ✅ Initiation de paiement: OK");
    console.log("- ✅ Vérification de statut: OK");
  } catch (error) {
    console.error("\n💥 Erreur lors des tests:", error.message);
    console.log("\n🔧 Vérifiez:");
    console.log("- Vos clés API Djomy sont correctes");
    console.log("- L'URL de l'API est accessible");
    console.log("- Votre compte Djomy est actif");
    process.exit(1);
  }
}

// Vérification des variables d'environnement
console.log("🔧 Configuration:");
console.log("Base URL:", config.baseUrl);
console.log("Client ID:", config.clientId ? "✅ Configuré" : "❌ Manquant");
console.log(
  "Client Secret:",
  config.clientSecret ? "✅ Configuré" : "❌ Manquant"
);

if (!config.clientId || !config.clientSecret) {
  console.log("\n⚠️  Attention: Clés API manquantes !");
  console.log("Ajoutez vos clés dans le fichier .env.local:");
  console.log("NEXT_PUBLIC_DJOMY_CLIENT_ID=votre_client_id");
  console.log("NEXT_PUBLIC_DJOMY_CLIENT_SECRET=votre_client_secret");
  process.exit(1);
}

// Exécution des tests
runTests();
