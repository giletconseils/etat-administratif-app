import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type DatasetType = "sous-traitants" | "missions" | "assureurs";

const DATASET_PATHS: Record<DatasetType, string> = {
  "sous-traitants": path.join(
    process.cwd(),
    "../data/csv-files/base-sous-traitants/sous-traitants.csv"
  ),
  missions: path.join(
    process.cwd(),
    "../data/csv-files/missions/missions.csv"
  ),
  assureurs: path.join(
    process.cwd(),
    "../data/csv-files/assureurs/assureurs.csv"
  ),
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasetType, csvContent } = body as {
      datasetType: DatasetType;
      csvContent: string;
    };

    if (!datasetType || !csvContent) {
      return NextResponse.json(
        { error: "Missing datasetType or csvContent" },
        { status: 400 }
      );
    }

    if (!DATASET_PATHS[datasetType]) {
      return NextResponse.json(
        { error: `Invalid datasetType: ${datasetType}` },
        { status: 400 }
      );
    }

    const filePath = DATASET_PATHS[datasetType];
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Write the CSV content
    await fs.writeFile(filePath, csvContent, "utf-8");

    // Get file stats for response
    const stats = await fs.stat(filePath);
    const lines = csvContent.split("\n").filter((line) => line.trim()).length;

    return NextResponse.json({
      success: true,
      dataset: datasetType,
      lastModified: stats.mtime.toISOString(),
      lineCount: lines,
    });
  } catch (error) {
    console.error("Error uploading dataset:", error);
    return NextResponse.json(
      {
        error: "Failed to upload dataset",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

