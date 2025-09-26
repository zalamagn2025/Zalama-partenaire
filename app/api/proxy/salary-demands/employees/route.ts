import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/partner-salary-demands/employees";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get("Authorization");
    
    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Proxy Salary Demands Employees - URL:", SUPABASE_FUNCTION_URL);

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": accessToken,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from Edge Function (salary-demands employees):", data);
      return NextResponse.json({ 
        success: false, 
        message: data.message || "Error fetching employees from Edge Function", 
        details: data 
      }, { status: response.status });
    }

    console.log("✅ Proxy Salary Demands Employees - Response:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error (salary-demands employees):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
