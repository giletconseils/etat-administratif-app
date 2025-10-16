import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import Papa from 'papaparse';
import { PhoneJoinResult, STATUS_MAPPING, SubcontractorData } from '@/lib/types';
import { normalizePhone } from '@/lib/csv-utils';
import { validatePhones, validateEnabledStatuses, handleApiError } from '@/lib/error-handling';

const SOUS_TRAITANTS_FILE = join(process.cwd(), '..', 'data', 'csv-files', 'base-sous-traitants', 'sous-traitants.csv');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validation des paramètres d'entrée
    const validatedPhones = validatePhones(body.phones);
    const validatedStatuses = validateEnabledStatuses(body.enabledStatuses);

    // Normaliser les numéros de téléphone
    console.log('Numéros reçus (avant normalisation):', validatedPhones.slice(0, 5));
    const normalizedPhones = validatedPhones
      .map(phone => normalizePhone(phone))
      .filter(phone => phone && phone.startsWith('+33') && phone.length === 12);
    
    console.log('Numéros normalisés:', normalizedPhones.slice(0, 5));
    console.log('Total normalisés:', normalizedPhones.length, 'sur', validatedPhones.length);
    
    // Log des numéros non normalisés pour debug
    const nonNormalized = validatedPhones.filter(phone => !normalizePhone(phone));
    if (nonNormalized.length > 0) {
      console.log('Numéros non normalisés (exemples):', nonNormalized.slice(0, 3));
    }

    if (normalizedPhones.length === 0) {
      return NextResponse.json({
        result: {
          matched: [],
          unmatched: validatedPhones.map(phone => ({ phone, error: 'Numéro invalide' })),
          stats: {
            totalPhones: validatedPhones.length,
            matchedCount: 0,
            unmatchedCount: validatedPhones.length,
            byStatus: {}
          }
        }
      });
    }

    // Utiliser le CSV fourni ou lire le fichier sous-traitants par défaut
    let csvContent: string;
    if (body.csvData) {
      csvContent = body.csvData;
    } else {
      csvContent = await readFile(SOUS_TRAITANTS_FILE, 'utf-8');
    }
    
    const joinResult = await performPhoneJoin(csvContent, normalizedPhones, validatedStatuses, !!body.csvData);

    return NextResponse.json({ result: joinResult });

  } catch (error) {
    const errorResponse = handleApiError(error, 'phone-join');
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

async function performPhoneJoin(csvContent: string, targetPhones: string[], enabledStatuses: Record<string, boolean>, useCustomFile: boolean = false): Promise<PhoneJoinResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (parseResult: { data: Record<string, string>[] }) => {
        const data = parseResult.data as Record<string, string>[];
        const matched: SubcontractorData[] = [];
        const byStatus: Record<string, number> = {};

        // Créer un Set pour une recherche rapide
        const phoneSet = new Set(targetPhones);
        console.log('Recherche dans la base avec', phoneSet.size, 'numéros');
        console.log('Exemples de numéros recherchés:', Array.from(phoneSet).slice(0, 3));

        // Parcourir les données et chercher les correspondances
        let processedRows = 0;
        for (const row of data) {
          processedRows++;
          
          // Vérifier le statut
          const statusCode = parseInt(row.status || '-1');
          const statusName = STATUS_MAPPING[statusCode];
          
          // Ignorer si le statut n'est pas activé
          if (!statusName || !enabledStatuses[statusName]) {
            continue;
          }

          // Chercher les champs téléphone
          const phoneMobile = normalizePhone(row.phone_mobile || '');
          const phoneSecretary = normalizePhone(row.phone_secretary || '');
          
          // Log pour les premières lignes pour déboguer
          if (processedRows <= 10) {
            console.log(`Ligne ${processedRows}: phone_mobile="${row.phone_mobile}" -> "${phoneMobile}", phone_secretary="${row.phone_secretary}" -> "${phoneSecretary}", siret="${row.siret}"`);
          }
          
          // Vérifier si un des numéros correspond
          let matchedPhone = null;
          if (phoneMobile && phoneSet.has(phoneMobile)) {
            matchedPhone = phoneMobile;
          } else if (phoneSecretary && phoneSet.has(phoneSecretary)) {
            matchedPhone = phoneSecretary;
          }
          
          if (matchedPhone) {
            // Ajouter le statut et la source au résultat
            matched.push({
              ...row,
              siret: row.siret || row.SIRET || row.Siret,
              name: row.name || row.denomination || row.Denomination,
              phone_mobile: row.phone_mobile,
              phone_secretary: row.phone_secretary,
              status_reseau: statusName,
              fichier_source: useCustomFile ? 'Fichier entreprise' : 'Base sous-traitants',
              matched_phone: matchedPhone
            });
            
            // Compter par statut
            byStatus[statusName] = (byStatus[statusName] || 0) + 1;
          }
        }
        
        console.log(`Traitement terminé: ${processedRows} lignes analysées, ${matched.length} correspondances trouvées`);

        // Déterminer les téléphones non trouvés
        const matchedPhones = new Set(matched.map(item => item.matched_phone));
        const unmatchedPhones = targetPhones.filter(phone => !matchedPhones.has(phone));
        const unmatched = unmatchedPhones.map(phone => ({ phone, error: 'Non trouvé dans la base' }));

        console.log(`Recherche terminée: ${matched.length} correspondances trouvées sur ${targetPhones.length} numéros recherchés`);

        const joinResult: PhoneJoinResult = {
          matched,
          unmatched,
          stats: {
            totalPhones: targetPhones.length,
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
