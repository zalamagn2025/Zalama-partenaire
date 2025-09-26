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
      mois: searchParams.get('mois'),
      annee: searchParams.get('annee'),
      date_debut: searchParams.get('date_debut'),
      date_fin: searchParams.get('date_fin'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    };

    // Construire l'URL avec les paramètres
    let url = SUPABASE_FUNCTION_URL + "/remboursements";
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    if (params.toString()) {
      url += '?' + params.toString();
    }

    console.log("🔄 Proxy Finances Remboursements - URL:", url);
    console.log("🔄 Proxy Finances Remboursements - Filters:", filters);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from Edge Function (finances remboursements):", data);
      return NextResponse.json({ 
        success: false, 
        message: data.message || "Error fetching finances remboursements from Edge Function", 
        details: data 
      }, { status: response.status });
    }

    console.log("✅ Proxy Finances Remboursements - Response:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error (finances remboursements):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
