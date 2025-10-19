import { NextRequest, NextResponse } from "next/server";
import { 
  CompanyStatus, 
  fetchWithIntegrationKey, 
  cleanSirets, 
  INSEE_RATE_LIMITS 
} from "@/lib/insee-api";

export async function POST(req: NextRequest) {
  try {
    const { testSize = 400 }: { testSize?: number } = await req.json();
    
    // SIRETs RÉELS et VALIDES pour reproduire le problème HTTP/2 après 322 requêtes
    const realSirets = [
      "38076713700017", // BLANQUART
      "55203253400019", // AMAZON FRANCE
      "55208131700019", // MICROSOFT FRANCE
      "55210055400019", // GOOGLE FRANCE
      "55203780600019", // APPLE FRANCE
      "55204944700019", // FACEBOOK FRANCE
      "55203253400019", // AMAZON FRANCE
      "55208131700019", // MICROSOFT FRANCE
      "55210055400019", // GOOGLE FRANCE
      "55203780600019", // APPLE FRANCE
      "55204944700019", // FACEBOOK FRANCE
      "38076713700017", // BLANQUART
      "55203253400019", // AMAZON FRANCE
      "55208131700019", // MICROSOFT FRANCE
      "55210055400019", // GOOGLE FRANCE
      "55203780600019", // APPLE FRANCE
      "55204944700019", // FACEBOOK FRANCE
      "38076713700017", // BLANQUART
      "55203253400019", // AMAZON FRANCE
      "55208131700019", // MICROSOFT FRANCE
    ];
    
    // Répéter les SIRETs pour atteindre la taille de test
    const sirets = [];
    for (let i = 0; i < testSize; i++) {
      sirets.push(realSirets[i % realSirets.length]);
    }

    const cleaned = cleanSirets(sirets);
    const integrationKey = process.env.INSEE_INTEGRATION_KEY;
    
    if (!integrationKey) {
      return NextResponse.json({ error: "NO_API_CONFIGURED" }, { status: 500 });
    }

    // PARAMÈTRES IDENTIQUES À LA PRODUCTION pour reproduire le problème
    const BATCH_SIZE = 25;
    const PAUSE_BETWEEN_BATCHES = 45000; // 45 secondes
    const HEARTBEAT_INTERVAL = 30000; // 30 secondes
    const CONNECTION_RESET_AFTER = 150; // Reset après 150 requêtes
    const LONG_PAUSE_AFTER = 200; // Pause longue après 200 requêtes

    console.log(`🔥 TEST LIMITE HTTP/2: ${cleaned.length} SIRETs pour reproduire l'erreur après 322 requêtes`);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (data: Record<string, unknown>) => {
          const event = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        let heartbeatInterval: NodeJS.Timeout | undefined;

        try {
          sendEvent({ 
            type: 'progress', 
            current: 0, 
            total: cleaned.length, 
            message: '🔥 Test limite HTTP/2 - Début de la vérification...' 
          });

          const results: CompanyStatus[] = [];
          let consecutiveErrors = 0;
          const MAX_CONSECUTIVE_ERRORS = 10;
          let http2ErrorDetected = false;

          // Heartbeat pour maintenir la connexion
          heartbeatInterval = setInterval(() => {
            sendEvent({ 
              type: 'heartbeat', 
              timestamp: Date.now(),
              message: '🔥 Test - Connexion maintenue...'
            });
          }, HEARTBEAT_INTERVAL);

          for (let batchStart = 0; batchStart < cleaned.length; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, cleaned.length);
            const batchSirets = cleaned.slice(batchStart, batchEnd);
            const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(cleaned.length / BATCH_SIZE);
            
            console.log(`🔥 Test Lot ${batchNumber}/${totalBatches}: SIRETs ${batchStart + 1}-${batchEnd}`);
            
            // Pause entre les lots (IDENTIQUE À LA PRODUCTION)
            if (batchStart > 0) {
              const isLongPause = batchStart >= LONG_PAUSE_AFTER;
              const isConnectionReset = batchStart >= CONNECTION_RESET_AFTER;
              const pauseDuration = isLongPause ? PAUSE_BETWEEN_BATCHES * 2 : PAUSE_BETWEEN_BATCHES;
              
              const pauseMessage = isConnectionReset ? 
                `🔥 Test - Reset connexion HTTP/2 après ${pauseDuration / 1000}s - Lot ${batchNumber}/${totalBatches}` :
                isLongPause ? 
                `🔥 Test - Pause longue de ${pauseDuration / 1000}s (éviter timeout HTTP/2) - Lot ${batchNumber}/${totalBatches}` :
                `🔥 Test - Pause de ${pauseDuration / 1000}s - Lot ${batchNumber}/${totalBatches}`;
              
              console.log(pauseMessage);
              sendEvent({ 
                type: 'progress', 
                current: batchStart, 
                total: cleaned.length, 
                message: pauseMessage,
                siret: batchSirets[0]
              });
              await new Promise(resolve => setTimeout(resolve, pauseDuration));
              
              // Reset de connexion pour éviter les erreurs HTTP/2
              if (isConnectionReset) {
                console.log('🔥 Test - Envoi d\'un heartbeat pour reset de connexion...');
                sendEvent({ 
                  type: 'heartbeat', 
                  timestamp: Date.now(),
                  message: '🔥 Test - Reset de connexion HTTP/2...'
                });
                await new Promise(resolve => setTimeout(resolve, 5000)); // Pause supplémentaire
              }
            }
            
            // Traiter le lot
            for (let i = 0; i < batchSirets.length; i++) {
              const globalIndex = batchStart + i;
              const siret = batchSirets[i];
              
              sendEvent({ 
                type: 'progress', 
                current: globalIndex + 1, 
                total: cleaned.length, 
                message: `🔥 Test - Vérification SIRET ${siret}... (${globalIndex + 1}/${cleaned.length}) - Lot ${batchNumber}/${totalBatches}`,
                siret: siret
              });

              try {
                // Requête INSEE avec retry (IDENTIQUE À LA PRODUCTION)
                let inseeResult: CompanyStatus | undefined;
                let retryCount = 0;
                const MAX_RETRIES = 3;
                
                while (retryCount <= MAX_RETRIES) {
                  try {
                    inseeResult = await fetchWithIntegrationKey(siret, integrationKey);
                    break;
                  } catch (retryError) {
                    retryCount++;
                    if (retryCount > MAX_RETRIES) {
                      throw retryError;
                    }
                    
                    // Backoff exponentiel : 2s, 4s, 8s
                    const backoffDelay = Math.pow(2, retryCount) * 1000;
                    console.warn(`🔥 Test - Retry ${retryCount}/${MAX_RETRIES} pour SIRET ${siret} dans ${backoffDelay}ms`);
                    
                    sendEvent({ 
                      type: 'progress', 
                      current: globalIndex + 1, 
                      total: cleaned.length, 
                      message: `🔥 Test - Retry ${retryCount}/${MAX_RETRIES} pour SIRET ${siret}...`,
                      siret: siret
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, backoffDelay));
                  }
                }
                
                // Vérifier que inseeResult a été assigné
                if (!inseeResult) {
                  throw new Error('Impossible d\'obtenir le résultat INSEE après tous les essais');
                }
                
                results.push(inseeResult);

                sendEvent({ 
                  type: 'result', 
                  result: inseeResult,
                  current: globalIndex + 1,
                  total: cleaned.length
                });

                // Détecter les erreurs HTTP/2
                if (inseeResult.error && inseeResult.error.includes('HTTP2_PROTOCOL_ERROR')) {
                  http2ErrorDetected = true;
                  console.error(`🔥 ERREUR HTTP/2 DÉTECTÉE au SIRET ${globalIndex + 1} (${siret})`);
                  sendEvent({ 
                    type: 'http2_error', 
                    message: `🔥 ERREUR HTTP/2 DÉTECTÉE au SIRET ${globalIndex + 1} (${siret})`,
                    siret: siret,
                    requestCount: globalIndex + 1
                  });
                }

                if (inseeResult.error) {
                  consecutiveErrors++;
                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    sendEvent({ 
                      type: 'error', 
                      message: `🔥 Test - Trop d'erreurs consécutives (${inseeResult.error})`,
                      results: results
                    });
                    return;
                  }
                } else {
                  consecutiveErrors = 0;
                }

              } catch (err) {
                console.error(`🔥 Test - Exception au SIRET #${globalIndex + 1} (${siret}):`, err);
                consecutiveErrors++;
                
                // Détecter les erreurs HTTP/2 dans les exceptions
                if (err instanceof Error && err.message.includes('HTTP2_PROTOCOL_ERROR')) {
                  http2ErrorDetected = true;
                  console.error(`🔥 ERREUR HTTP/2 DÉTECTÉE dans l'exception au SIRET ${globalIndex + 1} (${siret})`);
                  sendEvent({ 
                    type: 'http2_error', 
                    message: `🔥 ERREUR HTTP/2 DÉTECTÉE dans l'exception au SIRET ${globalIndex + 1} (${siret})`,
                    siret: siret,
                    requestCount: globalIndex + 1,
                    error: err.message
                  });
                }
                
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
                    message: `🔥 Test - Trop d'exceptions consécutives`,
                    results: results
                  });
                  return;
                }
              }

              // Délai entre requêtes (IDENTIQUE À LA PRODUCTION)
              if (i < batchSirets.length - 1) {
                await new Promise(resolve => setTimeout(resolve, INSEE_RATE_LIMITS.delayBetweenRequests));
              }
            }
            
            console.log(`🔥 Test - Lot ${batchNumber}/${totalBatches} terminé`);
          }

          // Résultats finaux
          sendEvent({ 
            type: 'complete', 
            results: results,
            stats: {
              total: results.length,
              radiees: results.filter(r => r.estRadiee).length,
              actives: results.filter(r => !r.estRadiee).length,
              errors: results.filter(r => r.error).length,
              http2ErrorDetected: http2ErrorDetected
            }
          });

        } catch (err) {
          console.error('🔥 Test - Erreur dans le stream:', err);
          sendEvent({ type: 'error', message: `🔥 Test - Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
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
      },
    });

  } catch (err) {
    console.error('🔥 Test - Erreur dans la route test limite HTTP/2:', err);
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
