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
    const { testSize = 50 }: { testSize?: number } = await req.json();
    
    // Générer des SIRETs de test (utiliser des SIRETs réels mais limités)
    const testSirets = [
      "38076713700017", // BLANQUART
      "55203253400019", // AMAZON
      "55208131700019", // MICROSOFT
      "55210055400019", // GOOGLE
      "55203780600019", // APPLE
      "55204944700019", // FACEBOOK
      "55208131700019", // MICROSOFT (duplicate for testing)
      "55210055400019", // GOOGLE (duplicate for testing)
      "55203780600019", // APPLE (duplicate for testing)
      "55204944700019", // FACEBOOK (duplicate for testing)
    ];
    
    // Répéter les SIRETs pour atteindre la taille de test
    const sirets = [];
    for (let i = 0; i < testSize; i++) {
      sirets.push(testSirets[i % testSirets.length]);
    }

    const cleaned = cleanSirets(sirets);
    const integrationKey = process.env.INSEE_INTEGRATION_KEY;
    
    if (!integrationKey) {
      return NextResponse.json({ error: "NO_API_CONFIGURED" }, { status: 500 });
    }

    // Mode test avec paramètres optimisés
    const BATCH_SIZE = 10; // Petits lots pour le test
    const PAUSE_BETWEEN_BATCHES = 5000; // 5 secondes seulement
    const HEARTBEAT_INTERVAL = 10000; // 10 secondes
    const CONNECTION_RESET_AFTER = 30; // Reset après 30 requêtes

    console.log(`🧪 MODE TEST: Traitement de ${cleaned.length} SIRETs par lots de ${BATCH_SIZE}`);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (data: Record<string, unknown>) => {
          const event = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        let heartbeatInterval: NodeJS.Timeout | undefined;

        try {
          sendEvent({ type: 'progress', current: 0, total: cleaned.length, message: '🧪 Mode test - Début de la vérification...' });

          const results: CompanyStatus[] = [];
          let consecutiveErrors = 0;
          const MAX_CONSECUTIVE_ERRORS = 5;

          // Heartbeat pour maintenir la connexion
          heartbeatInterval = setInterval(() => {
            sendEvent({ 
              type: 'heartbeat', 
              timestamp: Date.now(),
              message: '🧪 Test - Connexion maintenue...'
            });
          }, HEARTBEAT_INTERVAL);

          for (let batchStart = 0; batchStart < cleaned.length; batchStart += BATCH_SIZE) {
            const batchEnd = Math.min(batchStart + BATCH_SIZE, cleaned.length);
            const batchSirets = cleaned.slice(batchStart, batchEnd);
            const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(cleaned.length / BATCH_SIZE);
            
            console.log(`🧪 Test Lot ${batchNumber}/${totalBatches}: SIRETs ${batchStart + 1}-${batchEnd}`);
            
            // Pause entre les lots
            if (batchStart > 0) {
              const isConnectionReset = batchStart >= CONNECTION_RESET_AFTER;
              const pauseMessage = isConnectionReset ? 
                `🧪 Test - Reset connexion après 5s - Lot ${batchNumber}/${totalBatches}` :
                `🧪 Test - Pause de 5s - Lot ${batchNumber}/${totalBatches}`;
              
              sendEvent({ 
                type: 'progress', 
                current: batchStart, 
                total: cleaned.length, 
                message: pauseMessage,
                siret: batchSirets[0]
              });
              await new Promise(resolve => setTimeout(resolve, PAUSE_BETWEEN_BATCHES));
              
              // Reset de connexion
              if (isConnectionReset) {
                sendEvent({ 
                  type: 'heartbeat', 
                  timestamp: Date.now(),
                  message: '🧪 Test - Reset de connexion HTTP/2...'
                });
                await new Promise(resolve => setTimeout(resolve, 2000));
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
                message: `🧪 Test - Vérification SIRET ${siret}... (${globalIndex + 1}/${cleaned.length})`,
                siret: siret
              });

              try {
                // Requête INSEE avec retry
                let inseeResult;
                let retryCount = 0;
                const MAX_RETRIES = 2; // Moins de retries pour le test
                
                while (retryCount <= MAX_RETRIES) {
                  try {
                    inseeResult = await fetchWithIntegrationKey(siret, integrationKey);
                    break;
                  } catch (retryError) {
                    retryCount++;
                    if (retryCount > MAX_RETRIES) {
                      throw retryError;
                    }
                    
                    const backoffDelay = Math.pow(2, retryCount) * 1000;
                    console.warn(`🧪 Test - Retry ${retryCount}/${MAX_RETRIES} pour SIRET ${siret}`);
                    
                    sendEvent({ 
                      type: 'progress', 
                      current: globalIndex + 1, 
                      total: cleaned.length, 
                      message: `🧪 Test - Retry ${retryCount}/${MAX_RETRIES} pour SIRET ${siret}...`,
                      siret: siret
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, backoffDelay));
                  }
                }
                
                results.push(inseeResult);

                sendEvent({ 
                  type: 'result', 
                  result: inseeResult,
                  current: globalIndex + 1,
                  total: cleaned.length
                });

                if (inseeResult.error) {
                  consecutiveErrors++;
                  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                    sendEvent({ 
                      type: 'error', 
                      message: `🧪 Test - Trop d'erreurs consécutives (${inseeResult.error})`,
                      results: results
                    });
                    return;
                  }
                } else {
                  consecutiveErrors = 0;
                }

              } catch (err) {
                console.error(`🧪 Test - Exception au SIRET #${globalIndex + 1} (${siret}):`, err);
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
                    message: `🧪 Test - Trop d'exceptions consécutives`,
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
            
            console.log(`🧪 Test - Lot ${batchNumber}/${totalBatches} terminé`);
          }

          // Résultats finaux
          sendEvent({ 
            type: 'complete', 
            results: results,
            stats: {
              total: results.length,
              radiees: results.filter(r => r.estRadiee).length,
              actives: results.filter(r => !r.estRadiee).length,
              errors: results.filter(r => r.error).length
            }
          });

        } catch (err) {
          console.error('🧪 Test - Erreur dans le stream:', err);
          sendEvent({ type: 'error', message: `🧪 Test - Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` });
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
    console.error('🧪 Test - Erreur dans la route test:', err);
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
