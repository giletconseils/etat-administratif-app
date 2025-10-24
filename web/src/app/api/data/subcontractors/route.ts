import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

const SUBCONTRACTORS_PATH = path.join(
  process.cwd(),
  "../data/csv-files/base-sous-traitants/sous-traitants.csv"
);

interface SubcontractorRow {
  name?: string;
  siret?: string;
  email?: string;
  [key: string]: string | undefined;
}

interface SubcontractorResult {
  name: string;
  siret: string;
  score?: number; // Score de pertinence (plus bas = meilleur)
}

// Fonction pour normaliser les accents et caractères spéciaux
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9\s]/g, ""); // Garde uniquement les alphanumériques
}

// Calcule la distance de Levenshtein entre deux chaînes
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Optimisation : si une chaîne est vide
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  
  // Matrice de distances
  const matrix: number[][] = [];
  
  // Initialisation de la première ligne et colonne
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Calcul des distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Suppression
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  
  return matrix[len1][len2];
}

// Vérifie si un mot de la requête matche un mot du nom avec tolérance
function wordMatchesWithTolerance(queryWord: string, nameWord: string): boolean {
  // Match exact
  if (nameWord === queryWord) return true;
  
  // Si le mot commence par le mot recherché (ex: "Biterr" match "Biterroise")
  if (nameWord.startsWith(queryWord)) return true;
  
  // Tolérance Levenshtein : 1 pour mots courts, 2 pour mots longs
  const threshold = queryWord.length <= 5 ? 1 : 2;
  const distance = levenshteinDistance(queryWord, nameWord);
  
  return distance <= threshold;
}

// Calcule un score de pertinence pour le nom
function calculateNameScore(queryWords: string[], nameWords: string[]): number | null {
  let totalDistance = 0;
  let matchedWords = 0;
  
  for (const queryWord of queryWords) {
    let bestMatch = Infinity;
    
    for (const nameWord of nameWords) {
      if (wordMatchesWithTolerance(queryWord, nameWord)) {
        const distance = levenshteinDistance(queryWord, nameWord);
        bestMatch = Math.min(bestMatch, distance);
      }
    }
    
    // Si aucun mot ne matche, ce n'est pas une correspondance valide
    if (bestMatch === Infinity) return null;
    
    totalDistance += bestMatch;
    matchedWords++;
  }
  
  // Score = distance moyenne (plus bas = meilleur)
  return matchedWords > 0 ? totalDistance / matchedWords : null;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Lire le fichier CSV
    const content = await fs.readFile(SUBCONTRACTORS_PATH, "utf-8");
    const parsed = Papa.parse<SubcontractorRow>(content, {
      header: true,
      skipEmptyLines: true,
    });

    const normalizedQuery = normalizeString(query);
    const queryDigits = query.replace(/[^0-9]/g, "");
    
    // Décomposer la requête en mots pour la recherche de nom
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);

    // Filtrer les résultats avec scoring
    const results: SubcontractorResult[] = [];
    const seenSirets = new Set<string>();

    for (const row of parsed.data) {
      // Ignorer les lignes sans nom ou sans SIRET
      if (!row.name || !row.siret) continue;

      // Éviter les doublons de SIRET
      if (seenSirets.has(row.siret)) continue;

      const normalizedName = normalizeString(row.name);
      const normalizedSiret = row.siret.replace(/[^0-9]/g, "");
      const normalizedEmail = row.email ? normalizeString(row.email) : "";
      const nameWords = normalizedName.split(/\s+/).filter(w => w.length > 0);

      let matchType: "siret-exact" | "siret-prefix" | "name" | "email" | null = null;
      let score = Infinity;

      // 1. Recherche SIRET (≥9 chiffres pour être fiable)
      if (queryDigits.length >= 9) {
        // Correspondance exacte (priorité maximale)
        if (normalizedSiret === queryDigits) {
          matchType = "siret-exact";
          score = 0;
        }
        // Correspondance par début (si pas de match exact)
        else if (normalizedSiret.startsWith(queryDigits)) {
          matchType = "siret-prefix";
          score = 0.5;
        }
      }

      // 2. Recherche par nom (si pas de match SIRET)
      if (matchType === null && queryWords.length > 0) {
        const nameScore = calculateNameScore(queryWords, nameWords);
        if (nameScore !== null) {
          matchType = "name";
          score = 1 + nameScore; // Offset pour prioriser SIRET
        }
      }

      // 3. Recherche par email (fallback)
      if (matchType === null && normalizedEmail.includes(normalizedQuery)) {
        matchType = "email";
        score = 100; // Score élevé car moins prioritaire
      }

      // Si match trouvé, ajouter aux résultats
      if (matchType !== null) {
        results.push({
          name: row.name,
          siret: normalizedSiret,
          score,
        });
        seenSirets.add(row.siret);
      }
    }

    // Trier par score (meilleur score = plus petite valeur)
    results.sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity));

    // Limiter à 15 résultats
    const limitedResults = results.slice(0, 15);

    // Retirer le score des résultats finaux
    const finalResults = limitedResults.map(({ name, siret }) => ({ name, siret }));

    return NextResponse.json({ results: finalResults });
  } catch (error) {
    console.error("Error searching subcontractors:", error);
    return NextResponse.json(
      {
        error: "Failed to search subcontractors",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

