// Test simple pour vérifier l'accessibilité de l'edge function partner-finances
const SUPABASE_URL = "https://mspmrzlqhwpdkkburjiw.supabase.co";
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/partner-finances/stats`;

// Token de test (remplacez par un token valide)
const TEST_TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkMvUHpxSEtWamc5L0JTRHUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL21zcG1yemxxaHdwZGtrYnVyaml3LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3MzQ4NDE3Ny0wNzNmLTQ0YjMtYTZmMi0wODgzYzhjMGNiNzYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU4OTA3Nzc4LCJpYXQiOjE3NTg5MDQxNzgsImVtYWlsIjoibW9yeWtvdWxpYmFseTIwMjNAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiTW9yeSBLb3VsaWJhbHkiLCJwYXJ0ZW5haXJlX2lkIjoiMDdlMWFjNDItOWExNi00ODNjLWEyZTAtYzZhYTU3ODQ0NDI0Iiwicm9sZSI6InJoIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTg5MDQxNzh9XSwic2Vzc2lvbl9pZCI6IjkxMTI2OGIxLTY5NmMtNGQwNC04MWU3LTJlMWQyOTI1OWJiMSIsImlzX2Fub255bW91cyI6ZmFsc2V9.0kyKisB_yrawoy2Av6v4oTfkYEVlklN6kVLgfIMKxhk";

async function testPartnerFinances() {
  try {
    console.log("🔄 Test de l'edge function partner-finances...");
    console.log("URL:", FUNCTION_URL);
    
    const response = await fetch(FUNCTION_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TEST_TOKEN}`,
      },
    });

    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log("✅ Edge function accessible et fonctionnelle");
    } else {
      console.log("❌ Erreur:", data.message || "Erreur inconnue");
    }
  } catch (error) {
    console.error("❌ Erreur de connexion:", error.message);
  }
}

testPartnerFinances();
