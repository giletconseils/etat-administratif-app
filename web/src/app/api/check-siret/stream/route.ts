import { NextRequest, NextResponse } from "next/server";
import { 
  SirenCheckInput, 
  CompanyStatus, 
  fetchWithIntegrationKey, 
  cleanSirets, 
  INSEE_RATE_LIMITS 
} from "@/lib/insee-api";

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
          let consecutiveErrors = 0;
          const MAX_CONSECUTIVE_ERRORS = 10; // Augmenté pour plus de tolérance
          
          // Traitement par lots pour éviter les limites de quota
          const BATCH_SIZE = 20; // Réduit à 20 pour plus de stabilité
          const PAUSE_BETWEEN_BATCHES = 90000; // 1.5 minute de pause entre lots
          
          console.log(`🔄 Traitement de ${cleaned.length} SIRETs par lots de ${BATCH_SIZE}`);

          for (let batchStart = 0; batchStart < cleaned.length; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, cleaned.length);
            const batchSirets = cleaned.slice(batchStart, batchEnd);
            const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(cleaned.length / BATCH_SIZE);
            
            console.log(`📦 Lot ${batchNumber}/${totalBatches}: SIRETs ${batchStart + 1}-${batchEnd} (${batchSirets.length} SIRETs)`);
            
            // Pause entre les lots (sauf pour le premier)
            if (batchStart > 0) {
              console.log(`⏸️  Pause de ${PAUSE_BETWEEN_BATCHES / 1000}s entre les lots...`);
              sendEvent({ 
                type: 'progress', 
                current: batchStart, 
                total: cleaned.length, 
                message: `⏸️ Pause de ${PAUSE_BETWEEN_BATCHES / 1000}s entre les lots (${batchNumber}/${totalBatches})...`,
                siret: batchSirets[0]
              });
              await new Promise(resolve => setTimeout(resolve, PAUSE_BETWEEN_BATCHES));
            }
            
            // Traiter le lot
            for (let i = 0; i < batchSirets.length; i++) {
              const globalIndex = batchStart + i;
              const siret = batchSirets[i];
              
              // Send progress update
              sendEvent({ 
                type: 'progress', 
                current: globalIndex + 1, 
                total: cleaned.length, 
                message: `Vérification du SIRET ${siret}... (${globalIndex + 1}/${cleaned.length}) - Lot ${batchNumber}/${totalBatches}`,
                siret: siret
              });

              try {
                // Requête INSEE seulement (sans BODACC pour simplifier)
                const inseeResult = await fetchWithIntegrationKey(siret, integrationKey);
                
                // Toujours ajouter un résultat, même en cas d'erreur
                const enrichedResult = {
                  ...inseeResult,
                  phone: phoneMap.get(inseeResult.siret)
                };
                
                // Gestion des erreurs INSEE avec retry automatique
                if (inseeResult.error) {
                  console.warn(`⚠️  Erreur INSEE au SIRET ${globalIndex + 1}: ${inseeResult.error}`);
                  
                  // Ne compter que les erreurs critiques (pas les rate limits)
                  if (inseeResult.error.includes('NETWORK_ERROR') || inseeResult.error.includes('QUOTA_EXCEEDED')) {
                    consecutiveErrors++;
                  } else {
                    consecutiveErrors = Math.max(0, consecutiveErrors - 1); // Réduire pour les erreurs non critiques
                  }
                  
                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    console.error(`❌ ${MAX_CONSECUTIVE_ERRORS} erreurs consécutives. Arrêt du traitement.`);
                    sendEvent({ 
                      type: 'error', 
                      message: `Trop d'erreurs consécutives (${inseeResult.error}). Vérifiez votre clé API INSEE.`,
                      results: results
                    });
                    return; // Sortir de la fonction complète
                  }
                } else {
                  consecutiveErrors = 0; // Reset si succès
                }
                
                results.push(enrichedResult);

                // Send individual result
                sendEvent({ 
                  type: 'result', 
                  result: enrichedResult,
                  current: globalIndex + 1,
                  total: cleaned.length
                });

              } catch (error) {
                console.error(`❌ Exception au SIRET #${globalIndex + 1} (${siret}):`, error);
                consecutiveErrors++;
                
                // Créer un résultat d'erreur pour ce SIRET
                const errorResult = {
                  siret,
                  estRadiee: false,
                  error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
                  phone: phoneMap.get(siret)
                };
                
                results.push(errorResult);
                
                sendEvent({ 
                  type: 'result', 
                  result: errorResult,
                  current: globalIndex + 1,
                  total: cleaned.length
                });
                
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                  console.error(`❌ ${MAX_CONSECUTIVE_ERRORS} exceptions consécutives. Arrêt du traitement.`);
                  sendEvent({ 
                    type: 'error', 
                    message: `Trop d'exceptions consécutives. Le traitement a été arrêté.`,
                    results: results
                  });
                  return; // Sortir de la fonction complète
                }
              }

              // Wait between requests (respecter la limite de 30 req/min)
              if (i < batchSirets.length - 1) {
                const delay = INSEE_RATE_LIMITS.delayBetweenRequests;
                // Ajouter un délai supplémentaire si on a eu des erreurs récentes
                const extraDelay = consecutiveErrors > 0 ? 1000 : 0;
                await new Promise(resolve => setTimeout(resolve, delay + extraDelay));
              }
            }
            
            console.log(`✅ Lot ${batchNumber}/${totalBatches} terminé (${batchSirets.length} SIRETs traités)`);
          }

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
          console.error('Erreur dans le stream:', error);
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

  } catch (error) {
    console.error('Erreur dans la route stream:', error);
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10 minutes (adapté pour le traitement par lots avec pauses)