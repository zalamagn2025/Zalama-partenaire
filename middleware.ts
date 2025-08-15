import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const authRoutes = ["/login"];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Pour les routes protégées, on laisse passer et on gère l'authentification côté client
  // car notre système utilise le localStorage qui n'est pas accessible côté serveur
  if (isProtectedRoute) {
    return NextResponse.next();
  }

  // Pour les routes d'authentification, on laisse passer aussi
  if (isAuthRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
