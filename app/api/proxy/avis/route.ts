import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Créer un client Supabase côté serveur avec les bonnes clés
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    try {
      // Essayer d'abord l'edge fonction
      const response = await fetch(edgeFunctionUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Proxy Avis - Edge Function Response:', {
          success: data.success,
          avisCount: data.data?.avis?.length || 0,
          pagination: data.data?.pagination,
          filters: data.data?.filters
        });
        return NextResponse.json(data);
      } else {
        console.log('⚠️ Edge Function failed, trying direct Supabase...');
        throw new Error(`Edge Function failed: ${response.status}`);
      }
    } catch (edgeError) {
      console.log('⚠️ Edge Function error, falling back to direct Supabase:', edgeError);
      
      // Fallback: utiliser directement Supabase
      const { data: avis, error } = await supabase
        .from('avis')
        .select(`
          *,
          employee:employee_id (
            id,
            nom,
            prenom,
            poste,
            email,
            telephone,
            photo_url
          )
        `)
        .order('date_avis', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Supabase error:', error);
        return NextResponse.json(
          { 
            success: false, 
            message: error.message || "Error fetching avis",
            details: error 
          },
          { status: 500 }
        );
      }

      console.log('✅ Proxy Avis - Supabase Fallback:', avis?.length || 0, 'avis');
      return NextResponse.json({
        success: true,
        data: {
          avis: avis || [],
          pagination: {
            total: avis?.length || 0,
            page: 1,
            limit: 50
          }
        }
      });
    }

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