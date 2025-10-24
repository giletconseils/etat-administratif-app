import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface SessionTokenPayload {
  email: string;
  name?: string;
  type: "session";
}

/**
 * Vérifie et décode un token de session
 * Compatible avec Edge Runtime (utilise jose au lieu de jsonwebtoken)
 */
export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.type !== "session") {
      return null;
    }
    
    return payload as unknown as SessionTokenPayload;
  } catch (error) {
    return null;
  }
}

