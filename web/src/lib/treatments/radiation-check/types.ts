// Types specific to radiation check treatment

export interface RadiationCheckResult {
  siret: string;
  denomination?: string;
  estRadiee: boolean;
  dateCessation?: string | null;
  hasActiveProcedures?: boolean;
  procedure?: string;
  procedureType?: string;
  error?: string;
  bodaccError?: string;
}

export interface RadiationCheckFindings {
  estRadiee: boolean;
  dateCessation?: string | null;
  hasActiveProcedures: boolean;
  procedure?: string;
  procedureType?: string;
  denomination?: string;
  bodaccError?: string;
  [key: string]: unknown; // Index signature for compatibility with Record<string, unknown>
}

