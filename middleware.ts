import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// MIDDLEWARE TEMPORAIREMENT DÉSACTIVÉ POUR TEST
export async function middleware(request: NextRequest) {
  // Laisser passer toutes les requêtes sans vérification
  console.log(`Middleware bypassed for: ${request.nextUrl.pathname}`)
  return NextResponse.next()
}

// Configuration pour le middleware (réduite au minimum)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|api).*)',
  ],
}

/*
// ANCIEN CODE DE MIDDLEWARE (COMMENTÉ)
// Routes qui ne nécessitent pas d'authentification
const publicRoutes = ['/login', '/', '/test-setup']

// Routes statiques à ignorer
const staticRoutes = ['/_next', '/api', '/images', '/fonts', '/favicon.ico', '/file.svg', '/globe.svg', '/next.svg', '/vercel.svg', '/window.svg']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Ignorer les routes statiques et les fichiers
  if (staticRoutes.some(route => pathname.startsWith(route)) || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Créer une réponse pour pouvoir modifier les headers
  const res = NextResponse.next()
  
  // Créer le client Supabase
  const supabase = createMiddlewareClient({ req: request, res })
  
  try {
    // Récupérer la session actuelle
    const { data: { session } } = await supabase.auth.getSession()
    const isAuthenticated = !!session?.user
    
    console.log(`Middleware - Path: ${pathname}, Authenticated: ${isAuthenticated}, User: ${session?.user?.id}`)
    
    // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      console.log('Redirecting to login - no session')
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Si l'utilisateur est connecté, vérifier son profil admin (mais seulement pour les routes protégées)
    if (isAuthenticated && !publicRoutes.includes(pathname)) {
      try {
        // Vérifier d'abord le localStorage pour éviter les requêtes inutiles
        const storedSession = request.cookies.get('zalama_session')?.value
        let hasValidProfile = false
        
        if (storedSession) {
          try {
            const parsed = JSON.parse(decodeURIComponent(storedSession))
            hasValidProfile = parsed.admin && parsed.partner
            console.log('Found stored session in cookies:', hasValidProfile)
          } catch (e) {
            console.log('Invalid stored session in cookies')
          }
        }
        
        // Si pas de session stockée valide, vérifier en base
        if (!hasValidProfile) {
          const { data: adminUser, error } = await supabase
            .from('admin_users')
            .select('id, role, active, partenaire_id')
            .eq('id', session.user.id)
            .eq('active', true)
            .single()
          
          // Si pas de profil admin ou rôle non autorisé, déconnecter
          if (error || !adminUser || !['rh', 'responsable'].includes(adminUser.role.toLowerCase())) {
            console.log('Invalid admin profile, signing out:', error?.message || 'Invalid role')
            await supabase.auth.signOut()
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
          }
          
          // Vérifier que le partenaire existe et est actif
          if (adminUser.partenaire_id) {
            const { data: partner, error: partnerError } = await supabase
              .from('partners')
              .select('actif')
              .eq('id', adminUser.partenaire_id)
              .single()
            
            if (partnerError || !partner?.actif) {
              console.log('Invalid partner, signing out:', partnerError?.message || 'Inactive partner')
              await supabase.auth.signOut()
              const url = request.nextUrl.clone()
              url.pathname = '/login'
              return NextResponse.redirect(url)
            }
          }
        }
        
      } catch (profileError) {
        console.error('Error checking profile in middleware:', profileError)
        // En cas d'erreur de vérification, permettre l'accès et laisser l'app gérer
        // Ne pas rediriger automatiquement pour éviter les boucles
      }
    }

    // Si l'utilisateur est déjà connecté et essaie d'accéder à la page de login
    if (isAuthenticated && pathname === '/login') {
      console.log('Redirecting authenticated user to dashboard')
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return res
    
  } catch (error) {
    console.error('Error in middleware:', error)
    // En cas d'erreur, permettre l'accès aux routes publiques seulement
    if (!publicRoutes.includes(pathname)) {
      console.log('Middleware error, redirecting to login')
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return res
  }
}
*/
