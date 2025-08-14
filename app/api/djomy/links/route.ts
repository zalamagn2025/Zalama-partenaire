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

// Fonction pour obtenir un token d'authentification
async function getAuthToken(): Promise<string | null> {
  try {
    const clientId =
      process.env.NEXT_PUBLIC_DJOMY_CLIENT_ID ||
      "djomy-client-1754500086561-b84a";
    const clientSecret =
      process.env.NEXT_PUBLIC_DJOMY_CLIENT_SECRET ||
      "s3cr3t-EmZBxHs45gEVdl7fqhRAtHTR2PISBrJ-";
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_DJOMY_API_BASE_URL ||
      "https://sandbox-api.djomy.africa";

    const signature = generateHmacSignature(clientId, clientSecret);
    const apiKey = `${clientId}:${signature}`;

    const response = await fetch(`${apiBaseUrl}/v1/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      console.error(
        "❌ Erreur HTTP auth:",
        response.status,
        response.statusText
      );
      return null;
    }

    const data = await response.json();

    if (data.success && data.data?.accessToken) {
      return data.data.accessToken;
    } else {
      console.error("❌ Erreur d'authentification:", data);
      return null;
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'authentification:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkData } = body;

    console.log("🔗 Création lien côté serveur:", linkData);

    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur d'authentification avec l'API Djomy",
        },
        { status: 401 }
      );
    }

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_DJOMY_API_BASE_URL ||
      "https://sandbox-api.djomy.africa";

    const response = await fetch(`${apiBaseUrl}/v1/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(linkData),
    });

    if (!response.ok) {
      console.error(
        "❌ Erreur HTTP lien:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("❌ Réponse d'erreur lien:", errorText);

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

    if (data.success && data.data) {
      console.log("✅ Lien créé avec succès côté serveur");
      return NextResponse.json({
        success: true,
        data: data.data,
      });
    } else {
      console.error("❌ Erreur de création de lien:", data);
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Erreur lors de la création du lien",
          details: data,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création du lien:", error);
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
