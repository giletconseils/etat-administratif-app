import { NextRequest, NextResponse } from "next/server";
import {
  verifyMagicToken,
  generateSessionToken,
  isEmailAuthorized,
} from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=missing-token", request.url)
    );
  }

  // Vérification du token
  const payload = verifyMagicToken(token);
  if (!payload) {
    return NextResponse.redirect(
      new URL("/login?error=invalid-token", request.url)
    );
  }

  // Double vérification que l'email est toujours autorisé
  const authorized = await isEmailAuthorized(payload.email);
  if (!authorized) {
    return NextResponse.redirect(
      new URL("/login?error=unauthorized", request.url)
    );
  }

  // Génération du token de session
  const sessionToken = await generateSessionToken(payload.email);

  // Création de la réponse avec redirection
  const response = NextResponse.redirect(new URL("/", request.url));

  // Configuration du cookie de session
  response.cookies.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 jours
    path: "/",
  });

  return response;
}

