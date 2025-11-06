import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/partner-payment-history";

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
    
    // Ajouter tous les paramètres de filtrage
    const action = searchParams.get("action");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const statut = searchParams.get("statut");
    const periode_debut = searchParams.get("periode_debut");
    const periode_fin = searchParams.get("periode_fin");
    const search = searchParams.get("search");
    const employee_id = searchParams.get("employee_id");

    if (action) queryParams.append("action", action);
    if (page) queryParams.append("page", page);
    if (limit) queryParams.append("limit", limit);
    if (statut) queryParams.append("statut", statut);
    if (periode_debut) queryParams.append("periode_debut", periode_debut);
    if (periode_fin) queryParams.append("periode_fin", periode_fin);
    if (search) queryParams.append("search", search);
    if (employee_id) queryParams.append("employee_id", employee_id);

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
      console.error("Error from Edge Function (payments):", data);
      return NextResponse.json({ success: false, message: data.message || "Error fetching payments from Edge Function", details: data }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error (payments):", error);
    return NextResponse.json({ success: false, message: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
