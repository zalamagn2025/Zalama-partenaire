import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Créer un client Supabase côté serveur avec les bonnes clés
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.headers.get("Authorization");
    const { searchParams } = new URL(request.url);

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Extraire les paramètres
    const user_id = searchParams.get("user_id");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");

    if (!user_id) {
      return NextResponse.json({ success: false, message: "user_id is required" }, { status: 400 });
    }

    // Construire la requête Supabase
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)
      .order('date_creation', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ 
        success: false, 
        message: error.message || "Error fetching notifications",
        details: error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: notifications || [],
      count: notifications?.length || 0
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
    const body = await request.json();

    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { action, notificationId, userId } = body;

    if (action === 'markAsRead' && notificationId) {
      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('id', notificationId);

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ 
          success: false, 
          message: error.message || "Error updating notification",
          details: error 
        }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === 'markAllAsRead' && userId) {
      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('user_id', userId)
        .eq('lu', false);

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ 
          success: false, 
          message: error.message || "Error updating notifications",
          details: error 
        }, { status: 500 });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Proxy error (notifications):", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
