import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Resend } from "resend";
import { Client } from "nimbasms";

// Configuration des services
const resend = new Resend(process.env.RESEND_API_KEY);
const nimbasmsClient = new Client({
  SERVICE_ID: process.env.NIMBA_SMS_SERVICE_ID || "",
  SECRET_TOKEN: process.env.NIMBA_SMS_SECRET_TOKEN || "",
});

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();
    const supabase = await createServerSupabaseClient();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
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

    // Générer un OTP à 6 chiffres
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Supprimer les anciens OTP pour cet email
    await supabase.from("otp_sessions").delete().eq("email", email);

    // Créer une nouvelle session OTP
    const { data: otpSession, error: otpError } = await supabase
      .from("otp_sessions")
      .insert({
        email,
        otp,
        expires_at: expiresAt.toISOString(),
        used: false,
      })
      .select()
      .single();

    if (otpError) {
      console.error("Erreur création OTP:", otpError);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'OTP" },
        { status: 500 }
      );
    }

    // Envoyer l'OTP par email
    try {
      await resend.emails.send({
        from: "Partner <noreply@partner.com>",
        to: [email],
        subject: "Code de vérification - Partner",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Code de vérification</h2>
            <p>Bonjour,</p>
            <p>Votre code de vérification est :</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>Ce code est valide pendant 2 minutes.</p>
            <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
            <p>Cordialement,<br>L'équipe Partner</p>
          </div>
        `,
      });
      console.log("Email OTP envoyé à:", email);
    } catch (emailError) {
      console.error("Erreur envoi email OTP:", emailError);
    }

    // Envoyer l'OTP par SMS si un numéro de téléphone est fourni
    if (phone) {
      try {
        await nimbasmsClient.messages.create({
          to: [phone],
          message: `Votre code de vérification Partner est: ${otp}. Valide 2 minutes.`,
          sender_name: "Partner",
        });
        console.log("SMS OTP envoyé à:", phone);
      } catch (smsError) {
        console.error("Erreur envoi SMS OTP:", smsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Code de vérification envoyé",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Erreur API OTP send:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
