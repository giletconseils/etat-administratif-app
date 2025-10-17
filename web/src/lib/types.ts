// Types partagés pour l'application

export type CsvRow = Record<string, string>;

export type Checked = { 
  siret: string; 
  denomination?: string; 
  estRadiee: boolean; 
  dateCessation?: string | null; 
  error?: string; 
  phone?: string; 
  status_reseau?: string;
  fichier_source?: string;
  montant?: number;
  // Nouvelles propriétés pour les procédures BODACC
  procedure?: string;
  procedureType?: string;
  hasActiveProcedures?: boolean;
  bodaccError?: string;
};

export type HeaderMap = { 
  siret?: string; 
  phone?: string;
  montant?: string 
};

export type DetectionType = 'siret' | 'phone' | null;

export type DetectionResult = {
  type: 'siret' | 'phone' | 'error';
  column?: string;
  columnIndex?: number;
  message: string;
};

export type StreamingProgress = {
  current: number;
  total: number;
  message: string;
  currentSiret?: string;
};

export type Stats = {
  total: number;
  radiees: number;
  enProcedure?: number;
  radieesOuEnProcedure?: number;
  actives: number;
  current: number;
};

export type EnabledStatuses = Record<string, boolean>;

export type JoinRequest = {
  sirets: string[];
  enabledStatuses: EnabledStatuses;
  csvData?: string;
};

export type PhoneJoinRequest = {
  phones: string[];
  enabledStatuses: EnabledStatuses;
  csvData?: string;
};

export type SubcontractorData = {
  siret?: string;
  Siret?: string;
  SIRET?: string;
  name?: string;
  denomination?: string;
  Denomination?: string;
  phone_mobile?: string;
  phone_secretary?: string;
  phone?: string;
  tel?: string;
  status?: string;
  status_reseau?: string;
  fichier_source?: string;
  matched_phone?: string;
  [key: string]: unknown;
};

export type PhoneJoinResult = {
  matched: SubcontractorData[];
  unmatched: { phone: string; error: string }[];
  stats: {
    totalPhones: number;
    matchedCount: number;
    unmatchedCount: number;
    byStatus: Record<string, number>;
  };
};

export type JoinResult = {
  matched: SubcontractorData[];
  unmatched: { siret: string }[];
  stats: {
    totalSirets?: number;
    totalPhones?: number;
    matchedCount: number;
    unmatchedCount: number;
    byStatus: Record<string, number>;
  };
};

// Mapping des codes de statut
export const STATUS_MAPPING: Record<number, string> = {
  5: 'TR',
  4: 'U3',
  3: 'U4',
  2: 'U2',
  1: 'U1',
  0: 'U1P'
};

// Statuts valides
export const VALID_STATUSES = ['TR', 'U1', 'U1P', 'U2', 'U3', 'U4'];

// Configuration par défaut des statuts activés
export const DEFAULT_ENABLED_STATUSES: EnabledStatuses = {
  'TR': true,
  'U1': true,
  'U1P': true,
  'U2': true,
  'U3': true,
  'U4': true
};
