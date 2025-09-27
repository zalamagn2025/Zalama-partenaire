import { NextRequest, NextResponse } from 'next/server';

// Utiliser l'edge fonction partner-employee-avis pour les statistiques
const EDGE_FUNCTION_URL = 'https://mspmrzlqhwpdkkburjiw.supabase.co/functions/v1/partner-employee-avis/statistics';

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

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();

    // Ajouter tous les paramètres de filtrage disponibles pour les statistiques
    const filters = [
      'mois',
      'annee', 
      'note',
      'type_retour',
      'approuve',
      'employee_id',
      'date_debut',
      'date_fin'
    ];

    filters.forEach(filter => {
      const value = searchParams.get(filter);
      if (value !== null) {
        queryParams.append(filter, value);
      }
    });

    // Construire l'URL avec les paramètres
    const edgeFunctionUrl = queryParams.toString() 
      ? `${EDGE_FUNCTION_URL}?${queryParams.toString()}`
      : EDGE_FUNCTION_URL;

    console.log('🔄 Proxy Statistics - URL:', edgeFunctionUrl);

    // Appeler l'edge fonction
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur Edge Function Statistics:', response.status, errorText);
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
    console.log('✅ Proxy Statistics - Response:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur proxy avis statistics:', error);
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
