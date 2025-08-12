import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Récupérer le dernier OTP non utilisé
    const { data: otpSessions, error } = await supabase
      .from("otp_sessions")
      .select("*")
      .eq("email", email)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Erreur récupération OTP:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération de l'OTP" },
        { status: 500 }
      );
    }

    if (!otpSessions || otpSessions.length === 0) {
      return NextResponse.json({ error: "Aucun OTP trouvé" }, { status: 404 });
    }

    const latestOTP = otpSessions[0];
    const now = new Date();
    const expiresAt = new Date(latestOTP.expires_at);
    const isExpired = now > expiresAt;

    if (isExpired) {
      return NextResponse.json({ error: "OTP expiré" }, { status: 410 });
    }

    return NextResponse.json({
      otp: latestOTP.otp,
      expiresAt: latestOTP.expires_at,
      createdAt: latestOTP.created_at,
    });
  } catch (error) {
    console.error("Erreur API get-latest OTP:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
