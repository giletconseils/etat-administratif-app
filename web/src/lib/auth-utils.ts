import { promises as fs } from "fs";
import path from "path";
import Papa from "papaparse";
import jwt from "jsonwebtoken";

// Réexporter les fonctions Edge-compatible
export { verifySessionToken, type SessionTokenPayload } from "./auth-edge";

const AUTHORIZED_EMAILS_PATH = path.join(
  process.cwd(),
  "../data/csv-files/config/authorized-emails.csv"
);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const MAGIC_LINK_EXPIRY: string | number = process.env.MAGIC_LINK_EXPIRY || "15m";
const SESSION_EXPIRY: string | number = "7d";

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
export function generateMagicToken(email: string): string {
  const payload: MagicTokenPayload = {
    email: email.toLowerCase().trim(),
    type: "magic",
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = { expiresIn: MAGIC_LINK_EXPIRY };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Vérifie et décode un token de magic link
 */
export function verifyMagicToken(token: string): MagicTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as MagicTokenPayload;
    if (decoded.type !== "magic") {
      return null;
    }
    return decoded;
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
  const payload = {
    email: email.toLowerCase().trim(),
    name,
    type: "session" as const,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = { expiresIn: SESSION_EXPIRY };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Valide le format d'un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

