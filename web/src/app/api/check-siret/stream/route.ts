import { NextRequest, NextResponse } from "next/server";
import { 
  SirenCheckInput, 
  CompanyStatus, 
  fetchWithIntegrationKey, 
  cleanSirets, 
  INSEE_RATE_LIMITS 
} from "@/lib/insee-api";
import { 
  fetchBodaccProceduresBatch,
  extractSirenFromSiret 
} from "@/lib/bodacc-api";

export async function POST(req: NextRequest) {
  try {
    const { sirets, data }: SirenCheckInput = await req.json();
    if (!Array.isArray(sirets) || sirets.length === 0) {
      return NextResponse.json({ error: "sirets_required" }, { status: 400 });
    }

    // Create phone map from data
    const phoneMap = new Map<string, string>();
    if (data) {
      data.forEach(item => {
        if (item.phone) {
          phoneMap.set(item.siret, item.phone);
        }
      });
    }

    const cleaned = cleanSirets(sirets);

    const integrationKey = process.env.INSEE_INTEGRATION_KEY;
    
    if (!integrationKey) {
      return NextResponse.json({ error: "NO_API_CONFIGURED" }, { status: 500 });
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (data: Record<string, unknown>) => {
          const event = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        try {
          // Send initial progress
          sendEvent({ type: 'progress', current: 0, total: cleaned.length, message: 'Début de la vérification...' });

          const results: CompanyStatus[] = [];

          for (let i = 0; i < cleaned.length; i++) {
            const siret = cleaned[i];
            
            // Send progress update
            sendEvent({ 
              type: 'progress', 
              current: i + 1, 
              total: cleaned.length, 
              message: `Vérification du SIRET ${siret}...`,
              siret: siret
            });

            // Requête INSEE et BODACC en parallèle
            const [inseeResult, bodaccResult] = await Promise.all([
              fetchWithIntegrationKey(siret, integrationKey),
              fetchBodaccProceduresBatch([extractSirenFromSiret(siret)])
            ]);
            
            // Enrichir le résultat INSEE avec les données BODACC
            let enrichedResult = {
              ...inseeResult,
              phone: phoneMap.get(inseeResult.siret)
            };
            
            if (bodaccResult.length > 0) {
              const bodacc = bodaccResult[0];
              if (bodacc.hasProcedures) {
                const procedure = bodacc.procedures[0];
                enrichedResult = {
                  ...enrichedResult,
                  procedure: procedure.name,
                  procedureType: procedure.type,
                  hasActiveProcedures: bodacc.hasActiveProcedures
                };
              }
            }
            
            results.push(enrichedResult);

            // Send individual result
            sendEvent({ 
              type: 'result', 
              result: enrichedResult,
              current: i + 1,
              total: cleaned.length
            });

            // Wait between requests
            if (i < cleaned.length - 1) {
              await new Promise(resolve => setTimeout(resolve, INSEE_RATE_LIMITS.delayBetweenRequests));
            }
          }

          // L'enrichissement BODACC est maintenant fait en parallèle avec chaque requête INSEE

          // Send completion
          sendEvent({ 
            type: 'complete', 
            results: results,
            stats: {
              total: results.length,
              radiees: results.filter(r => r.estRadiee).length,
              actives: results.filter(r => !r.estRadiee).length,
              enProcedure: results.filter(r => r.hasActiveProcedures).length,
              radieesOuEnProcedure: results.filter(r => r.estRadiee || r.hasActiveProcedures).length,
              errors: results.filter(r => r.error).length
            }
          });

        } catch (error) {
          sendEvent({ type: 'error', message: error instanceof Error ? error.message : 'Erreur inconnue' });
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
