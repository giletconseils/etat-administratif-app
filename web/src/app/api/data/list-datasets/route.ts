import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

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

interface DatasetInfo {
  type: DatasetType;
  exists: boolean;
  lastModified?: string;
  lineCount?: number;
  error?: string;
}

async function getDatasetInfo(type: DatasetType): Promise<DatasetInfo> {
  const filePath = DATASET_PATHS[type];

  try {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n").filter((line) => line.trim()).length;

    return {
      type,
      exists: true,
      lastModified: stats.mtime.toISOString(),
      lineCount: lines,
    };
  } catch (error) {
    return {
      type,
      exists: false,
      error: error instanceof Error ? error.message : "File not found",
    };
  }
}

export async function GET() {
  try {
    const datasets = await Promise.all([
      getDatasetInfo("sous-traitants"),
      getDatasetInfo("missions"),
      getDatasetInfo("assureurs"),
    ]);

    return NextResponse.json({ datasets });
  } catch (error) {
    console.error("Error listing datasets:", error);
    return NextResponse.json(
      {
        error: "Failed to list datasets",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

