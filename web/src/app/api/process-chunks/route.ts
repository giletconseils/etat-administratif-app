import { NextRequest, NextResponse } from "next/server";
import { cleanSirets } from "@/lib/insee-api";

export async function POST(req: NextRequest) {
  try {
    const { sirets } = await req.json();
    const cleaned = cleanSirets(sirets);
    
    // Diviser en chunks de 200 entreprises
    const CHUNK_SIZE = 200;
    const chunks = [];
    
    for (let i = 0; i < cleaned.length; i += CHUNK_SIZE) {
      chunks.push(cleaned.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`📦 Divisé ${cleaned.length} SIRETs en ${chunks.length} chunks de ${CHUNK_SIZE}`);
    
    const results = [];
    
    // Traiter chaque chunk séparément
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🔄 Traitement chunk ${i + 1}/${chunks.length} (${chunk.length} SIRETs)`);
      
      try {
        // Appeler l'API de streaming pour ce chunk
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/check-siret/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sirets: chunk })
        });
        
        if (!response.ok) {
          throw new Error(`Chunk ${i + 1} failed: ${response.status}`);
        }
        
        // Lire le stream de résultats
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader');
        
        const decoder = new TextDecoder();
        let chunkResults = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'result') {
                  chunkResults.push(data.result);
                } else if (data.type === 'complete') {
                  chunkResults = data.results;
                  break;
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
        
        results.push(...chunkResults);
        console.log(`✅ Chunk ${i + 1} terminé: ${chunkResults.length} résultats`);
        
        // Pause entre chunks (sauf le dernier)
        if (i < chunks.length - 1) {
          console.log(`⏸️ Pause 2 minutes avant chunk ${i + 2}...`);
          await new Promise(resolve => setTimeout(resolve, 120000)); // 2 minutes
        }
        
      } catch (error) {
        console.error(`❌ Erreur chunk ${i + 1}:`, error);
        // Continuer avec le chunk suivant
      }
    }
    
    return NextResponse.json({ 
      success: true,
      totalProcessed: results.length,
      totalChunks: chunks.length,
      results 
    });
    
  } catch (error) {
    console.error('Erreur process-chunks:', error);
    return NextResponse.json({ error: "chunk_processing_failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 900; // 15 minutes max
