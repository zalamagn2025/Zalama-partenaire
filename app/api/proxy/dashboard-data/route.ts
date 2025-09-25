import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/partner-dashboard-data/dashboard-data";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get("Authorization");

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Récupérer les paramètres de requête (month, year)
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    
    // Construire l'URL avec les paramètres
    let functionUrl = SUPABASE_FUNCTION_URL;
    const params = new URLSearchParams();
    
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    
    if (params.toString()) {
      functionUrl += '?' + params.toString();
    }

    console.log("🔄 Proxy Dashboard Data - URL:", functionUrl);
    console.log("🔄 Proxy Dashboard Data - Params:", { month, year });

    const response = await fetch(functionUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from Edge Function (dashboard-data):", data);
      return NextResponse.json({ 
        success: false, 
        message: data.message || "Error fetching dashboard data from Edge Function", 
        details: data 
      }, { status: response.status });
    }

    console.log("✅ Proxy Dashboard Data - Response:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error (dashboard-data):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}