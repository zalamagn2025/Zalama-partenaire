import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/partner-salary-demands";

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
      status: searchParams.get('status'),
      employe_id: searchParams.get('employe_id'),
      type_motif: searchParams.get('type_motif'),
      date_debut: searchParams.get('date_debut'),
      date_fin: searchParams.get('date_fin'),
      categorie: searchParams.get('categorie'),
      statut_remboursement: searchParams.get('statut_remboursement'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset')
    };

    // Construire l'URL avec les paramètres
    let url = SUPABASE_FUNCTION_URL;
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    if (params.toString()) {
      url += '?' + params.toString();
    }

    console.log("🔄 Proxy Salary Demands - URL:", url);
    console.log("🔄 Proxy Salary Demands - Filters:", filters);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from Edge Function (salary-demands):", data);
      return NextResponse.json({ 
        success: false, 
        message: data.message || "Error fetching salary demands from Edge Function", 
        details: data 
      }, { status: response.status });
    }

    console.log("✅ Proxy Salary Demands - Response:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error (salary-demands):", error);
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

    const body = await request.json();
    console.log("🔄 Proxy Salary Demands POST - Body:", body);

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from Edge Function (salary-demands POST):", data);
      return NextResponse.json({ 
        success: false, 
        message: data.message || "Error creating salary demand from Edge Function", 
        details: data 
      }, { status: response.status });
    }

    console.log("✅ Proxy Salary Demands POST - Response:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error (salary-demands POST):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const accessToken = request.headers.get("Authorization");
    const { searchParams } = new URL(request.url);
    const demandId = searchParams.get('id');
    
    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!demandId) {
      return NextResponse.json({ success: false, message: "Demand ID is required" }, { status: 400 });
    }

    const body = await request.json();
    console.log("🔄 Proxy Salary Demands PUT - ID:", demandId, "Body:", body);

    const response = await fetch(`${SUPABASE_FUNCTION_URL}/${demandId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from Edge Function (salary-demands PUT):", data);
      return NextResponse.json({ 
        success: false, 
        message: data.message || "Error updating salary demand from Edge Function", 
        details: data 
      }, { status: response.status });
    }

    console.log("✅ Proxy Salary Demands PUT - Response:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error (salary-demands PUT):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

