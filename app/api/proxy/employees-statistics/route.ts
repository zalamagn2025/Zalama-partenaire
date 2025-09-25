import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/partner-employees/statistics";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get("Authorization");
    const { searchParams } = new URL(request.url);

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Construire l'URL avec les paramètres de requête
    let url = SUPABASE_FUNCTION_URL;
    const queryParams = new URLSearchParams();
    
    // Ajouter les paramètres de filtrage pour les statistiques
    const actif = searchParams.get("actif");
    const date_debut = searchParams.get("date_debut");
    const date_fin = searchParams.get("date_fin");

    if (actif) queryParams.append("actif", actif);
    if (date_debut) queryParams.append("date_debut", date_debut);
    if (date_fin) queryParams.append("date_fin", date_fin);

    if (queryParams.toString()) {
      url += "?" + queryParams.toString();
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from Edge Function (employees-statistics):", data);
      return NextResponse.json({ success: false, message: data.message || "Error fetching employees statistics from Edge Function", details: data }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error (employees-statistics):", error);
    return NextResponse.json({ success: false, message: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
