import { promises as fs } from "fs";
import path from "path";
import Papa from "papaparse";
import { SignJWT, jwtVerify } from "jose";

// Réexporter les fonctions Edge-compatible
export { verifySessionToken, type SessionTokenPayload } from "./auth-edge";

const AUTHORIZED_EMAILS_PATH = path.join(
  process.cwd(),
  "../data/csv-files/config/authorized-emails.csv"
);

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);
const MAGIC_LINK_EXPIRY = process.env.MAGIC_LINK_EXPIRY || "15m";
const SESSION_EXPIRY = "7d";

export interface AuthorizedEmail {
  email: string;
  name?: string;
}

export interface MagicTokenPayload {
  email: string;
  type: "magic";
}

/**
 * Charge la liste des emails autorisés depuis le CSV
 */
export async function loadAuthorizedEmails(): Promise<AuthorizedEmail[]> {
  try {
    const content = await fs.readFile(AUTHORIZED_EMAILS_PATH, "utf-8");
    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    });

    return parsed.data.map((row) => ({
      email: row.email?.toLowerCase().trim() || "",
      name: row.name?.trim(),
    }));
  } catch (error) {
    console.error("Error loading authorized emails:", error);
    return [];
  }
}

/**
 * Vérifie si un email est autorisé
 */
export async function isEmailAuthorized(email: string): Promise<boolean> {
  const authorizedEmails = await loadAuthorizedEmails();
  const normalizedEmail = email.toLowerCase().trim();
  return authorizedEmails.some((ae) => ae.email === normalizedEmail);
}

/**
 * Récupère le nom associé à un email autorisé
 */
export async function getNameForEmail(email: string): Promise<string | undefined> {
  const authorizedEmails = await loadAuthorizedEmails();
  const normalizedEmail = email.toLowerCase().trim();
  const found = authorizedEmails.find((ae) => ae.email === normalizedEmail);
  return found?.name;
}

/**
 * Génère un token JWT pour le magic link (courte durée)
 */
export async function generateMagicToken(email: string): Promise<string> {
  const token = await new SignJWT({
    email: email.toLowerCase().trim(),
    type: "magic",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(MAGIC_LINK_EXPIRY)
    .setIssuedAt()
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Vérifie et décode un token de magic link
 */
export async function verifyMagicToken(token: string): Promise<MagicTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.type !== "magic") {
      return null;
    }
    
    return payload as unknown as MagicTokenPayload;
  } catch (error) {
    console.error("Error verifying magic token:", error);
    return null;
  }
}

/**
 * Génère un token JWT de session (longue durée)
 */
export async function generateSessionToken(email: string): Promise<string> {
  const name = await getNameForEmail(email);
  
  const token = await new SignJWT({
    email: email.toLowerCase().trim(),
    name,
    type: "session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(SESSION_EXPIRY)
    .setIssuedAt()
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Valide le format d'un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

