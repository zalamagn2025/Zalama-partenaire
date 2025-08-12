import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Vérifier si l'utilisateur existe dans admin_users
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

    // Vérifier les identifiants avec Supabase Auth (sans créer de session)
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return NextResponse.json(
        { error: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Erreur lors de la vérification" },
        { status: 500 }
      );
    }

    // Déconnecter immédiatement pour éviter de créer une session
    await supabase.auth.signOut();

    // Retourner les informations de l'utilisateur sans créer de session
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        display_name: adminUser.display_name,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Erreur vérification identifiants:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
