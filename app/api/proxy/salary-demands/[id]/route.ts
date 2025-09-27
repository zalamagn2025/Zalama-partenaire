import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/partner-salary-demands";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = request.headers.get("Authorization");
    const { id: demandId } = await params;
    
    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!demandId) {
      return NextResponse.json({ success: false, message: "Demand ID is required" }, { status: 400 });
    }

    const body = await request.json();
    console.log("🔄 Proxy Salary Demands PUT [id] - ID:", demandId, "Body:", body);

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
      console.error("Error from Edge Function (salary-demands PUT [id]):", data);
      return NextResponse.json({ 
        success: false, 
        message: data.message || "Error updating salary demand from Edge Function", 
        details: data 
      }, { status: response.status });
    }

    console.log("✅ Proxy Salary Demands PUT [id] - Response:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error (salary-demands PUT [id]):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
