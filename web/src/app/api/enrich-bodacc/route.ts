import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchBodaccProceduresBatch, 
  extractSirenFromSiret, 
  type BodaccResult 
} from '@/lib/bodacc-api';
import { Checked } from '@/lib/types';

export interface BodaccEnrichmentRequest {
  companies: Array<{
    siret: string;
    siren?: string;
    denomination?: string;
    estRadiee?: boolean;
    [key: string]: unknown;
  }>;
}

export interface BodaccEnrichmentResponse {
  enrichedCompanies: Checked[];
  stats: {
    total: number;
    withProcedures: number;
    withActiveProcedures: number;
    errors: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as BodaccEnrichmentRequest;
    
    if (!body.companies || !Array.isArray(body.companies)) {
      return NextResponse.json(
        { error: 'Invalid request: companies array is required' },
        { status: 400 }
      );
    }

    console.log(`Enriching ${body.companies.length} companies with BODACC data`);

    // Extraire les SIRENs uniques
    const sirens = new Set<string>();
    const sirenToSirets = new Map<string, string[]>();
    
    for (const company of body.companies) {
      const siren = company.siren || extractSirenFromSiret(company.siret);
      sirens.add(siren);
      
      if (!sirenToSirets.has(siren)) {
        sirenToSirets.set(siren, []);
      }
      sirenToSirets.get(siren)!.push(company.siret);
    }

    console.log(`Found ${sirens.size} unique SIRENs to query`);

    // Récupérer les données BODACC pour tous les SIRENs
    const bodaccResults = await fetchBodaccProceduresBatch(Array.from(sirens));
    
    // Créer un map pour un accès rapide aux résultats BODACC
    const bodaccMap = new Map<string, BodaccResult>();
    for (const result of bodaccResults) {
      bodaccMap.set(result.siren, result);
    }

    // Enrichir chaque entreprise avec les données BODACC
    const enrichedCompanies: Checked[] = [];
    let withProcedures = 0;
    let withActiveProcedures = 0;
    let errors = 0;

    for (const company of body.companies) {
      const siren = company.siren || extractSirenFromSiret(company.siret);
      const bodaccResult = bodaccMap.get(siren);
      
      let procedure: string | undefined;
      let procedureType: string | undefined;
      let hasActiveProceduresFlag = false;
      let bodaccError: string | undefined;

      if (bodaccResult) {
        if (bodaccResult.error) {
          bodaccError = bodaccResult.error;
          errors++;
        } else if (bodaccResult.hasProcedures) {
          withProcedures++;
          
          // Utiliser la nouvelle logique BODACC
          if (bodaccResult.hasActiveProcedures) {
            withActiveProcedures++;
            hasActiveProceduresFlag = true;
            
            // Prendre la procédure (qui est déjà la plus récente)
            const latestProcedure = bodaccResult.procedures[0];
            procedure = latestProcedure.name;
            procedureType = latestProcedure.type;
          } else {
            // Procédure terminée
            const latestProcedure = bodaccResult.procedures[0];
            procedure = `${latestProcedure.name} (Terminée)`;
            procedureType = latestProcedure.type;
          }
        }
      }

      const enrichedCompany: Checked = {
        siret: company.siret,
        denomination: company.denomination,
        estRadiee: company.estRadiee || false,
        dateCessation: typeof company.dateCessation === 'string' ? company.dateCessation : null,
        phone: typeof company.phone === 'string' ? company.phone : undefined,
        status_reseau: typeof company.status_reseau === 'string' ? company.status_reseau : undefined,
        fichier_source: typeof company.fichier_source === 'string' ? company.fichier_source : undefined,
        montant: company.montant || 0,
        // Nouvelles propriétés BODACC
        procedure,
        procedureType,
        hasActiveProcedures: hasActiveProceduresFlag,
        bodaccError,
        error: company.error
      };

      enrichedCompanies.push(enrichedCompany);
    }

    const response: BodaccEnrichmentResponse = {
      enrichedCompanies,
      stats: {
        total: body.companies.length,
        withProcedures,
        withActiveProcedures,
        errors
      }
    };

    console.log(`BODACC enrichment completed:`, response.stats);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in BODACC enrichment API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
