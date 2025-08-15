// Script de test pour l'authentification Edge Function
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const EDGE_FUNCTION_BASE_URL = `${SUPABASE_URL}/functions/v1/partner-auth`;

async function testEdgeAuth() {
  console.log("🧪 Test de l'authentification Edge Function");
  console.log("URL de base:", EDGE_FUNCTION_BASE_URL);

  // Test 1: Vérifier que l'Edge Function est accessible
  try {
    const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    });

    console.log("✅ Edge Function accessible");
    console.log("Status:", response.status);

    const data = await response.json();
    console.log("Réponse:", data);
  } catch (error) {
    console.error("❌ Erreur lors du test de l'Edge Function:", error);
  }

  // Test 2: Vérifier les variables d'environnement
  console.log("\n📋 Variables d'environnement:");
  console.log(
    "NEXT_PUBLIC_SUPABASE_URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  console.log(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Définie" : "❌ Manquante"
  );
}

// Exécuter le test
testEdgeAuth().catch(console.error);
