import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Proxy: Récupération de la requête...");

    const body = await request.json();
    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        { success: false, message: "Token d'autorisation manquant" },
        { status: 401 }
      );
    }

    console.log("🔄 Proxy: Appel vers l'Edge Function...", {
      body,
      hasAuth: !!authorization,
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/payment-execution`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    console.log("✅ Proxy: Réponse reçue", {
      status: response.status,
      success: data.success,
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ Proxy: Erreur", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur du proxy",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, content-type",
    },
  });
}
