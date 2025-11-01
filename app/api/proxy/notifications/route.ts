import { NextRequest, NextResponse } from "next/server";

// Route proxy vers les Edge Functions - Pas d'utilisation directe de Supabase
// Les partenaires n'ont pas accès aux notifications admin
// Cette route retourne une liste vide pour compatibilité

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get("Authorization");

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Les notifications sont gérées côté admin uniquement
    // Retourner une réponse vide pour les partenaires
    return NextResponse.json({ 
      success: true, 
      data: [],
      count: 0,
      message: "Les notifications ne sont pas disponibles pour les partenaires"
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
