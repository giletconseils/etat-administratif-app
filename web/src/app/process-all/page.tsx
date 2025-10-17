"use client";
import { useState } from "react";

export default function ProcessAllPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{
    currentChunk: number;
    totalChunks: number;
    currentSiret: number;
    totalSirets: number;
    results: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startProcessing = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress(null);

    try {
      // Récupérer tous les SIRETs de la base
      const response = await fetch('/api/join/simple-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sirets: [], // Liste vide = toute la base
          enabledStatuses: { TR: true, U1: true, U1P: true, U2: true, U3: true, U4: true }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur récupération base: ${response.status}`);
      }

      const data = await response.json();
      const allSirets = data.result.matched.map((item: any) => item.siret).filter(Boolean);
      
      console.log(`📊 ${allSirets.length} SIRETs à traiter`);
      
      // Lancer le traitement par chunks
      const chunkResponse = await fetch('/api/process-chunks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sirets: allSirets })
      });

      if (!chunkResponse.ok) {
        throw new Error(`Erreur traitement chunks: ${chunkResponse.status}`);
      }

      const result = await chunkResponse.json();
      
      setProgress({
        currentChunk: result.totalChunks,
        totalChunks: result.totalChunks,
        currentSiret: result.totalProcessed,
        totalSirets: allSirets.length,
        results: result.results
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-cursor-bg-primary">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-cursor-text-primary mb-2">
            Traitement complet de la base
          </h1>
          <p className="text-cursor-text-secondary">
            Traitement par chunks pour 10 000+ entreprises
          </p>
        </div>

        <div className="card-surface p-6 mb-6">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-medium text-cursor-text-primary mb-4">
                Traitement par chunks
              </h2>
              <p className="text-cursor-text-secondary mb-6">
                Divise automatiquement votre base en lots de 200 entreprises
                pour contourner la limite de 15 minutes de Vercel.
              </p>
              
              <button
                onClick={startProcessing}
                disabled={isProcessing}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="spinner-cursor"></div>
                    <span>Traitement en cours...</span>
                  </>
                ) : (
                  <span>Lancer le traitement complet</span>
                )}
              </button>
            </div>

            {progress && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-cursor-text-primary mb-2">
                    Progrès du traitement
                  </h3>
                  <div className="text-sm text-cursor-text-secondary">
                    Chunk {progress.currentChunk}/{progress.totalChunks} • 
                    {progress.currentSiret}/{progress.totalSirets} entreprises traitées
                  </div>
                </div>
                
                <div className="w-full bg-cursor-bg-tertiary rounded-full h-2">
                  <div 
                    className="bg-cursor-accent-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.currentSiret / progress.totalSirets) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800">
                  <strong>Erreur :</strong> {error}
                </div>
              </div>
            )}

            {progress && progress.results.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-cursor-text-primary mb-4">
                  Résultats ({progress.results.length} entreprises)
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {progress.results.slice(0, 10).map((result, index) => (
                    <div key={index} className="p-3 bg-cursor-bg-tertiary rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-sm">{result.siret}</span>
                        <span className={`text-sm ${result.estRadiee ? 'text-red-600' : 'text-green-600'}`}>
                          {result.estRadiee ? 'Radiée' : 'Active'}
                        </span>
                      </div>
                      {result.denomination && (
                        <div className="text-xs text-cursor-text-secondary mt-1">
                          {result.denomination}
                        </div>
                      )}
                    </div>
                  ))}
                  {progress.results.length > 10 && (
                    <div className="text-center text-sm text-cursor-text-secondary">
                      ... et {progress.results.length - 10} autres résultats
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
