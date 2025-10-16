import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Papa from 'papaparse';
import { JoinResult, STATUS_MAPPING, SubcontractorData } from '@/lib/types';
import { validateSirets, validateEnabledStatuses, handleApiError } from '@/lib/error-handling';

const SOUS_TRAITANTS_FILE = join(process.cwd(), '..', 'data', 'csv-files', 'base-sous-traitants', 'sous-traitants.csv');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validation des paramètres d'entrée
    const validatedSirets = validateSirets(body.sirets);
    const validatedStatuses = validateEnabledStatuses(body.enabledStatuses);
    
    // Nettoyer les SIRETs (si la liste n'est pas vide)
    const cleanedSirets = validatedSirets.length > 0 ? Array.from(new Set(validatedSirets)) : [];

    // Utiliser le CSV fourni ou lire le fichier sous-traitants par défaut
    let csvContent: string;
    if (body.csvData) {
      csvContent = body.csvData;
    } else {
      csvContent = await readFile(SOUS_TRAITANTS_FILE, 'utf-8');
    }
    
    const joinResult = await performJoin(csvContent, cleanedSirets, validatedStatuses, !!body.csvData);

    return NextResponse.json({ result: joinResult });

  } catch (error) {
    const errorResponse = handleApiError(error, 'simple-join');
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

async function performJoin(csvContent: string, targetSirets: string[], enabledStatuses: Record<string, boolean>, useCustomFile: boolean = false): Promise<JoinResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (parseResult: { data: Record<string, string>[] }) => {
        const data = parseResult.data as Record<string, string>[];
        const matched: SubcontractorData[] = [];
        const byStatus: Record<string, number> = {};

        // Créer un Set pour une recherche rapide (si des SIRETs spécifiques sont fournis)
        const siretSet = targetSirets.length > 0 ? new Set(targetSirets) : null;

        // Parcourir les données et chercher les correspondances
        for (const row of data) {
          // Vérifier le statut
          const statusCode = parseInt(row.status || '-1');
          const statusName = STATUS_MAPPING[statusCode];
          
          // Ignorer si le statut n'est pas activé
          if (!statusName || !enabledStatuses[statusName]) {
            continue;
          }

          // Chercher le champ SIRET
          const rowSiret = (row.siret || '').toString().replace(/[^0-9]/g, '');
          
          // Si aucun SIRET spécifique n'est fourni, on prend tous les SIRETs
          // Sinon, on vérifie si le SIRET est dans la liste
          if (rowSiret && (!siretSet || siretSet.has(rowSiret))) {
            // Ajouter le statut et la source au résultat
            matched.push({
              ...row,
              status_reseau: statusName,
              fichier_source: useCustomFile ? 'Fichier entreprise' : 'Base sous-traitants'
            });
            
            // Compter par statut
            byStatus[statusName] = (byStatus[statusName] || 0) + 1;
          }
        }

        // Déterminer les SIRETs non trouvés (seulement si des SIRETs spécifiques étaient fournis)
        let unmatched: { siret: string }[] = [];
        if (targetSirets.length > 0) {
          const matchedSirets = new Set(matched.map(item => item.siret));
          const unmatchedSirets = targetSirets.filter(siret => !matchedSirets.has(siret));
          unmatched = unmatchedSirets.map(siret => ({ siret }));
        }

        const joinResult: JoinResult = {
          matched,
          unmatched,
          stats: {
            totalSirets: targetSirets.length,
            matchedCount: matched.length,
            unmatchedCount: unmatched.length,
            byStatus
          }
        };

        resolve(joinResult);
      },
      error: (error: unknown) => {
        reject(error);
      }
    });
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
