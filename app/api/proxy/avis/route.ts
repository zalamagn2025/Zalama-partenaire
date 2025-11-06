import { NextRequest, NextResponse } from 'next/server';

// Utiliser l'edge fonction partner-employee-avis qui contient les avis
const EDGE_FUNCTION_URL = 'https://mspmrzlqhwpdkkburjiw.supabase.co/functions/v1/partner-employee-avis';

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

    // Ajouter tous les paramètres de filtrage disponibles
    const filters = [
      'mois',
      'annee', 
      'note',
      'type_retour',
      'approuve',
      'employee_id',
      'date_debut',
      'date_fin',
      'limit',
      'offset'
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

    console.log('🔄 Proxy Avis - URL:', edgeFunctionUrl);
    console.log('🔄 Proxy Avis - Params:', Object.fromEntries(queryParams.entries()));

    // Appeler l'Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    console.log('✅ Proxy Avis - Edge Function Response:', {
      success: data.success,
      avisCount: data.data?.avis?.length || 0,
      pagination: data.data?.pagination,
      filters: data.data?.filters
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || `Edge Function failed: ${response.status}`,
          error: data.error
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Erreur proxy avis:', error);
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