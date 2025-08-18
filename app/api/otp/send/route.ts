// FONCTIONNALITÉ OTP TEMPORAIREMENT DÉSACTIVÉE
// Cette fonctionnalité a été mise de côté pour le moment

/*
// FONCTIONNALITÉ OTP TEMPORAIREMENT DÉSACTIVÉE
// Cette fonctionnalité a été mise de côté pour le moment

import { NextRequest, NextResponse } from "next/server";

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

    // Vérifier s'il existe déjà un OTP valide récent (moins de 30 secondes)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const { data: existingOTP } = await supabase
      .from("otp_sessions")
      .select("*")
      .eq("email", email)
      .gt("created_at", thirtySecondsAgo.toISOString())
      .eq("used", false)
      .single();

    if (existingOTP) {
      console.log("⚠️ OTP déjà envoyé récemment pour:", email);
      return NextResponse.json({
        success: true,
        message: "Code de vérification déjà envoyé récemment",
        warning: "Un code a déjà été envoyé dans les 30 dernières secondes",
      });
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
    console.error("Erreur lors de l'envoi de l'OTP:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
*/

// Fonction temporaire qui retourne une erreur de fonctionnalité désactivée
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Fonctionnalité OTP temporairement désactivée",
      message: "Cette fonctionnalité a été mise de côté pour le moment",
    },
    { status: 503 }
  );
}
