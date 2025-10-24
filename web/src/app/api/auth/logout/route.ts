import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  // Suppression du cookie de session
  response.cookies.delete("session");

  return response;
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  // Suppression du cookie de session
  response.cookies.delete("session");

  return response;
}

