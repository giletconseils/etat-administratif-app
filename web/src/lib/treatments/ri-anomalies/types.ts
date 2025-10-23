// Types specific to RI anomalies detection treatment

export interface RIAnomaliesResult {
  siret: string;
  hasAnomalies: boolean;
  anomalies?: RIAnomaly[];
  error?: string;
}

export interface RIAnomaly {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  details?: Record<string, unknown>;
}

export interface RIAnomaliesFindings {
  hasAnomalies: boolean;
  anomalies: RIAnomaly[];
  totalAnomalies: number;
}

