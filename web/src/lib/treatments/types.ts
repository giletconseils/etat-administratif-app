// Core treatment types and interfaces

export type TreatmentType = 'radiation-check' | 'ri-anomalies';

export interface TreatmentMetadata {
  id: TreatmentType;
  name: string;
  description: string;
  enabled: boolean; // Whether the treatment is fully implemented
  incompatibleWith?: TreatmentType[]; // Other treatments this one can't run with
}

export interface TreatmentResult {
  siret: string;
  treatmentType: TreatmentType;
  findings: Record<string, unknown>;
  error?: string;
}

export interface TreatmentExecutionContext {
  sirets: string[];
  data?: Array<{ siret: string; phone?: string; [key: string]: unknown }>;
}

export interface TreatmentExecutor {
  execute(context: TreatmentExecutionContext): Promise<TreatmentResult[]>;
}

