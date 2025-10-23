import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const RI_THRESHOLDS_PATH = path.join(
  process.cwd(),
  "../data/csv-files/config/ri-thresholds.json"
);

interface RIThresholds {
  warningThreshold: number;
  excellentThreshold: number;
}

const DEFAULT_THRESHOLDS: RIThresholds = {
  warningThreshold: -20,
  excellentThreshold: 10,
};

/**
 * GET /api/data/ri-thresholds
 * Retrieves the current RI thresholds configuration
 */
export async function GET() {
  try {
    // Ensure config directory exists
    const configDir = path.dirname(RI_THRESHOLDS_PATH);
    await fs.mkdir(configDir, { recursive: true });

    // Try to read existing thresholds, or use defaults
    let thresholds: RIThresholds;
    try {
      const content = await fs.readFile(RI_THRESHOLDS_PATH, "utf-8");
      thresholds = JSON.parse(content);
    } catch {
      // File doesn't exist, use defaults
      thresholds = DEFAULT_THRESHOLDS;
    }

    return NextResponse.json({
      success: true,
      thresholds,
    });
  } catch (error) {
    console.error("Error reading RI thresholds:", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture des seuils RI" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/data/ri-thresholds
 * Updates the RI thresholds configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { thresholds } = body as { thresholds: RIThresholds };

    if (!thresholds || 
        typeof thresholds.warningThreshold !== 'number' || 
        typeof thresholds.excellentThreshold !== 'number') {
      return NextResponse.json(
        { error: "Format de seuils invalide" },
        { status: 400 }
      );
    }

    // Validate that warningThreshold < excellentThreshold
    if (thresholds.warningThreshold >= thresholds.excellentThreshold) {
      return NextResponse.json(
        { error: "Le seuil de sous-déclaration doit être inférieur au seuil d'excellence" },
        { status: 400 }
      );
    }

    // Ensure config directory exists
    const configDir = path.dirname(RI_THRESHOLDS_PATH);
    await fs.mkdir(configDir, { recursive: true });

    // Write thresholds to file
    await fs.writeFile(
      RI_THRESHOLDS_PATH,
      JSON.stringify(thresholds, null, 2),
      "utf-8"
    );

    return NextResponse.json({
      success: true,
      thresholds,
      message: "Seuils RI mis à jour avec succès",
    });
  } catch (error) {
    console.error("Error updating RI thresholds:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des seuils RI" },
      { status: 500 }
    );
  }
}

