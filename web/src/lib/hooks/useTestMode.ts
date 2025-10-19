import { useState, useCallback } from 'react';
import { Checked, StreamingProgress } from '../types';

export function useTestMode() {
  const [testResults, setTestResults] = useState<Checked[]>([]);
  const [testProgress, setTestProgress] = useState<StreamingProgress | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [shouldStopTest, setShouldStopTest] = useState(false);

  const runTest = useCallback(async (testSize: number = 50): Promise<Checked[]> => {
    console.log('[TEST] Starting test with size:', testSize);
    if (testSize <= 0) return [];

    const response = await fetch("/api/test-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testSize }),
    });
    
    console.log('[TEST] Test response status:', response.status);

    if (!response.ok) {
      throw new Error('Erreur lors du test de streaming');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Impossible de lire le stream de test');
    }

    const decoder = new TextDecoder();
    const results: Checked[] = [];

    try {
      while (true) {
        if (shouldStopTest) {
          console.log('[TEST] Test arrêté par l\'utilisateur');
          setTestProgress(null);
          setIsTestRunning(false);
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
                setTestProgress({
                  current: data.current,
                  total: data.total,
                  message: data.message,
                  currentSiret: data.siret
                });
              } else if (data.type === 'result') {
                results.push(data.result);
                setTestResults([...results]);
              } else if (data.type === 'complete') {
                console.log('[TEST] Test completed:', data);
                setTestProgress(null);
                setIsTestRunning(false);
                setTestResults(data.results);
                return data.results;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              } else if (data.type === 'heartbeat') {
                console.log('[TEST] Heartbeat received:', data.message);
              }
            } catch (e) {
              console.error('[TEST] Erreur parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      setIsTestRunning(false);
    }

    console.log('[TEST] Test finished, returning results:', results.length);
    return results;
  }, [shouldStopTest]);

  const startTest = useCallback((testSize: number = 50) => {
    setIsTestRunning(true);
    setShouldStopTest(false);
    setTestResults([]);
    setTestProgress(null);
    return runTest(testSize);
  }, [runTest]);

  const stopTest = useCallback(() => {
    setShouldStopTest(true);
    setIsTestRunning(false);
  }, []);

  const resetTest = useCallback(() => {
    setTestResults([]);
    setTestProgress(null);
    setIsTestRunning(false);
    setShouldStopTest(false);
  }, []);

  return {
    testResults,
    testProgress,
    isTestRunning,
    shouldStopTest,
    startTest,
    stopTest,
    resetTest,
    setTestResults
  };
}
