import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface SessionTokenPayload {
  email: string;
  name?: string;
  type: "session";
}

/**
 * Vérifie et décode un token de session
 * Compatible avec Edge Runtime (pas de dépendances Node.js)
 */
export function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionTokenPayload;
    if (decoded.type !== "session") {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

