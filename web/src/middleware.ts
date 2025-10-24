import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques qui ne nécessitent pas d'authentification
  const publicPaths = [
    "/login",
    "/login/verify",
    "/api/auth/send-magic-link",
    "/api/auth/verify-magic-link",
  ];

  // Vérifier si la route est publique
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Permettre l'accès aux assets statiques
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Si c'est une route publique, laisser passer
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Vérifier l'authentification
  const sessionCookie = request.cookies.get("session");

  if (!sessionCookie) {
    // Pas de session, rediriger vers login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Vérifier la validité du token
  const payload = await verifySessionToken(sessionCookie.value);

  if (!payload) {
    // Token invalide, supprimer le cookie et rediriger
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }

  // Token valide, laisser passer
  return NextResponse.next();
}

// Configuration du middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

