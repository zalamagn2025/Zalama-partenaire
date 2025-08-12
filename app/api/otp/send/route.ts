import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { emailService } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Vérifier si l'utilisateur existe
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("active", true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé ou inactif" },
        { status: 404 }
      );
    }

    // Générer un OTP à 6 chiffres
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Afficher l'OTP dans la console du serveur pour le débogage
    console.log("🔐 OTP généré:", otp);
    console.log("📧 Email:", email);
    console.log("⏰ Expire à:", expiresAt.toISOString());

    // Supprimer les anciens OTP pour cet email
    await supabase.from("otp_sessions").delete().eq("email", email);

    // Créer une nouvelle session OTP
    const { error: insertError } = await supabase.from("otp_sessions").insert({
      email,
      otp,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    if (insertError) {
      console.error("Erreur création session OTP:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création du code" },
        { status: 500 }
      );
    }

    // Envoyer l'OTP par email via le service d'email
    const emailSent = await emailService.sendOTPEmail(
      email,
      otp,
      adminUser.display_name
    );

    if (!emailSent) {
      console.error("Échec envoi email OTP");
      // On continue quand même car l'OTP est affiché dans la console
    } else {
      console.log("Email OTP envoyé avec succès");
    }

    // Envoyer par SMS si le numéro est fourni
    if (
      phone &&
      process.env.NIMBA_SMS_SERVICE_ID &&
      process.env.NIMBA_SMS_SECRET_TOKEN
    ) {
      try {
        const { Client } = require("nimbasms");
        const client = new Client({
          SERVICE_ID: process.env.NIMBA_SMS_SERVICE_ID,
          SECRET_TOKEN: process.env.NIMBA_SMS_SECRET_TOKEN,
        });

        const messageBody = {
          to: [phone],
          message: `Votre code de vérification Partner est: ${otp}. Valide 2 minutes.`,
          sender_name: process.env.NIMBASMS_SENDER_NAME || "Partner",
        };

        await client.messages.create(messageBody);
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
    console.error("Erreur API OTP:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
