// Types partagés pour l'API INSEE
export type CompanyStatus = {
  siret: string;
  denomination?: string;
  estRadiee: boolean;
  dateCessation?: string | null;
  phone?: string;
  error?: string;
  // Propriétés BODACC
  procedure?: string;
  procedureType?: string;
  hasActiveProcedures?: boolean;
  bodaccError?: string;
};

export type SirenCheckInput = {
  sirets: string[];
  data?: Array<{ siret: string; phone?: string }>;
};

// Configuration API INSEE
const INSEE_TOKEN_URL = "https://api.insee.fr/token";
export const SIRENE_SIRET_URL = (siret: string) => `https://api.insee.fr/api-sirene/3.11/siret/${encodeURIComponent(siret)}`;

// Cache de token avec expiration
let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getInseeAccessToken(): Promise<string | null> {
  const clientId = process.env.SIRENE_KEY;
  const clientSecret = process.env.SIRENE_SECRET;
  
  if (!clientId || !clientSecret) return null;
  
  // Retourner le token en cache s'il est encore valide (avec un buffer de 5 minutes)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenCache.token;
  }
  
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope: "api_inseev3",
    });
    
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(INSEE_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    });
    
    if (!res.ok) {
      console.error(`Token request failed: ${res.status} ${res.statusText}`);
      return null;
    }
    
    const data = (await res.json()) as { 
      access_token?: string; 
      expires_in?: number;
      token_type?: string;
    };
    
    if (!data.access_token) return null;
    
    // Mettre en cache le token avec expiration (1 heure par défaut si non spécifié)
    const expiresIn = (data.expires_in || 3600) * 1000;
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + expiresIn
    };
    
    return data.access_token;
  } catch (error) {
    console.error("Error getting INSEE access token:", error);
    return null;
  }
}

// Fonction principale pour récupérer les données d'une entreprise via la clé d'intégration
export async function fetchWithIntegrationKey(siret: string, integrationKey: string, retryCount = 0): Promise<CompanyStatus> {
  const maxRetries = 3;
  
  try {
    const res = await fetch(SIRENE_SIRET_URL(siret), {
      method: "GET",
      headers: {
        "X-INSEE-Api-Key-Integration": integrationKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    
    if (res.status === 404) {
      // SIRET non trouvé - l'entreprise est probablement radiée ou n'a jamais existé
      console.log(`SIRET ${siret} NOT FOUND (404) - marking as RADIATED`);
      return { siret, estRadiee: true, error: "SIRET_NOT_FOUND" };
    }
    
    if (res.status === 429) {
      // Limite de taux dépassée - réessayer avec backoff exponentiel
      if (retryCount < maxRetries) {
        const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Rate limit hit for SIRET ${siret}, retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return fetchWithIntegrationKey(siret, integrationKey, retryCount + 1);
      } else {
        console.error(`Rate limit exceeded for SIRET ${siret} after ${maxRetries} retries`);
        return { siret, estRadiee: false, error: "RATE_LIMIT_EXCEEDED" };
      }
    }
    
    if (!res.ok) {
      console.error(`INSEE API error for SIRET ${siret}: ${res.status} ${res.statusText}`);
      return { siret, estRadiee: false, error: `HTTP_${res.status}` };
    }
    
    const json = (await res.json()) as Record<string, unknown>;
    const etablissement = json?.etablissement ?? json?.uniteLegale ?? json;
    
    if (!etablissement) {
      return { siret, estRadiee: false, error: "INVALID_RESPONSE" };
    }
    
    // Log de la réponse complète pour le débogage
    console.log(`DEBUG SIRET ${siret} - Full response:`, JSON.stringify(json, null, 2));
    
    const denomination = etablissement?.uniteLegale?.denominationUniteLegale
      ?? etablissement?.uniteLegale?.nomUniteLegale
      ?? etablissement?.denominationUniteLegale
      ?? undefined;
      
    const dateCessation = etablissement?.dateCessation 
      ?? etablissement?.periodesEtablissement?.[0]?.dateFin
      ?? null;
      
    // Vérifier d'autres indicateurs de cessation
    const statutDiffusionEtablissement = etablissement?.statutDiffusionEtablissement;
    const etatAdministratifEtablissement = etablissement?.etatAdministratifEtablissement;
    const etatAdministratifUniteLegale = etablissement?.uniteLegale?.etatAdministratifUniteLegale;
    
    console.log(`DEBUG SIRET ${siret}:`, {
      dateCessation,
      statutDiffusionEtablissement,
      etatAdministratifEtablissement,
      etatAdministratifUniteLegale,
      periodesEtablissement: etablissement?.periodesEtablissement,
      periodesUniteLegale: etablissement?.uniteLegale?.periodesUniteLegale
    });
      
    // L'entreprise est radiée si :
    // 1. Elle a une date de cessation
    // 2. etatAdministratifEtablissement est 'F' (Fermé)
    // 3. etatAdministratifUniteLegale est 'C' (Cessée)
    const estRadiee = Boolean(dateCessation) 
      || etatAdministratifEtablissement === 'F' 
      || etatAdministratifUniteLegale === 'C';
    
    // Log pour le débogage
    if (estRadiee) {
      console.log(`SIRET ${siret} is RADIATED - cessation date: ${dateCessation}, etat: ${etatAdministratifEtablissement}`);
    }
    
    return { siret, denomination, estRadiee, dateCessation };
  } catch (e: unknown) {
    console.error(`Network error for SIRET ${siret}:`, e);
    return { siret, estRadiee: false, error: `NETWORK_ERROR: ${e?.message ?? "unknown"}` };
  }
}

// Fonction pour nettoyer et valider les SIRETs
export function cleanSirets(sirets: string[]): string[] {
  return Array.from(
    new Set(
      sirets
        .map((s) => (typeof s === "string" ? s.replace(/[^0-9]/g, "").trim() : ""))
        .filter(Boolean)
        .filter(siret => siret.length === 14) // Validation SIRET
    )
  );
}

// Configuration des limites de taux pour l'API INSEE
export const INSEE_RATE_LIMITS = {
  maxRequestsPerMinute: 25, // Limite conservatrice (INSEE permet 30/min)
  delayBetweenRequests: (60 * 1000) / 25 // ~2.4 secondes par requête
};
