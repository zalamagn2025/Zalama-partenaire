import { NextRequest, NextResponse } from 'next/server';

// Utiliser l'edge fonction partner-employee-avis pour la liste des employés
const EDGE_FUNCTION_URL = 'https://mspmrzlqhwpdkkburjiw.supabase.co/functions/v1/partner-employee-avis/employees-list';

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token d'authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Token d\'authentification manquant' },
        { status: 401 }
      );
    }

    // Appeler l'edge fonction pour récupérer la liste des employés
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur Edge Function Employees List:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          message: `Erreur Edge Function: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Proxy Employees List - Response:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur proxy avis employees-list:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur interne du serveur',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
