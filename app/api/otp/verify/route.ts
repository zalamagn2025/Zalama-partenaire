import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    const supabase = await createServerSupabaseClient();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email et code OTP requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("active", true)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé ou inactif" },
        { status: 404 }
      );
    }

    // Récupérer la session OTP
    const { data: otpSession, error: otpError } = await supabase
      .from("otp_sessions")
      .select("*")
      .eq("email", email)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpSession) {
      return NextResponse.json(
        { error: "Aucun code de vérification trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si l'OTP a expiré
    const now = new Date();
    const expiresAt = new Date(otpSession.expires_at);

    if (now > expiresAt) {
      // Supprimer l'OTP expiré
      await supabase.from("otp_sessions").delete().eq("id", otpSession.id);

      return NextResponse.json(
        { error: "Code de vérification expiré" },
        { status: 400 }
      );
    }

    // Vérifier si l'OTP correspond
    if (otpSession.otp !== otp) {
      return NextResponse.json(
        { error: "Code de vérification incorrect" },
        { status: 400 }
      );
    }

    // Marquer l'OTP comme utilisé
    await supabase
      .from("otp_sessions")
      .update({
        used: true,
        used_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", otpSession.id);

    // Créer une session temporaire pour l'authentification
    const tempSession = {
      email,
      otpVerified: true,
      verifiedAt: now.toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Code de vérification validé",
      session: tempSession,
    });
  } catch (error) {
    console.error("Erreur API OTP verify:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
