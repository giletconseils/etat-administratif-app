// Radiation check treatment executor
// This is a placeholder that will delegate to the existing streaming API

import { TreatmentExecutionContext, TreatmentResult } from '../types';
import { RadiationCheckFindings } from './types';

export async function executeRadiationCheck(
  context: TreatmentExecutionContext
): Promise<TreatmentResult[]> {
  // Note: The actual execution will be handled by the streaming API
  // This executor is mainly for structure and type safety
  // The real work happens in /api/check-siret/stream
  
  const results: TreatmentResult[] = context.sirets.map(siret => ({
    siret,
    treatmentType: 'radiation-check' as const,
    findings: {
      estRadiee: false,
      hasActiveProcedures: false,
    } as RadiationCheckFindings,
  }));

  return results;
}

