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
}

// Fonction pour normaliser les accents et caractères spéciaux
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .replace(/[^a-z0-9\s]/g, ""); // Garde uniquement les alphanumériques
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

    // Filtrer les résultats
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

      // Rechercher dans le nom, le SIRET ou l'email
      const matchesName = normalizedName.includes(normalizedQuery);
      const matchesSiret = normalizedSiret.includes(query.replace(/[^0-9]/g, ""));
      const matchesEmail = normalizedEmail.includes(normalizedQuery);

      if (matchesName || matchesSiret || matchesEmail) {
        results.push({
          name: row.name,
          siret: normalizedSiret,
        });
        seenSirets.add(row.siret);

        // Limiter à 15 résultats pour la performance
        if (results.length >= 15) break;
      }
    }

    return NextResponse.json({ results });
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

