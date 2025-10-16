import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import Papa from 'papaparse';

const DATA_DIR = join(process.cwd(), '..', '..', 'data', 'csv-files');

type CsvRow = Record<string, string>;

export async function GET() {
  try {
    // Charger tous les fichiers actifs (TR, U1, U2, U3, U4, U1P)
    const activeStatuses = ['TR', 'U1', 'U2', 'U3', 'U4', 'U1P'];
    const allSubcontractors: CsvRow[] = [];
    const stats = {
      totalFiles: 0,
      totalRows: 0,
      byStatus: {} as Record<string, number>
    };

    for (const status of activeStatuses) {
      const statusDir = join(DATA_DIR, status);
      
      if (existsSync(statusDir)) {
        const files = await readdir(statusDir);
        const csvFiles = files.filter(file => file.endsWith('.csv'));

        for (const csvFile of csvFiles) {
          try {
            const filePath = join(statusDir, csvFile);
            const csvContent = await readFile(filePath, 'utf-8');
            
            const data = await parseCsv(csvContent);
            
            // Ajouter le statut à chaque ligne
            const dataWithStatus = data.map(row => ({
              ...row,
              status_reseau: status,
              fichier_source: csvFile
            }));

            allSubcontractors.push(...dataWithStatus);
            stats.totalFiles++;
            stats.byStatus[status] = (stats.byStatus[status] || 0) + data.length;
            stats.totalRows += data.length;

          } catch (error) {
            console.error(`Erreur lors du chargement de ${csvFile}:`, error);
          }
        }
      }
    }

    // Dédupliquer par SIRET (garder la première occurrence)
    const uniqueSubcontractors = new Map<string, CsvRow>();
    
    for (const subcontractor of allSubcontractors) {
      const siret = subcontractor.Siret || subcontractor.siret || subcontractor.SIRET || '';
      if (siret && !uniqueSubcontractors.has(siret)) {
        uniqueSubcontractors.set(siret, subcontractor);
      }
    }

    const finalSubcontractors = Array.from(uniqueSubcontractors.values());

    return NextResponse.json({
      success: true,
      data: finalSubcontractors,
      stats: {
        ...stats,
        uniqueSirets: finalSubcontractors.length,
        duplicatesRemoved: stats.totalRows - finalSubcontractors.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de la base sous-traitants:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la base sous-traitants' },
      { status: 500 }
    );
  }
}

function parseCsv(csvContent: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        resolve(result.data as CsvRow[]);
      },
      error: (error: unknown) => {
        reject(error);
      }
    });
  });
}
