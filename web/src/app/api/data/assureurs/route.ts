import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import Papa from "papaparse";

export const dynamic = "force-dynamic";

const ASSUREURS_PATH = path.join(
  process.cwd(),
  "../data/csv-files/assureurs/assureurs.csv"
);

interface Assureur {
  id: number;
  name: string;
  ri_percentage: number;
}

export async function GET() {
  try {
    const content = await fs.readFile(ASSUREURS_PATH, "utf-8");
    const parsed = Papa.parse<{ id: string; name: string; ri_percentage: string }>(
      content,
      {
        header: true,
        skipEmptyLines: true,
      }
    );

    const assureurs: Assureur[] = parsed.data.map((row) => ({
      id: parseInt(row.id, 10),
      name: row.name,
      ri_percentage: parseFloat(row.ri_percentage),
    }));

    return NextResponse.json({ assureurs });
  } catch (error) {
    console.error("Error reading assureurs:", error);
    return NextResponse.json(
      {
        error: "Failed to read assureurs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { assureurs } = body as { assureurs: Assureur[] };

    if (!assureurs || !Array.isArray(assureurs)) {
      return NextResponse.json(
        { error: "Missing or invalid assureurs array" },
        { status: 400 }
      );
    }

    // Convert to CSV
    const csvContent = Papa.unparse(
      assureurs.map((a) => ({
        id: a.id,
        name: a.name,
        ri_percentage: a.ri_percentage,
      }))
    );

    // Write to file
    await fs.writeFile(ASSUREURS_PATH, csvContent, "utf-8");

    return NextResponse.json({
      success: true,
      count: assureurs.length,
    });
  } catch (error) {
    console.error("Error updating assureurs:", error);
    return NextResponse.json(
      {
        error: "Failed to update assureurs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

