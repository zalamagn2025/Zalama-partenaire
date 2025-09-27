import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/partner-finances";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get("Authorization");
    const { searchParams } = new URL(request.url);
    
    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Extraire tous les paramètres de filtres possibles
    const filters = {
      annee: searchParams.get('annee')
    };

    // Construire l'URL avec les paramètres
    let url = SUPABASE_FUNCTION_URL + "/evolution-mensuelle";
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    if (params.toString()) {
      url += '?' + params.toString();
    }

    console.log("🔄 Proxy Finances Evolution - URL:", url);
    console.log("🔄 Proxy Finances Evolution - Filters:", filters);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from Edge Function (finances evolution):", data);
      return NextResponse.json({ 
        success: false, 
        message: data.message || "Error fetching finances evolution from Edge Function", 
        details: data 
      }, { status: response.status });
    }

    console.log("✅ Proxy Finances Evolution - Response:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error (finances evolution):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

