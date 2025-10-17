import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import Papa from 'papaparse';

const DATA_DIR = join(process.cwd(), '..', '..', 'data', 'csv-files');

type TableSchema = {
  status: string;
  fileName: string;
  columns: string[];
  rowCount: number;
  sampleData: Record<string, string>[];
};

export async function GET() {
  try {
    const schemas: TableSchema[] = [];
    const validStatuses = ['U4', 'U3', 'U2', 'U1', 'U1P', 'TR'];

    for (const status of validStatuses) {
      const statusDir = join(DATA_DIR, status);
      
      if (existsSync(statusDir)) {
        const files = await readdir(statusDir);
        const csvFiles = files.filter(file => file.endsWith('.csv'));

        for (const csvFile of csvFiles) {
          try {
            const filePath = join(statusDir, csvFile);
            const csvContent = await readFile(filePath, 'utf-8');
            
            const schema = await analyzeCsvSchema(status, csvFile, csvContent);
            schemas.push(schema);
          } catch (error) {
            console.error(`Erreur lors de l'analyse de ${csvFile}:`, error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      schemas,
      stats: {
        totalTables: schemas.length,
        byStatus: schemas.reduce((acc, schema) => {
          acc[schema.status] = (acc[schema.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des schémas:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des schémas' },
      { status: 500 }
    );
  }
}

async function analyzeCsvSchema(status: string, fileName: string, csvContent: string): Promise<TableSchema> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      preview: 100, // Analyser seulement les 100 premières lignes pour les échantillons
      complete: (result) => {
        const data = result.data as Record<string, string>[];
        const columns = result.meta.fields || [];
        
        // Prendre quelques échantillons de données (max 5 lignes)
        const sampleData = data.slice(0, 5);

        resolve({
          status,
          fileName,
          columns,
          rowCount: data.length,
          sampleData
        });
      },
      error: (error: unknown) => {
        reject(error);
      }
    });
  });
}
