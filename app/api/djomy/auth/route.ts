import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Fonction pour générer la signature HMAC côté serveur
function generateHmacSignature(clientId: string, clientSecret: string): string {
  try {
    const hmac = crypto.createHmac("sha256", clientSecret);
    hmac.update(clientId);
    return hmac.digest("hex");
  } catch (error) {
    console.error("Erreur de génération HMAC:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientId =
      process.env.DJOMY_CLIENT_ID || "djomy-client-1754500086561-b84a";
    const clientSecret =
      process.env.DJOMY_CLIENT_SECRET ||
      "s3cr3t-EmZBxHs45gEVdl7fqhRAtHTR2PISBrJ-";
    const apiBaseUrl =
      process.env.DJOMY_API_BASE_URL || "https://sandbox-api.djomy.africa";

    const signature = generateHmacSignature(clientId, clientSecret);
    const apiKey = `${clientId}:${signature}`;

    console.log("🔐 Authentification côté serveur:", {
      clientId,
      apiBaseUrl,
      hasSignature: !!signature,
    });

    const response = await fetch(`${apiBaseUrl}/v1/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      console.error("❌ Erreur HTTP:", response.status, response.statusText);
      const errorText = await response.text();
      console.error("❌ Réponse d'erreur:", errorText);

      return NextResponse.json(
        {
          success: false,
          error: `Erreur HTTP ${response.status}: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.success && data.data?.accessToken) {
      console.log("✅ Authentification réussie côté serveur");
      return NextResponse.json({
        success: true,
        data: {
          accessToken: data.data.accessToken,
        },
      });
    } else {
      console.error("❌ Erreur d'authentification:", data);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur d'authentification",
          details: data,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'authentification:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur de connexion à l'API Djomy",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
