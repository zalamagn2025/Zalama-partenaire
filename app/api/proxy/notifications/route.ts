import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get("Authorization");

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const lu = searchParams.get("lu");
    const limit = searchParams.get("limit");

    // Construire l'URL de l'API Supabase REST
    let supabaseUrl = `${SUPABASE_URL}/rest/v1/notifications?select=*`;
    
    if (user_id) {
      supabaseUrl += `&user_id=eq.${user_id}`;
    }
    
    if (lu !== null) {
      supabaseUrl += `&lu=eq.${lu === "true"}`;
    }
    
    if (limit) {
      supabaseUrl += `&limit=${limit}`;
    }

    // Utiliser le service role key pour bypasser l'authentification JWT
    // On a déjà vérifié l'authentification avec le token du client
    const response = await fetch(supabaseUrl, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY || ""}`,
        "Content-Type": "application/json",
        "Prefer": searchParams.has("count") ? "count=exact" : "return=representation"
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Supabase error:", errorData);
      return NextResponse.json({ 
        success: false, 
        message: "Error fetching notifications",
        error: errorData
      }, { status: response.status });
    }

    // Si on veut juste le count
    if (searchParams.has("count")) {
      const countHeader = response.headers.get("content-range");
      const count = countHeader ? parseInt(countHeader.split("/")[1]) : 0;
      return NextResponse.json({ 
        success: true, 
        count: count
      }, { status: 200 });
    }

    const data = await response.json();

    return NextResponse.json({ 
      success: true, 
      data: data || [],
      count: Array.isArray(data) ? data.length : 0
    }, { status: 200 });

  } catch (error) {
    console.error("Proxy error (notifications):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const accessToken = request.headers.get("Authorization");

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    const lu = searchParams.get("lu");

    // Construire l'URL de l'API Supabase REST
    let supabaseUrl = `${SUPABASE_URL}/rest/v1/notifications?select=*`;
    
    if (user_id) {
      supabaseUrl += `&user_id=eq.${user_id}`;
    }
    
    if (lu !== null) {
      supabaseUrl += `&lu=eq.${lu === "true"}`;
    }

    // Utiliser le service role key pour bypasser l'authentification JWT
    const response = await fetch(supabaseUrl, {
      method: "HEAD",
      headers: {
        "apikey": SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY || "",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY || ""}`,
        "Content-Type": "application/json",
        "Prefer": "count=exact"
      }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        message: "Error counting notifications"
      }, { status: response.status });
    }

    const countHeader = response.headers.get("content-range");
    const count = countHeader ? parseInt(countHeader.split("/")[1]) : 0;

    return NextResponse.json({ 
      success: true, 
      count: count
    }, { status: 200 });

  } catch (error) {
    console.error("Proxy error (notifications HEAD):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.headers.get("Authorization");

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Les notifications sont gérées côté admin uniquement
    return NextResponse.json({ 
      success: false, 
      message: "Les notifications ne sont pas disponibles pour les partenaires" 
    }, { status: 403 });

  } catch (error) {
    console.error("Proxy error (notifications):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
