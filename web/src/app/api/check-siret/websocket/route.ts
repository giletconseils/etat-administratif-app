import { NextRequest } from "next/server";
import { 
  SirenCheckInput, 
  CompanyStatus, 
  fetchWithIntegrationKey, 
  cleanSirets, 
  INSEE_RATE_LIMITS 
} from "@/lib/insee-api";
import { fetchBodaccProcedures } from "@/lib/bodacc-api";

export async function POST(req: NextRequest) {
  try {
    const { sirets, data }: SirenCheckInput = await req.json();
    if (!Array.isArray(sirets) || sirets.length === 0) {
      return new Response(JSON.stringify({ error: "sirets_required" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
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
      return new Response(JSON.stringify({ error: "NO_API_CONFIGURED" }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Paramètres optimisés pour la rapidité
    const BATCH_SIZE = 25; // Lots plus petits pour éviter les timeouts
    const PAUSE_BETWEEN_BATCHES = 15000; // 15 secondes (réduit de 30s)
    const HEARTBEAT_INTERVAL = 30000; // 30 secondes (réduit de 60s)

    console.log(`🔄 WebSocket: Traitement de ${cleaned.length} SIRETs par lots de ${BATCH_SIZE}`);

    // Créer un stream simple sans SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (data: Record<string, unknown>) => {
          const event = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        let heartbeatInterval: NodeJS.Timeout | undefined;

        try {
          sendEvent({ type: 'progress', current: 0, total: cleaned.length, message: 'Début de la vérification...' });

          const results: CompanyStatus[] = [];
          let consecutiveErrors = 0;
          const MAX_CONSECUTIVE_ERRORS = 5; // Réduit pour détecter les erreurs plus vite

          // Heartbeat pour maintenir la connexion
          heartbeatInterval = setInterval(() => {
            sendEvent({ 
              type: 'heartbeat', 
              timestamp: Date.now(),
              message: 'Connexion maintenue...'
            });
          }, HEARTBEAT_INTERVAL);

          for (let batchStart = 0; batchStart < cleaned.length; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, cleaned.length);
            const batchSirets = cleaned.slice(batchStart, batchEnd);
            const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(cleaned.length / BATCH_SIZE);
            
            console.log(`📦 WebSocket Lot ${batchNumber}/${totalBatches}: SIRETs ${batchStart + 1}-${batchEnd}`);
            
            // Pause entre les lots
            if (batchStart > 0) {
              console.log(`⏸️ Pause de ${PAUSE_BETWEEN_BATCHES / 1000}s - Lot ${batchNumber}/${totalBatches}`);
              sendEvent({ 
                type: 'progress', 
                current: batchStart, 
                total: cleaned.length, 
                message: `⏸️ Pause de ${PAUSE_BETWEEN_BATCHES / 1000}s - Lot ${batchNumber}/${totalBatches}`,
                siret: batchSirets[0]
              });
              await new Promise(resolve => setTimeout(resolve, PAUSE_BETWEEN_BATCHES));
            }
            
            // Traiter le lot
            for (let i = 0; i < batchSirets.length; i++) {
              const globalIndex = batchStart + i;
              const siret = batchSirets[i];
              
              sendEvent({ 
                type: 'progress', 
                current: globalIndex + 1, 
                total: cleaned.length, 
                message: `Vérification du SIRET ${siret}... (${globalIndex + 1}/${cleaned.length}) - Lot ${batchNumber}/${totalBatches}`,
                siret: siret
              });

              try {
                // Requête INSEE avec retry optimisé
                let inseeResult: CompanyStatus | undefined;
                let retryCount = 0;
                const MAX_RETRIES = 2; // Réduit à 2 retries pour la rapidité
                
                while (retryCount <= MAX_RETRIES) {
                  try {
                    inseeResult = await fetchWithIntegrationKey(siret, integrationKey);
                    break;
                  } catch (retryError) {
                    retryCount++;
                    if (retryCount > MAX_RETRIES) {
                      throw retryError;
                    }
                    
                    const backoffDelay = Math.pow(2, retryCount) * 500; // Backoff plus rapide : 0.5s, 1s
                    console.warn(`⚠️  Retry ${retryCount}/${MAX_RETRIES} pour SIRET ${siret} dans ${backoffDelay}ms`);
                    
                    sendEvent({ 
                      type: 'progress', 
                      current: globalIndex + 1, 
                      total: cleaned.length, 
                      message: `Retry ${retryCount}/${MAX_RETRIES} pour SIRET ${siret}...`,
                      siret: siret
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, backoffDelay));
                  }
                }
                
                if (!inseeResult) {
                  throw new Error('Impossible d\'obtenir le résultat INSEE après tous les essais');
                }
                
                // Requête BODACC
                let bodaccInfo = null;
                if (!inseeResult.error) {
                  try {
                    const siren = siret.substring(0, 9);
                    bodaccInfo = await fetchBodaccProcedures(siren);
                  } catch (bodaccErr) {
                    console.warn(`⚠️  Erreur BODACC pour SIRET ${siret}:`, bodaccErr);
                  }
                }
                
                // Combiner les résultats
                const enrichedResult: CompanyStatus = {
                  ...inseeResult,
                  siret: inseeResult.siret || siret,
                  phone: phoneMap.get(inseeResult.siret || siret),
                  hasActiveProcedures: bodaccInfo?.hasActiveProcedures || false,
                  procedure: bodaccInfo?.procedures?.[0]?.name,
                  procedureType: bodaccInfo?.procedures?.[0]?.type
                };
                
                results.push(enrichedResult);

                sendEvent({ 
                  type: 'result', 
                  result: enrichedResult,
                  current: globalIndex + 1,
                  total: cleaned.length
                });

                if (inseeResult.error) {
                  consecutiveErrors++;
                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    sendEvent({ 
                      type: 'error', 
                      message: `Trop d'erreurs consécutives (${inseeResult.error}). Vérifiez votre clé API INSEE.`,
                      results: results
                    });
                    return;
                  }
                } else {
                  consecutiveErrors = 0;
                }

              } catch (err) {
                console.error(`❌ Exception au SIRET #${globalIndex + 1} (${siret}):`, err);
                consecutiveErrors++;
                
                const errorResult = {
                  siret,
                  estRadiee: false,
                  error: err instanceof Error ? err.message : 'UNKNOWN_ERROR'
                };
                
                results.push(errorResult);
                
                sendEvent({ 
                  type: 'result', 
                  result: errorResult,
                  current: globalIndex + 1,
                  total: cleaned.length
                });
                
                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                  sendEvent({ 
                    type: 'error', 
                    message: `Trop d'exceptions consécutives. Le traitement a été arrêté.`,
                    results: results
                  });
                  return;
                }
              }

              // Délai entre requêtes
              if (i < batchSirets.length - 1) {
                await new Promise(resolve => setTimeout(resolve, INSEE_RATE_LIMITS.delayBetweenRequests));
              }
            }
            
            console.log(`✅ WebSocket Lot ${batchNumber}/${totalBatches} terminé`);
          }

          // Résultats finaux
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

        } catch (err) {
          console.error('Erreur dans le stream WebSocket:', err);
          sendEvent({ type: 'error', message: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
        } finally {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
          }
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Désactiver le buffering Nginx
      },
    });

  } catch (err) {
    console.error('Erreur dans la route WebSocket:', err);
    return new Response(JSON.stringify({ error: "invalid_request" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
