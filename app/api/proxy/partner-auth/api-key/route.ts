import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/partner-auth/api-key`;

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || request.headers.get("Authorization");

    if (!authorization) {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized" 
      }, { status: 401 });
    }

    // Utiliser exactement la même logique qu'avant avec Supabase.co
    // Passer le token tel quel (déjà au format "Bearer token" ou juste le token)
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "GET",
      headers: {
        "Authorization": authorization,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Edge Function error:", errorData);
      return NextResponse.json({ 
        success: false, 
        message: "Error calling api-key",
        error: errorData
      }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Proxy error (partner-auth/api-key):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

