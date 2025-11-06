/**
 * 🧪 Test Payment Salary Integration
 *
 * Ce script teste l'intégration des paiements de salaires
 */

const { createClient } = require("@supabase/supabase-js");

// Configuration Supabase
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPaymentEmployees() {
  console.log("🔄 Test: Récupération des employés pour paiement...");

  try {
    // Test avec un token partenaire (vous devrez le remplacer)
    const testToken = "your-partner-token-here";

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/payment-employees`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Succès:", data);
      console.log(
        `📊 Employés éligibles: ${
          data.data?.statistiques?.employes_eligibles || 0
        }`
      );
      console.log(
        `💰 Montant total: ${
          data.data?.statistiques?.montant_total_disponible || 0
        } GNF`
      );
    } else {
      console.error("❌ Erreur:", data);
    }
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);
  }
}

async function testPaymentExecution() {
  console.log("🔄 Test: Exécution des paiements...");

  try {
    const testToken = "your-partner-token-here";
    const testEmployeeIds = ["employee-id-1", "employee-id-2"];

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/payment-execution`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employes_selectionnes: testEmployeeIds,
          mois: 12,
          annee: 2024,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Paiements exécutés:", data);
    } else {
      console.error("❌ Erreur d'exécution:", data);
    }
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log("🚀 Démarrage des tests Payment Salary...\n");

  await testPaymentEmployees();
  console.log("\n" + "=".repeat(50) + "\n");

  // Décommentez pour tester l'exécution des paiements
  // await testPaymentExecution();

  console.log("✅ Tests terminés");
}

// Exécuter si appelé directement
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testPaymentEmployees,
  testPaymentExecution,
  runTests,
};
