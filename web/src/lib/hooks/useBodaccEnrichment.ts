import { useState, useCallback } from 'react';
import { Checked } from '@/lib/types';

export interface BodaccEnrichmentStats {
  total: number;
  withProcedures: number;
  withActiveProcedures: number;
  errors: number;
}

export interface UseBodaccEnrichmentReturn {
  enrichWithBodacc: (companies: Checked[]) => Promise<Checked[]>;
  isEnriching: boolean;
  enrichmentStats: BodaccEnrichmentStats | null;
  error: string | null;
  resetEnrichment: () => void;
}

export function useBodaccEnrichment(): UseBodaccEnrichmentReturn {
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentStats, setEnrichmentStats] = useState<BodaccEnrichmentStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enrichWithBodacc = useCallback(async (companies: Checked[]): Promise<Checked[]> => {
    if (!companies || companies.length === 0) {
      return companies;
    }

    setIsEnriching(true);
    setError(null);

    try {
      console.log(`Starting BODACC enrichment for ${companies.length} companies`);

      const response = await fetch('/api/enrich-bodacc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companies: companies.map(company => ({
            siret: company.siret,
            denomination: company.denomination,
            estRadiee: company.estRadiee,
            dateCessation: company.dateCessation,
            phone: company.phone,
            status_reseau: company.status_reseau,
            fichier_source: company.fichier_source,
            montant: company.montant,
            error: company.error
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setEnrichmentStats(data.stats);

      console.log('BODACC enrichment completed:', data.stats);
      return data.enrichedCompanies;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during BODACC enrichment';
      console.error('BODACC enrichment error:', err);
      setError(errorMessage);
      return companies; // Retourner les données originales en cas d'erreur
    } finally {
      setIsEnriching(false);
    }
  }, []);

  const resetEnrichment = useCallback(() => {
    setEnrichmentStats(null);
    setError(null);
  }, []);

  return {
    enrichWithBodacc,
    isEnriching,
    enrichmentStats,
    error,
    resetEnrichment
  };
}
