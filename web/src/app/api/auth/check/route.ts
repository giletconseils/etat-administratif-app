import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("session");

  if (!sessionCookie) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  const payload = verifySessionToken(sessionCookie.value);

  if (!payload) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    email: payload.email,
    name: payload.name,
  });
}

