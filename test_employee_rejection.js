// Test pour la fonctionnalité de rejet des inscriptions d'employés
// Edge Function: partner-employees

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mspmrzlqhwpdkkburjiw.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/partner-employees`;

// Token d'authentification (à remplacer par un token valide)
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsImtpZCI6IkMvUHpxSEtWamc5L0JTRHUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21zcG1yemxxaHdwZGtrYnVyaml3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3MzQ4NDE3Ny0wNzNmLTQ0YjMtYTZmMi0wODgzYzhjMGNiNzYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU3NTIxMDM0LCJpYXQiOjE3NTc1MTc0MzQsImVtYWlsIjoibW9yeWtvdWxpYmFseTIwMjNAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiTW9yeSBLb3VsaWJhbHkiLCJwYXJ0ZW5haXJlX2lkIjoiMDdlMWFjNDItOWExNi00ODNjLWEyZTAtYzZhYTU3ODQ0NDI0Iiwicm9sZSI6InJoIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTc1MTc0MzR9XSwic2Vzc2lvbl9pZCI6IjU5MDE5N2RlLTVjM2QtNDM0OC1iNTk5LTE3ZjA4YjlkMzBhMCIsImlzX2Fub255bW91cyI6ZmFsc2V9.Bkf0ffNBiMCzIpwOLODl_jznNiuEhQDFssxrUVtWhlg";

// ID d'employé de test (à remplacer par un ID valide)
const EMPLOYEE_ID = "141d00e6-0412-4bc9-babd-f79961c20e0b";

async function testEmployeeRejection() {
  console.log(
    "🧪 Test de la fonctionnalité de rejet des inscriptions d'employés"
  );
  console.log("=".repeat(60));

  try {
    // Test 1: Rejet avec motif
    console.log("\n1️⃣ Test de rejet avec motif...");
    const response1 = await fetch(`${FUNCTION_URL}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        employee_id: EMPLOYEE_ID,
        reason: "Documents incomplets ou informations manquantes",
      }),
    });

    const result1 = await response1.json();
    console.log("Status:", response1.status);
    console.log("Response:", JSON.stringify(result1, null, 2));

    if (response1.ok) {
      console.log("✅ Rejet avec motif réussi");
    } else {
      console.log("❌ Erreur lors du rejet avec motif");
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }

  try {
    // Test 2: Rejet sans motif
    console.log("\n2️⃣ Test de rejet sans motif...");
    const response2 = await fetch(`${FUNCTION_URL}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        employee_id: EMPLOYEE_ID,
      }),
    });

    const result2 = await response2.json();
    console.log("Status:", response2.status);
    console.log("Response:", JSON.stringify(result2, null, 2));

    if (response2.ok) {
      console.log("✅ Rejet sans motif réussi");
    } else {
      console.log("❌ Erreur lors du rejet sans motif");
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }

  try {
    // Test 3: Test avec ID invalide
    console.log("\n3️⃣ Test avec ID invalide...");
    const response3 = await fetch(`${FUNCTION_URL}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        employee_id: "invalid-uuid-here",
        reason: "Test avec ID invalide",
      }),
    });

    const result3 = await response3.json();
    console.log("Status:", response3.status);
    console.log("Response:", JSON.stringify(result3, null, 2));

    if (response3.status === 400) {
      console.log("✅ Validation d'ID invalide fonctionne");
    } else {
      console.log("❌ Validation d'ID invalide échouée");
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }

  try {
    // Test 4: Test sans token d'authentification
    console.log("\n4️⃣ Test sans token d'authentification...");
    const response4 = await fetch(`${FUNCTION_URL}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employee_id: EMPLOYEE_ID,
        reason: "Test sans auth",
      }),
    });

    const result4 = await response4.json();
    console.log("Status:", response4.status);
    console.log("Response:", JSON.stringify(result4, null, 2));

    if (response4.status === 401) {
      console.log("✅ Validation d'authentification fonctionne");
    } else {
      console.log("❌ Validation d'authentification échouée");
    }
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🏁 Tests terminés");
}

// Exécuter les tests
testEmployeeRejection().catch(console.error);
