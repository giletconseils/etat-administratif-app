import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import Papa from "papaparse";

const METIERS_PATH = path.join(
  process.cwd(),
  "../data/csv-files/config/metier.csv"
);

export async function GET() {
  try {
    const content = await fs.readFile(METIERS_PATH, "utf-8");
    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    });

    const metiers = parsed.data
      .map((row) => ({
        id: parseInt(row.id || "0", 10),
        name: row.name || "",
      }))
      .filter((m) => m.id > 0); // Exclure "Sélectionnez un métier" avec id=0

    return NextResponse.json({
      success: true,
      metiers,
    });
  } catch (error) {
    console.error("Error loading metiers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de charger les métiers",
      },
      { status: 500 }
    );
  }
}

