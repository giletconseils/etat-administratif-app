import { useState, useCallback } from 'react';
import { Checked, StreamingProgress } from '../types';

export function useApiStreaming() {
  const [streamingResults, setStreamingResults] = useState<Checked[]>([]);
  const [streamingProgress, setStreamingProgress] = useState<StreamingProgress | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [shouldStopScan, setShouldStopScan] = useState(false);

  const streamApiResults = useCallback(async (
    unmatchedSirets: string[],
    data?: { siret: string; phone?: string }[]
  ): Promise<Checked[]> => {
    console.log('[DEBUG] streamApiResults called with sirets:', unmatchedSirets);
    if (unmatchedSirets.length === 0) return [];

    const response = await fetch("/api/check-siret/websocket", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
      body: JSON.stringify({ 
        sirets: unmatchedSirets,
        data
      }),
    });
    
    console.log('[DEBUG] Stream response status:', response.status);

    if (!response.ok) {
      throw new Error('Erreur lors du streaming des résultats');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Impossible de lire le stream');
    }

    const decoder = new TextDecoder();
    const results: Checked[] = [];

    try {
      while (true) {
        // Vérifier si l'utilisateur veut arrêter le scan
        if (shouldStopScan) {
          console.log('Scan arrêté par l\'utilisateur');
          setStreamingProgress(null);
          setIsScanning(false);
          return results;
        }

        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setStreamingProgress({
                  current: data.current,
                  total: data.total,
                  message: data.message,
                  currentSiret: data.siret
                });
              } else if (data.type === 'result') {
                results.push(data.result);
                setStreamingResults([...results]);
              } else if (data.type === 'complete') {
                console.log('[DEBUG] Complete event received:', data);
                console.log('[DEBUG] Complete results for BLANQUART:', data.results?.find((r: Checked) => r.siret === '38076713700017'));
                setStreamingProgress(null);
                setIsScanning(false);
                setStreamingResults(data.results);
                return data.results;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('Erreur parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      setIsScanning(false);
    }

    console.log('[DEBUG] streamApiResults finished, returning results:', results.length);
    return results;
  }, [shouldStopScan]);

  const startScan = useCallback(() => {
    setIsScanning(true);
    setShouldStopScan(false);
    setStreamingResults([]);
    setStreamingProgress(null);
  }, []);

  const stopScan = useCallback(() => {
    setShouldStopScan(true);
    setIsScanning(false);
  }, []);

  const reset = useCallback(() => {
    setStreamingResults([]);
    setStreamingProgress(null);
    setIsScanning(false);
    setShouldStopScan(false);
  }, []);

  return {
    streamingResults,
    streamingProgress,
    isScanning,
    shouldStopScan,
    streamApiResults,
    startScan,
    stopScan,
    reset,
    setStreamingResults
  };
}
